import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { CLASS_LIMITS, TIME } from '../../constants/index.js';

/** Mốc nửa đêm Việt Nam; date-only không đi qua timezone của máy chạy. */
export const vietnamMidnight = (date) => new Date(`${date}T00:00:00+07:00`);
/** Hai khoảng liền nhau được phép; chỉ phần giao nhau thực sự là xung đột. */
export const overlaps = (a, b) => a.startAt < b.endAt && b.startAt < a.endAt;

/** Sinh từng buổi từ ngày/thứ/giờ địa phương rồi lưu UTC. */
export const buildSessions = (data, now = new Date()) => {
  const start = new Date(data.startsOn);
  const end = new Date(data.endsOn);
  if ((end - start) / TIME.MS_PER_DAY > CLASS_LIMITS.MAX_SCHEDULE_DAYS) {
    throw ApiError.badRequest('Khoảng lịch vượt giới hạn xử lý');
  }
  const sessions = [];
  for (let day = start; day <= end; day = new Date(day.getTime() + TIME.MS_PER_DAY)) {
    const date = day.toISOString().split('T')[0];
    const slots = data.weeklySchedule.filter((s) => s.dayOfWeek === day.getUTCDay());
    sessions.push(
      ...slots.map((slot) => ({
        startAt: new Date(`${date}T${slot.startTime}:00+07:00`),
        endAt: new Date(`${date}T${slot.endTime}:00+07:00`),
      })),
    );
  }
  const future = sessions.filter((s) => s.startAt > now).sort((a, b) => a.startAt - b.startAt);
  if (!future.length) throw ApiError.businessRule('Lịch phải có ít nhất một buổi chưa diễn ra');
  if (future.some((s, i) => i > 0 && overlaps(s, future[i - 1]))) {
    throw ApiError.businessRule('Các buổi trong lớp bị trùng nhau');
  }
  if (new Date(data.registrationEndAt) > future.at(-1).startAt) {
    throw ApiError.businessRule('Đăng ký phải đóng trước buổi cuối cùng');
  }
  return future;
};

/** BR-2.4: HLV/phòng hợp lệ và không trùng cả lớp OPEN lẫn CLOSED chưa huỷ. */
export const validateResources = async (db, data, sessions, excludeId) => {
  const [subject, room, coach] = await Promise.all([
    db.subject.findFirst({ where: { id: data.subjectId, isActive: true } }),
    db.room.findFirst({ where: { id: data.roomId, isActive: true } }),
    db.user.findFirst({
      where: {
        id: data.coachId,
        status: Enums.UserStatus.ACTIVE,
        role: {
          permissions: { some: { permission: { code: PERMISSIONS.SCHEDULE_VIEW_TEACHING } } },
        },
      },
    }),
  ]);
  if (!subject || !room || !coach)
    throw ApiError.businessRule('Bộ môn, phòng hoặc HLV không hoạt động');
  if (data.capacity > room.capacity)
    throw ApiError.businessRule('Sức chứa lớp vượt sức chứa phòng');
  const existing = await db.classSession.findMany({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      endAt: { gt: sessions[0].startAt },
      startAt: { lt: sessions.at(-1).endAt },
      gymClass: {
        ...(excludeId && { id: { not: excludeId } }),
        status: { not: Enums.ClassStatus.CANCELLED },
        OR: [{ coachId: data.coachId }, { roomId: data.roomId }],
      },
    },
  });
  if (sessions.some((s) => existing.some((old) => overlaps(s, old)))) {
    throw ApiError.conflict('Phòng hoặc HLV bị trùng lịch');
  }
  return { roomName: room.name, coachName: coach.fullName };
};
