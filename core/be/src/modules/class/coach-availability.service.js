import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';

/** Không khoá HLV đang phụ trách lớp còn buổi tương lai. */
export const assertCoachCanBeDisabled = async (db, id) => {
  const assigned = await db.gymClass.count({
    where: {
      coachId: id,
      status: { not: Enums.ClassStatus.CANCELLED },
      sessions: { some: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: new Date() } } },
    },
  });
  if (assigned) throw ApiError.businessRule('Hãy chuyển các lớp đang phụ trách trước khi khoá HLV');
};
