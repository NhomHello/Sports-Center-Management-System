import { expect } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { StatusCodes } from 'http-status-codes';
import { TIME } from '../../src/constants/index.js';
import { api, apiPath, bearer } from './api.js';
import { classPayload, cleanupClassFixture, createClassFixture } from './sprint2.js';

/** Fixture góp ý GV: lớp + hai gói tự tập; hội viên `other` không có kỳ gói cũ. */
export const createGopyFixture = async () => {
  const f = await createClassFixture();
  f.call = (method, path, body, token = f.adminToken) =>
    api[method](apiPath(path)).set(bearer(token)).send(body);
  f.planA = await prisma.membershipPlan.create({
    data: { code: `${f.prefix}_A`, name: `${f.prefix} A`, price: 300000, durationDays: 30 },
  });
  f.planB = await prisma.membershipPlan.create({
    data: { code: `${f.prefix}_B`, name: `${f.prefix} B`, price: 600000, durationDays: 30 },
  });
  await prisma.membership.deleteMany({ where: { userId: f.other.id } });
  return f;
};

/** Dọn thêm các lần bảo lưu / điểm danh trước khi dọn fixture lớp. */
export const cleanupGopyFixture = async (f) => {
  if (!f) return;
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.checkIn.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.classWaitlist.deleteMany({ where: { memberId: { in: f.userIds } } });
  await cleanupClassFixture(f);
};

/** Thu tiền mặt một hoá đơn (lễ tân), trả hoá đơn sau khi thu. */
export const collectCash = async (f, invoiceId) => {
  const res = await f.call('post', `/payments/invoices/${invoiceId}/cash`, {});
  expect(res.status).toBe(StatusCodes.OK);
  return res.body.data;
};

/** Lễ tân bán gói tại quầy và thu tiền ngay; trả kỳ gói vừa tạo. */
export const buyPlanCash = async (f, memberId, planId) => {
  const order = await f.call('post', '/memberships/orders', { memberId, planId });
  expect(order.status).toBe(StatusCodes.CREATED);
  const paid = await collectCash(f, order.body.data.id);
  return prisma.membership.findUniqueOrThrow({ where: { invoiceId: paid.id } });
};

/** Lớp có học phí (phòng/HLV riêng để không trùng lịch với lớp mặc định của fixture). */
export const createPaidClass = async (f, overrides = {}) => {
  const res = await f.call(
    'post',
    '/classes',
    classPayload(f, { name: `${f.prefix} Paid ${Date.now()}`, price: 1200000, ...overrides }),
  );
  expect(res.status).toBe(StatusCodes.CREATED);
  return res.body.data;
};

/** Lễ tân bán khóa học tại quầy và thu tiền; trả đăng ký đã chính thức. */
export const buyCourseCash = async (f, classId, memberId) => {
  const order = await f.call('post', `/classes/${classId}/orders`, { memberId });
  expect(order.status).toBe(StatusCodes.CREATED);
  await collectCash(f, order.body.data.id);
  return prisma.classEnrollment.findUniqueOrThrow({
    where: { classId_memberId: { classId, memberId } },
  });
};

/** Đẩy `count` buổi đầu của lớp về quá khứ (đã học) để tính giá trị còn lại. */
export const pastSessions = async (classId, count) => {
  const sessions = await prisma.classSession.findMany({
    where: { classId },
    orderBy: { startAt: 'asc' },
    take: count,
  });
  for (const [index, session] of sessions.entries()) {
    // Buổi thứ i lùi về i+1 ngày trước, dài một giờ.
    const startAt = new Date(Date.now() - (index + 1) * TIME.MS_PER_DAY - TIME.MS_PER_HOUR);
    await prisma.classSession.update({
      where: { id: session.id },
      data: {
        startAt,
        endAt: new Date(startAt.getTime() + TIME.MS_PER_HOUR),
        status: 'COMPLETED',
      },
    });
  }
};
