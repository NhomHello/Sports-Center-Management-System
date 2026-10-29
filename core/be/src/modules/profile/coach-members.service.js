import { prisma, Enums } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { assignedEnrollments } from './coach-member-scope.service.js';
import { memberProfileView } from './profile.mapper.js';
import { calculateAttendance } from '../course-summary/course-attendance.service.js';
/** Chỉ danh tính/liên hệ cơ bản; danh sách không chứa ghi chú sức khoẻ. */
export const listAssignedMembers = async (query, actor) => {
  const rows = await assignedEnrollments(actor.id);
  const members = [...new Map(rows.map((r) => [r.memberId, r.member])).values()].filter(
    (m) =>
      !query.q ||
      `${m.fullName} ${m.email ?? ''} ${m.phone ?? ''}`
        .toLocaleLowerCase('vi')
        .includes(query.q.toLocaleLowerCase('vi')),
  );
  members.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi') || a.id - b.id);
  const { skip, take } = toPrismaPage(query);
  return {
    items: members.slice(skip, skip + take),
    meta: buildPageMeta({ ...query, total: members.length }),
  };
};
/** Chi tiết chỉ chứa chuyên cần/tổng kết thuộc lớp của HLV đó, không có dữ liệu tài chính. */
export const assignedMemberDetail = async (memberId, actor) => {
  const rows = await assignedEnrollments(actor.id, memberId);
  if (!rows.length) throw ApiError.forbidden('Hội viên ngoài phạm vi lớp được phân công');
  const classIds = rows.map((r) => r.classId);
  const [profile, attendance, summaries] = await Promise.all([
    prisma.memberProfile.findUnique({ where: { userId: memberId } }),
    prisma.attendance.findMany({ where: { memberId, session: { classId: { in: classIds } } } }),
    prisma.courseSummaryItem.findMany({
      where: {
        memberId,
        summary: {
          coachId: actor.id,
          classId: { in: classIds },
          status: Enums.CourseSummaryStatus.PUBLISHED,
        },
      },
      select: {
        id: true,
        result: true,
        progress: true,
        comment: true,
        nextCourse: true,
        summary: {
          select: { classId: true, publishedAt: true, gymClass: { select: { name: true } } },
        },
      },
    }),
  ]);
  const classes = rows.map((row) => {
    const sessions = row.gymClass.sessions.filter(
      (s) =>
        (s.coachId ?? row.gymClass.coachId) === actor.id &&
        s.endAt <= new Date() &&
        (!row.cancelledAt || s.startAt < row.cancelledAt),
    );
    return {
      id: row.classId,
      name: row.gymClass.name,
      attendance: calculateAttendance(
        sessions,
        attendance.filter((a) => sessions.some((s) => s.id === a.sessionId)),
        row.enrolledAt,
      ),
    };
  });
  return {
    ...rows[0].member,
    sharingEnabled: profile?.shareWithCoach ?? false,
    ...(profile?.shareWithCoach && { trainingProfile: memberProfileView(profile) }),
    classes,
    summaries,
  };
};
