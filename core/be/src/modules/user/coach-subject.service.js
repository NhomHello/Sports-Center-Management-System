import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';

const TEACHING = { permission: { code: PERMISSIONS.SCHEDULE_VIEW_TEACHING } };

/** Include cho danh sách tài khoản: tài khoản có dạy được không và chuyên môn hiện tại. */
export const USER_TEACHING_INCLUDE = {
  role: {
    select: {
      id: true,
      code: true,
      name: true,
      isDefault: true,
      permissions: { where: TEACHING, select: { permissionId: true } },
    },
  },
  coachSubjects: { select: { subject: { select: { id: true, name: true } } } },
};

/** Gắn canTeach + subjects, bỏ dữ liệu quyền thô khỏi response. */
export const withTeaching = ({ role, coachSubjects, ...user }) => {
  const { permissions, ...publicRole } = role;
  return {
    ...user,
    role: publicRole,
    canTeach: permissions.length > 0,
    subjects: coachSubjects.map((row) => row.subject),
  };
};

/** Không bỏ chuyên môn khi HLV còn buổi dạy tương lai của bộ môn đó. */
const assertNotTeachingRemoved = async (db, coachId, subjectIds) => {
  const session = await db.classSession.findFirst({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      startAt: { gt: new Date() },
      OR: [{ coachId }, { coachId: null, gymClass: { coachId } }],
      gymClass: { subjectId: { notIn: subjectIds }, status: { not: Enums.ClassStatus.CANCELLED } },
    },
    select: { gymClass: { select: { name: true } } },
  });
  if (session)
    throw ApiError.businessRule(
      `HLV còn dạy lớp "${session.gymClass.name}"; đổi HLV lớp đó trước khi bỏ chuyên môn`,
    );
};

/**
 * Khai báo bộ môn HLV được phân công dạy (thay toàn bộ danh sách).
 * @param {number} coachId
 * @param {number[]} subjectIds
 * @param {{ id: number }} actor
 */
export const setCoachSubjects = (coachId, subjectIds, actor) =>
  withScheduleTransaction(async (db) => {
    const coach = await db.user.findFirst({
      where: { id: coachId, role: { permissions: { some: TEACHING } } },
    });
    if (!coach) throw ApiError.businessRule('Tài khoản này không phải huấn luyện viên');
    const active = await db.subject.count({ where: { id: { in: subjectIds }, isActive: true } });
    if (active !== subjectIds.length)
      throw ApiError.businessRule('Có bộ môn không tồn tại hoặc đã ngừng hoạt động');
    await assertNotTeachingRemoved(db, coachId, subjectIds);
    await db.coachSubject.deleteMany({ where: { coachId } });
    await db.coachSubject.createMany({
      data: subjectIds.map((subjectId) => ({ coachId, subjectId })),
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'CoachSubject',
      entityId: coachId,
      meta: { subjectIds },
    });
    return db.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
  });
