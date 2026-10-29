import ExcelJS from 'exceljs';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { loadAttendance } from './course-attendance.service.js';

const average = (rows, field) =>
  rows.length ? rows.reduce((sum, row) => sum + (row[field] ?? 0), 0) / rows.length : 0;
/** Cùng một builder dùng cho màn hình và Excel, bao gồm lớp chưa nộp tổng kết. */
export const courseReport = (query) =>
  prisma.$transaction(
    async (db) => {
      const start = new Date(`${query.from}T00:00:00+07:00`);
      const end = new Date(new Date(`${query.to}T00:00:00+07:00`).getTime() + TIME.MS_PER_DAY);
      const summaries = await loadSummaries(db, query, { start, end });
      const items = [];
      for (const summary of summaries) {
        const live = await loadAttendance(db, summary);
        const students = summary.items.map((item) => ({
          ...item,
          percent:
            summary.status === Enums.CourseSummaryStatus.PUBLISHED
              ? item.attendanceSnapshot.percent
              : live.get(item.id).percent,
        }));
        const passed = students.filter((item) => item.result === Enums.CourseResult.PASS).length;
        items.push({
          id: summary.id,
          classId: summary.classId,
          className: summary.gymClass.name,
          coach: summary.coach,
          subjectName: summary.gymClass.subject.name,
          status: summary.status,
          deadlineAt: summary.deadlineAt,
          submitted: summary.status === Enums.CourseSummaryStatus.PUBLISHED,
          overdue:
            summary.status === Enums.CourseSummaryStatus.DRAFT && summary.deadlineAt < new Date(),
          studentCount: students.length,
          passed,
          passPercent: students.length ? (passed / students.length) * PERCENT : 0,
          attendancePercent: average(students, 'percent'),
          courseStars: average(summary.gymClass.courseRatings, 'courseStars'),
          coachStars: average(summary.gymClass.courseRatings, 'coachStars'),
        });
      }
      const published = items.filter((item) => item.submitted).length;
      return {
        filters: query,
        items,
        total: items.length,
        published,
        completionPercent: items.length ? (published / items.length) * PERCENT : 0,
      };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.RepeatableRead },
  );
const PERCENT = 100;

/** Không tính lại chỉ số trong exporter. */
export const courseReportExcel = async (query) => {
  const report = await courseReport(query);
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Tổng kết khoá');
  sheet.addRow([
    'Khoá',
    'HLV',
    'Bộ môn',
    'Đã nộp',
    'Quá hạn',
    'Học viên',
    '% Đạt',
    '% Chuyên cần',
    'Sao khoá',
    'Sao HLV',
  ]);
  sheet.addRows(
    report.items.map((r) => [
      r.className,
      r.coach.fullName,
      r.subjectName,
      r.submitted,
      r.overdue,
      r.studentCount,
      r.passPercent,
      r.attendancePercent,
      r.courseStars,
      r.coachStars,
    ]),
  );
  return Buffer.from(await book.xlsx.writeBuffer());
};

function loadSummaries(db, query, { start, end }) {
  return db.courseSummary.findMany({
    where: {
      ...(query.coachId && { coachId: query.coachId }),
      gymClass: {
        ...(query.subjectId && { subjectId: query.subjectId }),
        sessions: {
          some: {
            status: { not: Enums.SessionStatus.CANCELLED },
            endAt: { gte: start, lt: end },
          },
          none: { status: { not: Enums.SessionStatus.CANCELLED }, endAt: { gte: end } },
        },
      },
    },
    include: {
      gymClass: { include: { subject: true, courseRatings: true } },
      coach: { select: { id: true, fullName: true } },
      items: true,
    },
    orderBy: { id: 'desc' },
  });
}
