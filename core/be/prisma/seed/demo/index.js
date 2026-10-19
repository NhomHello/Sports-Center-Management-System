/**
 * Dựng dữ liệu demo "giống thật" sau khi reset (chạy qua service nghiệp vụ, không cần bật server):
 *  - 5 bộ môn, 5 phòng, 6 gói tập (1 gói ngừng bán), 8 nhân viên, 30 hội viên
 *  - 8 lớp với lịch hằng tuần trong 6 tuần tới, hội viên đã đăng ký vào các lớp
 *  - lịch sử mua gói 4 tuần gần nhất (online + tại quầy) để báo cáo/biểu đồ có số liệu
 *  - một buổi "Sức mạnh cơ bản" đang diễn ra để HLV điểm danh ngay
 *  - member1–15: các tình huống của tài liệu demo (chuyển thiếu/thừa/2 lần, bảo lưu, khoá...)
 *
 * Chạy: npm run db:demo  (= reset + seed nền + seed demo). Từ chối khi NODE_ENV=production.
 */
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { seedBase } from '../index.js';
import { seedDemoCatalog } from './catalog.demo.js';
import { addOngoingSession, enrollMembers, seedDemoClasses } from './classes.demo.js';
import { backdateInvoice, payAtCounter, payOnline } from './payments.demo.js';
import { seedDemoScenarios } from './scenarios.demo.js';

const HISTORY_FIRST = 16;
const HISTORY_LAST = 30;
const HISTORY_PLANS = ['STARTER_30', 'ACTIVE_90', 'STEADY_180', 'COMMIT_365', 'STARTER_30'];
const HISTORY_SPAN_DAYS = 28;

/** member16–30 mua gói rải rác trong 4 tuần qua, xen kẽ online và tại quầy. */
const seedPurchaseHistory = async ({ users, plans }) => {
  const members = [];
  for (let n = HISTORY_FIRST; n <= HISTORY_LAST; n += 1) {
    const member = users[`member${n}`];
    const plan = plans[HISTORY_PLANS[n % HISTORY_PLANS.length]];
    const invoice =
      n % 3 === 0
        ? await payAtCounter(member, plan, n % 2 ? users.letan : users.letan2)
        : await payOnline(member, plan);
    await backdateInvoice(invoice, (n * 5) % HISTORY_SPAN_DAYS);
    members.push(member);
  }
  return members;
};

/** Mỗi hội viên có gói vào 2–3 lớp; trùng giờ thì service tự từ chối như thực tế. */
const seedEnrollments = async (classes, members, staff) => {
  const list = Object.values(classes).filter((item) => item.capacity > 2);
  for (const [index, item] of list.entries()) {
    const picked = members.filter((_, m) => (m + index) % 3 !== 0);
    await enrollMembers(item, picked, staff);
  }
};

const run = async () => {
  // Demo dựng trên DB trống: chạy lại khi còn lớp cũ sẽ trùng lịch phòng/HLV.
  if (await prisma.gymClass.count()) {
    logger.error('DB còn dữ liệu cũ. Dùng "npm run db:demo" để reset rồi dựng lại.');
    process.exitCode = 1;
    return;
  }
  await seedBase({ mock: false });
  const catalog = await seedDemoCatalog();
  const members = await seedPurchaseHistory(catalog);
  const classes = await seedDemoClasses(catalog);
  await seedEnrollments(classes, members, catalog.users.letan);
  await addOngoingSession(classes.strength, { startedMinutesAgo: 20, durationMinutes: 60 });
  await seedDemoScenarios(catalog, classes);
  const counts = {
    classes: await prisma.gymClass.count(),
    enrollments: await prisma.classEnrollment.count({ where: { status: 'BOOKED' } }),
    invoices: await prisma.invoice.count(),
    reconciliationCases: await prisma.reconciliationCase.count(),
  };
  logger.info(counts, 'Đã dựng dữ liệu demo');
  logger.info(
    `Tài khoản: ${env.SEED_ADMIN_EMAIL} / mật khẩu admin; quanly, letan, letan2, coach.*, ` +
      `member1..member30 @scms.local / ${env.SEED_MOCK_PASSWORD}`,
  );
};

if (env.NODE_ENV === 'production') {
  logger.error('Từ chối seed demo: NODE_ENV=production');
  process.exit(1);
}
await run();
await prisma.$disconnect();
