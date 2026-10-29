import { SETTING_KEYS as K } from '@scms/shared';
import { prisma, Enums } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { drawCenterHeader, renderPdf } from '../../common/utils/pdf-document.js';
import { getValue } from '../setting/setting.service.js';

const resultInclude = {
  summary: {
    include: {
      gymClass: { select: { id: true, name: true } },
      coach: { select: { id: true, fullName: true } },
    },
  },
  member: { select: { fullName: true } },
};
/** ID token là phạm vi duy nhất; draft/reopened không xuất hiện trên danh sách hội viên. */
export const listResults = async (memberId, query) => {
  const where = { memberId, summary: { status: Enums.CourseSummaryStatus.PUBLISHED } };
  const [items, total] = await prisma.$transaction([
    prisma.courseSummaryItem.findMany({
      where,
      include: resultInclude,
      ...toPrismaPage(query),
      orderBy: { id: 'desc' },
    }),
    prisma.courseSummaryItem.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};

/** Phiếu dùng snapshot công bố, tên trung tâm và khung chung với hoá đơn PDF. */
export const resultPdf = async (id, memberId) => {
  const item = await prisma.courseSummaryItem.findFirst({
    where: { id, memberId, summary: { status: Enums.CourseSummaryStatus.PUBLISHED } },
    include: resultInclude,
  });
  if (!item) throw ApiError.notFound('Không có kết quả đã công bố của bạn');
  const [name, address, phone] = await Promise.all(
    [K.CENTER_NAME, K.CENTER_ADDRESS, K.CENTER_PHONE].map(getValue),
  );
  const fields = [
    ['Mã tra cứu', item.lookupCode],
    ['Hội viên', item.member.fullName],
    ['Khoá', item.summary.gymClass.name],
    ['HLV', item.summary.coach.fullName],
    ['Chuyên cần', `${item.attendanceSnapshot.percent}%`],
    ['Kết quả', item.result === Enums.CourseResult.PASS ? 'Đạt' : 'Chưa đạt'],
    ['Mức tiến bộ', `${item.progress}/5`],
    ['Nhận xét', item.comment || '—'],
    ['Gợi ý khoá tiếp', item.nextCourse || '—'],
  ];
  const buffer = await renderPdf((doc) => {
    drawCenterHeader(doc, { name, address, phone });
    doc.text('PHIẾU TỔNG KẾT KHOÁ HỌC', { align: 'center' }).moveDown();
    for (const [label, value] of fields) doc.text(`${label}: ${value}`).moveDown();
  }, item.lookupCode);
  return { buffer, filename: `course-result-${item.lookupCode}.pdf` };
};
