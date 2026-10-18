import { heldSeats } from './class-member-eligibility.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { queueClassEvent } from './class-event.service.js';
import { syncFutureSessions } from './class-session-sync.service.js';
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

/** Cập nhật cấu hình, giữ buổi quá khứ và thông báo khi lịch/phòng/HLV thực sự đổi. */
export const update = (id, data, actor) =>
  withScheduleTransaction(async (db) => {
    const old = await db.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (!old) throw ApiError.notFound('Không tìm thấy lớp');
    if (old.status === Enums.ClassStatus.CANCELLED)
      throw ApiError.businessRule('Lớp đã huỷ không thể sửa');
    if (data.capacity < old._count.enrollments + (await heldSeats(db, id, new Date())))
      throw ApiError.businessRule('Sức chứa nhỏ hơn số người đã đăng ký');
    const sessions = buildSessions(data);
    const snapshots = await validateResources(db, data, sessions, id);
    const scheduleChanged =
      old.roomId !== data.roomId ||
      old.coachId !== data.coachId ||
      old.startsOn.toISOString().split('T')[0] !== data.startsOn ||
      old.endsOn.toISOString().split('T')[0] !== data.endsOn ||
      JSON.stringify(old.weeklySchedule) !== JSON.stringify(data.weeklySchedule);
    if (scheduleChanged) await syncFutureSessions(db, { old, actor, sessions, snapshots });
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
    await db.classWaitlist.updateMany({
      where: {
        classId: id,
        status: { in: [Enums.WaitlistStatus.WAITING, Enums.WaitlistStatus.OFFERED] },
      },
      data: { status: Enums.WaitlistStatus.CANCELLED },
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
