import { prisma, Enums } from '../../../src/config/db.js';
import { loadAttendance } from '../../../src/modules/course-summary/course-attendance.service.js';
import { runCourseCompletion } from '../../../src/modules/course-summary/course-completion.job.js';

const SUMMARY_OBSERVATIONS = [
  'Em có mặt đều và giữ nhịp học ổn định.',
  'Em tiến bộ rõ ở những buổi cuối khóa.',
  'Em nên duy trì thói quen luyện tập thường xuyên.',
  'Em tiếp thu tốt các nội dung thực hành.',
  'Em có tinh thần học tập tích cực và nghiêm túc.',
  'Em cần thêm thời gian để hoàn thiện kỹ thuật.',
  'Em chủ động áp dụng góp ý của HLV vào bài tập.',
  'Em hoàn thành khóa học với kết quả đáng khích lệ.',
  'Em tích cực luyện tập và tiến bộ đều.',
  'Em nắm được kỹ thuật trọng tâm của khóa.',
  'Em phối hợp tốt với các bạn trong lớp.',
  'Em cần rèn thêm sức bền và giữ nhịp tập.',
  'Em đã đạt mục tiêu học tập đề ra.',
];

const sessionComment = (course, sessionIndex, memberIndex, member) => {
  if (memberIndex === 0) return course.definition.shortSessionComments[sessionIndex];
  const lesson = sessionIndex + 1;
  return `Sau buổi ${lesson} của lớp ${course.gymClass.name}, ${member.fullName} nhận xét: ${course.definition.sessionNotes[sessionIndex]} ${course.definition.memberNotes[memberIndex]}`;
};

const courseReview = (course, memberIndex) =>
  course.definition.courseReviewComments[memberIndex];

const summaryComment = (course, member, stats, memberIndex) =>
  `${member.fullName} tham dự ${stats.present}/${stats.total} buổi (${stats.percent}%) của lớp ${course.gymClass.name}. ${SUMMARY_OBSERVATIONS[memberIndex]}`;

/**
 * Ghi đủ điểm danh và nhận xét của HLV cho từng hội viên ở từng buổi.
 * @param {object} course
 */
export async function recordAttendanceAndFeedback(course) {
  for (const [sessionIndex, session] of course.sessions.entries()) {
    for (const [memberIndex, member] of course.members.entries()) {
      const absent = (memberIndex + sessionIndex) % 7 === 0;
      const status = absent ? Enums.AttendanceStatus.ABSENT : Enums.AttendanceStatus.PRESENT;
      await prisma.attendance.upsert({
        where: { sessionId_memberId: { sessionId: session.id, memberId: member.id } },
        update: { status, actorId: course.coach.id },
        create: { sessionId: session.id, memberId: member.id, actorId: course.coach.id, status },
      });
      await prisma.sessionFeedback.upsert({
        where: { sessionId_memberId: { sessionId: session.id, memberId: member.id } },
        update: {
          authorId: course.coach.id,
          rating: 4 + ((sessionIndex + memberIndex) % 2),
          note: sessionComment(course, sessionIndex, memberIndex, member),
        },
        create: {
          sessionId: session.id,
          memberId: member.id,
          authorId: course.coach.id,
          rating: 4 + ((sessionIndex + memberIndex) % 2),
          note: sessionComment(course, sessionIndex, memberIndex, member),
        },
      });
    }
  }
}

/**
 * Hoàn tất lớp, công bố tổng kết và thêm đánh giá khóa học/HLV cho học viên.
 * @param {object} course
 */
export async function publishSummary(course) {
  await runCourseCompletion(new Date(), course.gymClass.id);
  const summary = await prisma.courseSummary.findUniqueOrThrow({
    where: { classId: course.gymClass.id },
    include: { items: true },
  });
  for (const member of course.members) {
    await prisma.courseSummaryItem.upsert({
      where: { summaryId_memberId: { summaryId: summary.id, memberId: member.id } },
      update: {},
      create: { summaryId: summary.id, memberId: member.id },
    });
  }
  const updatedSummary = await prisma.courseSummary.findUniqueOrThrow({
    where: { id: summary.id },
    include: { items: true },
  });
  const summaryItems = updatedSummary.items;
  const attendance = await loadAttendance(prisma, updatedSummary);
  for (const item of summaryItems) {
    const stats = attendance.get(item.id);
    const memberIndex = course.members.findIndex((member) => member.id === item.memberId);
    if (memberIndex < 0) throw new Error(`Thiếu học viên demo ${item.memberId} trong ${course.gymClass.name}`);
    await prisma.courseSummaryItem.update({
      where: { id: item.id },
      data: {
        result: stats.percent >= 75 ? Enums.CourseResult.PASS : Enums.CourseResult.NOT_PASSED,
        progress: Math.min(5, Math.max(1, Math.round(stats.percent / 20))),
        comment: summaryComment(course, course.members[memberIndex], stats, memberIndex),
        nextCourse: course.definition.name.replace('căn bản', 'nâng cao'),
        attendanceSnapshot: stats,
      },
    });
    await prisma.courseRating.upsert({
      where: {
        classId_memberId: { classId: course.gymClass.id, memberId: course.members[memberIndex].id },
      },
      update: {
        coachId: course.coach.id,
        courseStars: 4 + (memberIndex % 2),
        coachStars: 4 + ((memberIndex + 1) % 2),
        comment: courseReview(course, memberIndex),
      },
      create: {
        classId: course.gymClass.id,
        memberId: course.members[memberIndex].id,
        coachId: course.coach.id,
        courseStars: 4 + (memberIndex % 2),
        coachStars: 4 + ((memberIndex + 1) % 2),
        comment: courseReview(course, memberIndex),
      },
    });
  }

  await prisma.courseSummary.update({
    where: { id: summary.id },
    data: {
      status: Enums.CourseSummaryStatus.PUBLISHED,
      publishedAt: new Date(),
      revision: Math.max(1, summary.revision),
    },
  });
  await prisma.gymClass.update({
    where: { id: course.gymClass.id },
    data: { status: Enums.ClassStatus.COMPLETED },
  });
}
