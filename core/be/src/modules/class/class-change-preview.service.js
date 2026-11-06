import {
  assertRescheduleMembers,
  assertRescheduleNotice,
} from './class-reschedule-policy.service.js';
import { assertScheduleChange } from './class-schedule-change-policy.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { assertSessionWithinFrames } from '../operating-frame/operating-frame.service.js';
import { buildSessions, validateResources } from './class-schedule.service.js';
import { originalStarts, planChanges } from './class-session-sync.service.js';
import { assertSessionResources } from './session-resource.service.js';
import { CLASS_INCLUDE } from './class.mapper.js';

/**
 * Xem trước khi sửa lớp: kiểm tra đủ khung giờ, phòng, HLV (ném lỗi như khi lưu) và cho biết số
 * buổi bị huỷ/thêm/đổi cùng học viên bị trùng lịch, để quản lý xác nhận trước khi lưu.
 */
export const previewClassUpdate = (id, data) =>
  prisma.$transaction(async (db) => {
    const old = await db.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (!old) throw ApiError.notFound('Không tìm thấy lớp');
    const sessions = buildSessions(data);
    const snapshots = await validateResources(db, data, sessions, id);
    const future = old.sessions.filter((s) => s.startAt > new Date());
    const origins = await originalStarts(db, id, future);
    const plan = planChanges({ future, origins, template: sessions, old, snapshots });
    return {
      cancelled: plan.cancel.length,
      added: plan.create.length,
      changed: plan.updates.length,
      ...(await assertScheduleChange(db, { old, future, plan, snapshots })),
    };
  });

/** Xem trước khi đổi giờ một buổi: kiểm tra khung giờ, phòng/HLV và học viên bị trùng. */
export const previewSessionReschedule = (id, data) =>
  prisma.$transaction(async (db) => {
    const session = await db.classSession.findUnique({
      where: { id },
      include: { gymClass: true },
    });
    if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
    if (session.status !== Enums.SessionStatus.SCHEDULED || session.startAt <= new Date())
      throw ApiError.businessRule('Buổi học đã bắt đầu hoặc không còn theo lịch');
    const slot = { startAt: new Date(data.startAt), endAt: new Date(data.endAt) };
    if (
      slot.startAt.getTime() === session.startAt.getTime() &&
      slot.endAt.getTime() === session.endAt.getTime()
    )
      return { enrolledCount: 0, conflicts: [] };
    await assertRescheduleNotice([session.startAt, slot.startAt]);
    await assertSessionWithinFrames(db, slot);
    const resources = {
      roomId: session.roomId ?? session.gymClass.roomId,
      coachId: session.coachId ?? session.gymClass.coachId,
    };
    await assertSessionResources(db, [slot], resources, { ids: [id] });
    return assertRescheduleMembers(db, session.classId, [slot]);
  });
