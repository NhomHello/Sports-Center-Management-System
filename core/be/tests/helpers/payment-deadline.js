import { StatusCodes } from 'http-status-codes';
import { expect } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { TIME } from '../../src/constants/index.js';
import { getValue } from '../../src/modules/setting/setting.service.js';
import { SETTING_KEYS } from '@scms/shared';
import { createReconciliationCourse, asManager } from './reconciliation.js';
import { api, apiPath, bearer } from './api.js';

const FIXTURE = Object.freeze({ seconds: 60, minutes: 15 });
const formatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME.VIETNAM_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
/** Timestamp ngân hàng trong fixture, theo múi giờ Việt Nam. */
export const bankDate = (date) => formatter.format(date);

/** Fixture gần deadline; lùi createdAt để timestamp ngân hàng luôn thuộc đúng đơn. */
export const boundaryInvoice = async (
  f,
  { channel = 'ONLINE', seconds = FIXTURE.seconds } = {},
) => {
  const course = await createReconciliationCourse(f);
  await prisma.gymClass.update({ where: { id: course.id }, data: { capacity: 1 } });
  const response = await api
    .post(apiPath(`/classes/${course.id}/orders`))
    .set(bearer(f.adminToken))
    .send({ memberId: f.member.id, channel });
  expect(response.status).toBe(StatusCodes.CREATED);
  const deadline = new Date(Date.now() + seconds * TIME.MS_PER_SECOND);
  return setDeadline(response.body.data, deadline);
};

/** Đặt đồng bộ hạn hóa đơn và giữ chỗ cho kiểm thử biên. */
export const setDeadline = async (invoice, deadline) => {
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      expiresAt: deadline,
      createdAt: new Date(deadline.getTime() - FIXTURE.minutes * TIME.MS_PER_MINUTE),
    },
  });
  await prisma.classEnrollment.updateMany({
    where: { invoiceId: invoice.id },
    data: { holdExpiresAt: deadline },
  });
  return updated;
};
/** Đọc khoảng chờ thật từ settings. */
export const graceSeconds = () => getValue(SETTING_KEYS.PAYMENT_WEBHOOK_GRACE_SECONDS);
/** Đọc đúng đăng ký liên kết hóa đơn đang thử. */
export const enrollmentFor = (invoice) =>
  prisma.classEnrollment.findFirstOrThrow({ where: { invoiceId: invoice.id } });
/** Gọi xác nhận thu tiền bằng tài khoản có quyền. */
export const cash = (f, invoice) =>
  asManager(f, 'post', `/payments/invoices/${invoice.id}/cash`, {});
/** Lưu trao đổi trước khi yêu cầu hoàn tiền. */
export const contactCase = (f, id) =>
  asManager(f, 'post', `/reconciliations/${id}/contacts`, {
    channel: 'PHONE',
    content: 'Đã liên hệ học viên về khoản tiền hết hạn',
    result: 'Đồng ý hoàn đủ',
  });
