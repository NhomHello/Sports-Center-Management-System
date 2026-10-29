import { prisma, Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { vietnamDay, nextDay } from '../../../src/common/utils/vietnam-date.js';
import { runCourseCompletion } from '../../../src/modules/course-summary/course-completion.job.js';
import { loadAttendance } from '../../../src/modules/course-summary/course-attendance.service.js';

/** Ba trạng thái trình diễn: đã công bố, đang nháp và nháp quá hạn. */
export const seedSprint4Courses = async ({ coach, members, room, subject }) => {
  const result = [];
  for (const [index, label] of ['Đã công bố', 'Chờ HLV nộp', 'Quá hạn nộp'].entries()) {
    const name = `S4 Demo · Khoá ${label}`;
    let item = await prisma.gymClass.findFirst({ where: { name } });
    if (!item) {
      const daysAgo = [5, 2, 12][index];
      const end = new Date(vietnamDay().getTime() - daysAgo * TIME.MS_PER_DAY + 10 * TIME.MS_PER_HOUR);
      item = await prisma.gymClass.create({ data: { name, subjectId: subject.id, roomId: room.id, coachId: coach.id,
        capacity: 15, price: 900000, startsOn: new Date(end.getTime() - 4 * TIME.MS_PER_DAY), endsOn: end,
        weeklySchedule: [], registrationStartAt: new Date(end.getTime() - 15 * TIME.MS_PER_DAY), registrationEndAt: new Date(end.getTime() - 6 * TIME.MS_PER_DAY),
        sessions: { create: [4, 2, 0].map((days) => ({ startAt: new Date(end.getTime() - days * TIME.MS_PER_DAY - TIME.MS_PER_HOUR),
          endAt: new Date(end.getTime() - days * TIME.MS_PER_DAY), coachId: coach.id, roomId: room.id, coachName: coach.fullName, roomName: room.name })) } } });
    }
    const sessions = await prisma.classSession.findMany({ where: { classId: item.id } });
    for (const [i, member] of members.entries()) {
      await prisma.classEnrollment.upsert({ where: { classId_memberId: { classId: item.id, memberId: member.id } }, update: {},
        create: { classId: item.id, memberId: member.id, enrolledBy: coach.id, enrolledAt: item.registrationEndAt } });
      await prisma.attendance.createMany({ skipDuplicates: true, data: sessions.map((session, j) => ({ sessionId: session.id, memberId: member.id,
        actorId: coach.id, status: i === 2 && j !== 0 ? Enums.AttendanceStatus.ABSENT : Enums.AttendanceStatus.PRESENT })) });
    }
    await runCourseCompletion(new Date(), item.id);
    if (index === 0) await publishDemo(item, members);
    result.push(item);
  }
  return result;
};
async function publishDemo(item, members) {
  const summary = await prisma.courseSummary.findUnique({ where: { classId: item.id }, include: { items: true, gymClass: true } });
  if (summary.status === Enums.CourseSummaryStatus.PUBLISHED) return;
  const attendance = await loadAttendance(prisma, summary);
  for (const [i, entry] of summary.items.entries()) await prisma.courseSummaryItem.update({ where: { id: entry.id }, data: {
    result: i === 2 ? Enums.CourseResult.NOT_PASSED : Enums.CourseResult.PASS, progress: i === 2 ? 2 : 4,
    comment: i === 2 ? 'Cần duy trì đi học để tăng tiến bộ.' : 'Tiến bộ tốt, thực hiện động tác an toàn.', nextCourse: 'Fitness nâng cao', attendanceSnapshot: attendance.get(entry.id) } });
  await prisma.courseSummary.update({ where: { id: summary.id }, data: { status: Enums.CourseSummaryStatus.PUBLISHED, revision: 1,
    publishedAt: nextDay(vietnamDay(new Date(item.endsOn))) } });
  for (const [i, member] of members.entries()) await prisma.courseRating.upsert({ where: { classId_memberId: { classId: item.id, memberId: member.id } }, update: {}, create: {
    classId: item.id, memberId: member.id, coachId: item.coachId, courseStars: i === 2 ? 3 : 5, coachStars: 5,
    comment: 'HLV hướng dẫn rõ ràng, không khí lớp thân thiện. (Demo)' } });
}
