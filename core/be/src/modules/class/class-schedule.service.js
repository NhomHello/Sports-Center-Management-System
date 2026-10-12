import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { CLASS_LIMITS, TIME } from '../../constants/index.js';

/**
 * Kiem tra hai khoang thoi gian co giao nhau hay khong.
 *
 * @param {{ startAt: Date, endAt: Date }} first
 * @param {{ startAt: Date, endAt: Date }} second
 * @returns {boolean}
 */
export const overlaps = (first, second) =>
  first.startAt < second.endAt && second.startAt < first.endAt;

/**
 * Sinh cac buoi hoc tu weeklySchedule.
 *
 * @param {object} data
 * @param {Date} now
 * @returns {Array<{ startAt: Date, endAt: Date }>}
 */
export const buildSessions = (data, now = new Date()) => {
  const start = new Date(`${data.startsOn}T00:00:00Z`);
  const end = new Date(`${data.endsOn}T00:00:00Z`);

  if ((end - start) / TIME.MS_PER_DAY > CLASS_LIMITS.MAX_SCHEDULE_DAYS) {
    throw ApiError.badRequest('Khoảng lịch vượt giới hạn xử lý');
  }

  const sessions = [];

  for (let day = start; day <= end; day = new Date(day.getTime() + TIME.MS_PER_DAY)) {
    const date = day.toISOString().split('T')[0];

    const slots = data.weeklySchedule.filter((slot) => slot.dayOfWeek === day.getUTCDay());

    sessions.push(
      ...slots.map((slot) => ({
        startAt: new Date(`${date}T${slot.startTime}:00+07:00`),
        endAt: new Date(`${date}T${slot.endTime}:00+07:00`),
      })),
    );
  }

  const futureSessions = sessions
    .filter((session) => session.startAt > now)
    .sort((first, second) => first.startAt - second.startAt);

  if (!futureSessions.length) {
    throw ApiError.businessRule('Lịch phải có ít nhất một buổi chưa diễn ra');
  }

  const hasInternalConflict = futureSessions.some(
    (session, index) => index > 0 && overlaps(session, futureSessions[index - 1]),
  );

  if (hasInternalConflict) {
    throw ApiError.businessRule('Các buổi trong lớp bị trùng nhau');
  }

  if (new Date(data.registrationEndAt) > futureSessions.at(-1).startAt) {
    throw ApiError.businessRule('Đăng ký phải đóng trước buổi cuối cùng');
  }

  return futureSessions;
};

const findResources = (db, data) =>
  Promise.all([
    db.subject.findFirst({
      where: {
        id: data.subjectId,
        isActive: true,
      },
    }),
    db.room.findFirst({
      where: {
        id: data.roomId,
        isActive: true,
      },
    }),
    db.user.findFirst({
      where: {
        id: data.coachId,
        status: Enums.UserStatus.ACTIVE,
        role: {
          permissions: {
            some: {
              permission: {
                code: PERMISSIONS.SCHEDULE_VIEW_TEACHING,
              },
            },
          },
        },
      },
    }),
  ]);

const assertResourcesAvailable = (subject, room, coach, capacity) => {
  if (!subject) {
    throw ApiError.businessRule('Bộ môn không tồn tại hoặc đã ngừng hoạt động');
  }

  if (!room) {
    throw ApiError.businessRule('Phòng không tồn tại hoặc đã ngừng hoạt động');
  }

  if (!coach) {
    throw ApiError.businessRule('HLV không tồn tại hoặc không hoạt động');
  }

  if (capacity > room.capacity) {
    throw ApiError.businessRule('Sức chứa lớp vượt sức chứa phòng');
  }
};

const findConflictingSessions = (db, data, sessions, excludeId) =>
  db.classSession.findMany({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      endAt: {
        gt: sessions[0].startAt,
      },
      startAt: {
        lt: sessions.at(-1).endAt,
      },
      gymClass: {
        ...(excludeId && {
          id: {
            not: excludeId,
          },
        }),
        status: {
          not: Enums.ClassStatus.CANCELLED,
        },
        OR: [
          {
            coachId: data.coachId,
          },
          {
            roomId: data.roomId,
          },
        ],
      },
    },
  });

const assertNoConflict = (sessions, existingSessions) => {
  const hasConflict = sessions.some((session) =>
    existingSessions.some((existing) => overlaps(session, existing)),
  );

  if (hasConflict) {
    throw ApiError.conflict('Phòng hoặc HLV bị trùng lịch');
  }
};

/**
 * Kiem tra bo mon, phong, HLV va xung dot lich.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} db
 * @param {object} data
 * @param {Array<{ startAt: Date, endAt: Date }>} sessions
 * @param {number | undefined} excludeId
 * @returns {Promise<void>}
 */
export const validateResources = async (db, data, sessions, excludeId) => {
  const [subject, room, coach] = await findResources(db, data);

  assertResourcesAvailable(subject, room, coach, data.capacity);

  const existingSessions = await findConflictingSessions(db, data, sessions, excludeId);

  assertNoConflict(sessions, existingSessions);
};
