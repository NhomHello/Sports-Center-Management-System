import { TIME } from '../../src/constants/index.js';
import { legacyOrder } from './legacy-invoice.js';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { cleanupSprintFixture, createSprintFixture } from './sprint1.js';

const getApi = () => import('./api.js');
const WEBHOOK_PATH = '/payments/sepay/webhook';
const SEPAY_AUTH = { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` };
// Giá trị giả lập cho payload test, không phải số nghiệp vụ.
const ID_SPREAD = 100000;
const DEFAULT_AMOUNT = 1000;
const REF_LENGTH = 8;

/** Bộ test đối soát: hai hội viên, một gói riêng, theo dõi id SePay và phiếu để dọn sạch. */
export const createReconciliationFixture = async ({ withApi = true } = {}) => {
  const fixture = await createSprintFixture({ withApi });
  const plan = await prisma.membershipPlan.create({
    data: { code: fixture.prefix, name: fixture.prefix, price: 300000, durationDays: 30 },
  });
  const renewal = await prisma.membershipPlan.create({
    data: {
      code: `${fixture.prefix}_R`,
      name: `${fixture.prefix} R`,
      price: 300000,
      durationDays: 10,
    },
  });
  return { ...fixture, plan, renewal, sepayIds: [], caseIds: [], startedAt: new Date() };
};

/** Dọn phiếu, hoàn tiền, log webhook và cảnh báo gửi cho người đối soát trong lúc chạy test. */
export const cleanupReconciliationFixture = async (f) => {
  if (!f) return;
  const invoices = await prisma.invoice.findMany({
    where: { userId: { in: f.userIds } },
    select: { id: true },
  });
  const invoiceIds = invoices.map((item) => item.id);
  const caseWhere = {
    OR: [
      { id: { in: f.caseIds } },
      { userId: { in: f.userIds } },
      { invoiceId: { in: invoiceIds } },
    ],
  };
  const cases = await prisma.reconciliationCase.findMany({
    where: caseWhere,
    select: { id: true },
  });
  const ids = cases.map((item) => item.id);
  await prisma.refund.deleteMany({
    where: { OR: [{ caseId: { in: ids } }, { invoiceId: { in: invoiceIds } }] },
  });
  await prisma.reconciliationCase.deleteMany({ where: { id: { in: ids } } });
  await prisma.paymentWebhookLog.deleteMany({
    where: { providerTransactionId: { in: f.sepayIds } },
  });
  await prisma.notification.deleteMany({
    where: { kind: 'PAYMENT_REVIEW_ALERT', createdAt: { gte: f.startedAt } },
  });
  await prisma.auditLog.deleteMany({
    where: { userId: null, entity: 'Invoice', createdAt: { gte: f.startedAt } },
  });
  if (f.courseIds?.length) await prisma.classEnrollment.deleteMany({ where: { classId: { in: f.courseIds } } });
  await cleanupSprintFixture(f);
  if (f.courseIds?.length) {
    await prisma.classEvent.deleteMany({ where: { classId: { in: f.courseIds } } });
    await prisma.classSession.deleteMany({ where: { classId: { in: f.courseIds } } });
    await prisma.gymClass.deleteMany({ where: { id: { in: f.courseIds } } });
    await prisma.room.delete({ where: { id: f.courseRoom.id } });
    await prisma.subject.delete({ where: { id: f.courseSubject.id } });
  }
  await prisma.membershipPlan.deleteMany({ where: { id: { in: [f.plan.id, f.renewal.id] } } });
};

/** Hội viên tự mua gói online, trả về hoá đơn PENDING. */
export const buyOnline = (f, token = f.memberToken, planId = f.plan.id) =>
  legacyOrder(token === f.otherToken ? f.other.id : f.member.id, planId);

/** Gửi một webhook tiền vào; mặc định đúng mã và đúng số tiền của hoá đơn. */
export const sendTransfer = async (f, invoice, overrides = {}) => {
  const id = `${Date.now()}${Math.floor(Math.random() * ID_SPREAD)}`;
  f.sepayIds.push(id);
  const body = {
    id,
    gateway: 'ACB',
    transferType: 'in',
    transferAmount: invoice?.amount ?? DEFAULT_AMOUNT,
    code: invoice?.code ?? null,
    content: invoice ? `Thanh toan ${invoice.code}` : 'chuyen tien',
    referenceCode: `FT${randomUUID().slice(0, REF_LENGTH)}`,
    ...overrides,
  };
  const { api, apiPath } = await getApi();
  const res = await api.post(apiPath(WEBHOOK_PATH)).set(SEPAY_AUTH).send(body);
  return res.body.data;
};

/** Phiếu đối soát mới nhất của hoá đơn (hoặc của log webhook khi không có hoá đơn). */
export const latestCase = async (f, where) => {
  const kase = await prisma.reconciliationCase.findFirst({ where, orderBy: { id: 'desc' } });
  if (kase) f.caseIds.push(kase.id);
  return kase;
};

/** Gọi API đối soát bằng tài khoản quản lý. */
export const asManager = async (f, method, path, body) => {
  const { api, apiPath, bearer } = await getApi();
  return api[method](apiPath(path)).set(bearer(f.adminToken)).send(body);
};

const COURSE_OFFSET = Object.freeze({ firstDays: 20, spacingDays: 2 });
/** Khóa học riêng cho kiểm thử chuyển tiền từ giao dịch cũ sang sản phẩm mới. */
export const createReconciliationCourse = async (f, price = f.plan.price) => {
  f.courseIds ??= [];
  f.courseSubject ??= await prisma.subject.create({ data: { name: `${f.prefix} Payment Course` } });
  f.courseRoom ??= await prisma.room.create({ data: { name: `${f.prefix} Payment Room`, capacity: 20 } });
  const coach = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  const start = new Date(Date.now() + (COURSE_OFFSET.firstDays + f.courseIds.length * COURSE_OFFSET.spacingDays) * TIME.MS_PER_DAY);
  const end = new Date(start.getTime() + TIME.MS_PER_HOUR);
  const item = await prisma.gymClass.create({ data: { name: `${f.prefix} Khóa ${f.courseIds.length + 1}`, price,
    subjectId: f.courseSubject.id, roomId: f.courseRoom.id, coachId: coach.id, capacity: 20,
    startsOn: start, endsOn: end, weeklySchedule: [], registrationStartAt: new Date(Date.now() - TIME.MS_PER_DAY), registrationEndAt: start,
    sessions: { create: { startAt: start, endAt: end, coachId: coach.id, roomId: f.courseRoom.id } } } });
  f.courseIds.push(item.id); return item;
};
