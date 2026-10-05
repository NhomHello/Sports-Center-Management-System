import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { queueClassEvent } from './class-event.service.js';
import { refreshCancellationExceptions } from './class-exception.service.js';
import { CLASS_INCLUDE, toClassView } from './class.mapper.js';
import { buildSessions, validateResources } from './class-schedule.service.js';

const toData = (data) => ({
  ...data,
  startsOn: new Date(data.startsOn),
  endsOn: new Date(data.endsOn),
  registrationStartAt: new Date(data.registrationStartAt),
  registrationEndAt: new Date(data.registrationEndAt),
});

/** Tạo lớp và toàn bộ buổi trong một transaction. */
export const create = (data, actor) =>
  withScheduleTransaction(async (db) => {
    const sessions = buildSessions(data);
    const snapshots = await validateResources(db, data, sessions);
    const item = await db.gymClass.create({
      data: {
        ...toData(data),
        sessions: { create: sessions.map((s) => ({ ...s, ...snapshots })) },
      },
      include: CLASS_INCLUDE,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'GymClass',
      entityId: item.id,
      meta: data,
    });
    return toClassView(item);
  });

async function replaceFutureSessions(db, { old, actor, sessions, snapshots }) {
  const now = new Date();
  const ongoing = old.sessions.some(
    (s) => s.startAt <= now && s.endAt > now && s.status === Enums.SessionStatus.SCHEDULED,
  );
  if (ongoing) throw ApiError.businessRule('Không đổi lịch khi lớp đang có buổi diễn ra');
  await db.classSession.updateMany({
    where: { classId: old.id, startAt: { gt: now }, status: Enums.SessionStatus.SCHEDULED },
    data: { status: Enums.SessionStatus.CANCELLED },
  });
  await db.classSession.createMany({
    data: sessions.map((s) => ({
      ...s,
      ...snapshots,
      classId: old.id,
    })),
  });
  await refreshCancellationExceptions(db, old.id, sessions);
  await queueClassEvent(db, old, Enums.NotificationKind.CLASS_CHANGED, {
    actorId: actor.id,
    before: old.sessions.map((s) => ({
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      status: s.status,
    })),
    after: sessions.map((s) => ({
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
    })),
  });
}

/** Cập nhật cấu hình, giữ buổi quá khứ và thông báo khi lịch/phòng/HLV thực sự đổi. */
export const update = (id, data, actor) =>
  withScheduleTransaction(async (db) => {
    const old = await db.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (!old) throw ApiError.notFound('Không tìm thấy lớp');
    if (old.status === Enums.ClassStatus.CANCELLED)
      throw ApiError.businessRule('Lớp đã huỷ không thể sửa');
    if (data.capacity < old._count.enrollments)
      throw ApiError.businessRule('Sức chứa nhỏ hơn số người đã đăng ký');
    const sessions = buildSessions(data);
    const snapshots = await validateResources(db, data, sessions, id);
    const scheduleChanged =
      old.roomId !== data.roomId ||
      old.coachId !== data.coachId ||
      old.startsOn.toISOString().split('T')[0] !== data.startsOn ||
      old.endsOn.toISOString().split('T')[0] !== data.endsOn ||
      JSON.stringify(old.weeklySchedule) !== JSON.stringify(data.weeklySchedule);
    if (scheduleChanged) await replaceFutureSessions(db, { old, actor, sessions, snapshots });
    const item = await db.gymClass.update({
      where: { id },
      data: toData(data),
      include: CLASS_INCLUDE,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'GymClass',
      entityId: id,
      meta: data,
    });
    return toClassView(item);
  });

/** Huỷ lớp idempotent; outbox chụp người nhận trước khi huỷ đăng ký. */
export const cancel = (id, actor) =>
  withScheduleTransaction(async (db) => {
    const item = await db.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (!item) throw ApiError.notFound('Không tìm thấy lớp');
    if (item.status === Enums.ClassStatus.CANCELLED) return toClassView(item);
    await queueClassEvent(db, item, Enums.NotificationKind.CLASS_CANCELLED, { actorId: actor.id });
    await db.classSession.updateMany({
      where: { classId: id, startAt: { gt: new Date() }, status: Enums.SessionStatus.SCHEDULED },
      data: { status: Enums.SessionStatus.CANCELLED },
    });
    await db.classEnrollment.updateMany({
      where: { classId: id, status: Enums.EnrollmentStatus.BOOKED },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledBy: actor.id,
        cancelledAt: new Date(),
        exceptionUntil: null,
      },
    });
    const updated = await db.gymClass.update({
      where: { id },
      data: { status: Enums.ClassStatus.CANCELLED },
      include: CLASS_INCLUDE,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.DELETE,
      entity: 'GymClass',
      entityId: id,
    });
    return toClassView(updated);
  });
