import { compensateSessionCancelled } from '../cancellation/center-cancel.service.js';
import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { queueClassEvent } from './class-event.service.js';
import { refreshCancellationExceptions } from './class-exception.service.js';
import { createForUsers } from '../notification/notification.service.js';
import { assertSessionResources } from './session-resource.service.js';
import { assertSessionWithinFrames } from '../operating-frame/operating-frame.service.js';
import { assertCoachTeachesSubject, COACH_WITH_SUBJECTS } from './class-schedule.service.js';

/** Buổi chưa diễn ra mới được thay đổi; buổi huỷ lặp không phát sinh thông báo. */
export const loadFutureSession = async (db, id) => {
  const session = await db.classSession.findUnique({ where: { id }, include: { gymClass: true } });
  if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
  if (session.startAt <= new Date()) throw ApiError.businessRule('Buổi học đã bắt đầu');
  return session;
};

/** Huỷ giữ lịch sử, outbox và audit commit cùng trạng thái mới. */
export const cancelSession = async (db, session, reason, actor) => {
  if (session.status === Enums.SessionStatus.CANCELLED) return session;
  const result = await db.classSession.update({
    where: { id: session.id },
    data: { status: Enums.SessionStatus.CANCELLED },
  });
  await compensateSessionCancelled(db, session, actor);
  await queueClassEvent(db, session.gymClass, Enums.NotificationKind.CLASS_CANCELLED, {
    sessionId: session.id,
    sessionStartAt: session.startAt.toISOString(),
    reason,
    actorId: actor.id,
  });
  await writeScheduleAudit(db, actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: 'ClassSession',
    entityId: session.id,
    meta: { reason },
  });
  return result;
};

/** BR-2.7/2.15: cảnh báo xung đột và ngoại lệ huỷ, không tự huỷ đăng ký của hội viên. */
export const update = (id, data, actor) =>
  withScheduleTransaction(async (db) => {
    const session = await loadFutureSession(db, id);
    if (session.status !== Enums.SessionStatus.SCHEDULED)
      throw ApiError.conflict('Buổi học không còn theo lịch');
    const slot = { startAt: new Date(data.startAt), endAt: new Date(data.endAt) };
    if (
      slot.startAt.getTime() === session.startAt.getTime() &&
      slot.endAt.getTime() === session.endAt.getTime()
    )
      return { ...session, conflicts: [] };
    if (slot.startAt <= new Date()) throw ApiError.businessRule('Lịch mới phải ở tương lai');
    const resources = {
      roomId: session.roomId ?? session.gymClass.roomId,
      coachId: session.coachId ?? session.gymClass.coachId,
    };
    await assertSessionWithinFrames(db, slot);
    await assertSessionResources(db, [slot], resources, { ids: [id] });
    const result = await db.classSession.update({
      where: { id },
      data: { ...slot, rescheduledAt: new Date() },
    });
    const future = await db.classSession.findMany({
      where: {
        classId: session.classId,
        status: Enums.SessionStatus.SCHEDULED,
        startAt: { gt: new Date() },
      },
      orderBy: { startAt: 'asc' },
    });
    await refreshCancellationExceptions(db, session.classId, future);
    await queueClassEvent(db, session.gymClass, Enums.NotificationKind.CLASS_CHANGED, {
      sessionId: id,
      actorId: actor.id,
      before: { startAt: session.startAt.toISOString(), endAt: session.endAt.toISOString() },
      after: data,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'ClassSession',
      entityId: id,
      meta: data,
    });
    const conflicts = await db.classEnrollment.findMany({
      where: {
        classId: session.classId,
        status: Enums.EnrollmentStatus.BOOKED,
        exceptionUntil: { not: null },
      },
      select: { memberId: true, exceptionUntil: true },
    });
    return { ...result, conflicts };
  });

/** Huỷ một buổi đã chọn, dùng chung với bảo trì phòng. */
export const cancel = (id, reason, actor) =>
  withScheduleTransaction(async (db) =>
    cancelSession(db, await loadFutureSession(db, id), reason, actor),
  );

/** Đổi HLV từ mốc ngày, giữ nguyên HLV của các buổi đã qua. */
export const changeCoach = (classId, data, actor) =>
  withScheduleTransaction(async (db) => {
    const item = await db.gymClass.findUnique({ where: { id: classId } });
    if (!item) throw ApiError.notFound('Không tìm thấy lớp');
    if (item.status === Enums.ClassStatus.CANCELLED) throw ApiError.conflict('Lớp đã huỷ');
    const coach = await db.user.findFirst({
      where: {
        id: data.coachId,
        status: Enums.UserStatus.ACTIVE,
        role: { permissions: { some: { permission: { code: P.SCHEDULE_VIEW_TEACHING } } } },
      },
      include: COACH_WITH_SUBJECTS,
    });
    if (!coach)
      throw ApiError.businessRule('HLV mới không hoạt động hoặc không có quyền giảng dạy');
    assertCoachTeachesSubject(coach, item.subjectId);
    const from = data.from ? new Date(`${data.from}T00:00:00+07:00`) : new Date();
    const all = await db.classSession.findMany({
      where: { classId, status: Enums.SessionStatus.SCHEDULED, startAt: { gt: new Date() } },
      orderBy: { startAt: 'asc' },
    });
    const sessions = all.filter((s) => s.startAt >= from);
    if (!sessions.length) throw ApiError.businessRule('Không có buổi tương lai cần đổi HLV');
    for (const session of sessions)
      await assertSessionResources(
        db,
        [session],
        { roomId: session.roomId ?? item.roomId, coachId: coach.id },
        { ids: sessions.map((s) => s.id) },
      );
    await db.classSession.updateMany({
      where: { id: { in: sessions.map((s) => s.id) } },
      data: { coachId: coach.id, coachName: coach.fullName },
    });
    if (sessions.length === all.length)
      await db.gymClass.update({ where: { id: classId }, data: { coachId: coach.id } });
    await queueClassEvent(db, item, Enums.NotificationKind.CLASS_CHANGED, {
      actorId: actor.id,
      coachId: coach.id,
      coachName: coach.fullName,
      sessionIds: sessions.map((s) => s.id),
    });
    await createForUsers({
      db,
      userIds: [
        ...new Set([item.coachId, ...sessions.map((s) => s.coachId).filter(Boolean), coach.id]),
      ],
      kind: Enums.NotificationKind.CLASS_CHANGED,
      title: 'Thay đổi HLV phụ trách',
      message: `Lớp ${item.name} thay đổi người dạy.`,
      eventKey: `coach-change:${classId}:${sessions[0].id}:${coach.id}:${Date.now()}`,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'GymClass',
      entityId: classId,
      meta: data,
    });
    return sessions.map((s) => ({ ...s, coachId: coach.id, coachName: coach.fullName }));
  });
