import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { assertSessionWithinFrames } from '../operating-frame/operating-frame.service.js';
import { buildSessions, overlaps, validateResources } from './class-schedule.service.js';
import { originalStarts, planChanges } from './class-session-sync.service.js';
import { assertSessionResources } from './session-resource.service.js';
import { CLASS_INCLUDE } from './class.mapper.js';

const BOOKED = Enums.EnrollmentStatus.BOOKED;

/** Học viên của lớp và những người có buổi khác chồng lên các buổi mới (BR-2.15). */
const affectedMembers = async (db, classId, slots) => {
  const enrollments = await db.classEnrollment.findMany({
    where: { classId, status: BOOKED },
    select: { memberId: true, member: { select: { fullName: true } } },
  });
  const others = await db.classEnrollment.findMany({
    where: {
      memberId: { in: enrollments.map((e) => e.memberId) },
      classId: { not: classId },
      status: BOOKED,
    },
    select: {
      memberId: true,
      gymClass: {
        select: {
          name: true,
          sessions: {
            where: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: new Date() } },
            select: { startAt: true, endAt: true },
          },
        },
      },
    },
  });
  const conflicts = others
    .filter((o) => o.gymClass.sessions.some((s) => slots.some((slot) => overlaps(s, slot))))
    .map((o) => ({
      memberId: o.memberId,
      fullName: enrollments.find((e) => e.memberId === o.memberId).member.fullName,
      className: o.gymClass.name,
    }));
  return { enrolledCount: enrollments.length, conflicts };
};

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
      ...(await affectedMembers(db, id, sessions)),
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
    const slot = { startAt: new Date(data.startAt), endAt: new Date(data.endAt) };
    await assertSessionWithinFrames(db, slot);
    const resources = {
      roomId: session.roomId ?? session.gymClass.roomId,
      coachId: session.coachId ?? session.gymClass.coachId,
    };
    await assertSessionResources(db, [slot], resources, { ids: [id] });
    return affectedMembers(db, session.classId, [slot]);
  });
