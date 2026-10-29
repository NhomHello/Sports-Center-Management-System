import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';

/**
 * BR-2.13: lớp chưa huỷ (OPEN hoặc CLOSED) còn buổi tương lai do HLV này dạy. HLV của buổi là
 * session.coachId; buổi cũ chưa lưu coachId thì theo HLV mặc định của lớp.
 * @param {number} coachId
 * @param {Date} [now]
 */
export const coachFutureClassesWhere = (coachId, now = new Date()) => {
  const upcoming = { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: now } };
  return {
    status: { not: Enums.ClassStatus.CANCELLED },
    OR: [
      { sessions: { some: { ...upcoming, coachId } } },
      { coachId, sessions: { some: { ...upcoming, coachId: null } } },
    ],
  };
};

/** Không khoá HLV đang phụ trách lớp còn buổi tương lai. */
export const assertCoachCanBeDisabled = async (db, id) => {
  const assigned = await db.gymClass.count({ where: coachFutureClassesWhere(id) });
  if (assigned) throw ApiError.businessRule('Hãy chuyển các lớp đang phụ trách trước khi khoá HLV');
};
