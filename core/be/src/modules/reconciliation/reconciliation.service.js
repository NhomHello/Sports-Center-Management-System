import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { INVOICE_INCLUDE } from '../payment/invoice.service.js';
import { sumReceived } from '../payment/payment-apply.service.js';
import * as settingService from '../setting/setting.service.js';
import { sendNotices, toMember } from './payment-notify.service.js';
import {
  ACTIVE_STATUSES,
  assertContacted,
  lockCase,
  updateCase,
} from './reconciliation-case.service.js';

const { ReconciliationStatus: STATUS, ReconciliationReason: REASON } = Enums;
const TX = { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted };

const overdueBefore = async () => {
  const hours = await settingService.getValue(SETTING_KEYS.PAYMENT_CASE_REMIND_HOURS);
  return new Date(Date.now() - hours * TIME.MS_PER_HOUR);
};

const members = async (ids) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(ids.filter(Boolean))] } },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  return new Map(users.map((user) => [user.id, user]));
};

/** UC-PAY-11: hàng chờ đối soát, lọc theo trạng thái/lý do; overdue = mở quá số giờ nhắc lại. */
export const listCases = async (query) => {
  const before = await overdueBefore();
  const where = {
    status: query.status ? query.status : { in: ACTIVE_STATUSES },
    ...(query.reason && { reason: query.reason }),
    ...(query.overdue && { createdAt: { lt: before } }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.reconciliationCase.findMany({
      where,
      include: { webhookLog: true, invoice: { select: { id: true, code: true, amount: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.reconciliationCase.count({ where }),
  ]);
  const people = await members(items.map((item) => item.userId));
  const data = items.map((item) => ({
    ...item,
    member: people.get(item.userId) ?? null,
    overdue: ACTIVE_STATUSES.includes(item.status) && item.createdAt < before,
  }));
  return { items: data, meta: buildPageMeta({ ...query, total }) };
};

/** Số phiếu đang mở cho badge header/dashboard; chuyển lặp tách riêng vì là cảnh báo mức cao. */
export const summary = async () => {
  const before = await overdueBefore();
  const active = { status: { in: ACTIVE_STATUSES } };
  const [open, duplicate, overdue] = await Promise.all([
    prisma.reconciliationCase.count({ where: active }),
    prisma.reconciliationCase.count({
      where: { ...active, reason: REASON.DUPLICATE_TRANSFER },
    }),
    prisma.reconciliationCase.count({ where: { ...active, createdAt: { lt: before } } }),
  ]);
  return { open, duplicate, overdue };
};

/** Chi tiết phiếu: giao dịch gốc, hoá đơn (đã nhận/còn thiếu), nhật ký liên hệ, yêu cầu hoàn. */
export const getCase = async (id) => {
  const kase = await prisma.reconciliationCase.findUnique({
    where: { id },
    include: {
      webhookLog: true,
      invoice: { include: INVOICE_INCLUDE },
      contacts: { orderBy: { createdAt: 'asc' } },
      refunds: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!kase) throw ApiError.notFound('Không tìm thấy phiếu đối soát');
  const actorIds = kase.contacts.map((item) => item.actorId);
  const people = await members([kase.userId, ...actorIds]);
  const received = kase.invoice ? await sumReceived(prisma, kase.invoice.id) : 0;
  return {
    ...kase,
    member: people.get(kase.userId) ?? null,
    contacts: kase.contacts.map((item) => ({ ...item, actor: people.get(item.actorId) ?? null })),
    invoiceReceived: received,
    invoiceMissing: kase.invoice ? Math.max(kase.invoice.amount - received, 0) : 0,
    overdue: ACTIVE_STATUSES.includes(kase.status) && kase.createdAt < (await overdueBefore()),
  };
};

/** BR-PAY-19: ghi lần liên hệ (chỉ thêm); phiếu đang OPEN chuyển sang chờ hội viên phản hồi. */
export const addContact = (id, body, actor) =>
  prisma.$transaction(async (tx) => {
    const kase = await lockCase(tx, id);
    const contact = await tx.reconciliationContact.create({
      data: { caseId: id, ...body, actorId: actor.id },
    });
    if (kase.status === STATUS.OPEN) {
      await updateCase(tx, kase, {
        data: { status: STATUS.WAITING_MEMBER },
        actor,
        action: 'CONTACT',
      });
    }
    return contact;
  }, TX);

/** Chỉ giao dịch không gắn được với ai (test/rác) mới được bỏ qua, bắt buộc ghi chú (BR-PAY-11). */
export const ignoreCase = (id, { note }, actor) =>
  prisma.$transaction(async (tx) => {
    const kase = await lockCase(tx, id);
    if (kase.reason !== REASON.NO_MATCH || kase.invoiceId)
      throw ApiError.businessRule('Chỉ bỏ qua được giao dịch không khớp hoá đơn nào');
    return updateCase(tx, kase, {
      data: { status: STATUS.IGNORED, note },
      actor,
      action: 'IGNORE',
    });
  }, TX);

/** UC-PAY-14 E1: từ chối phiếu "đã chuyển khoản" khi không tìm thấy giao dịch, báo lý do cho hội viên. */
export const rejectClaim = async (id, { note }, actor) => {
  const kase = await prisma.$transaction(async (tx) => {
    const locked = await lockCase(tx, id);
    if (locked.reason !== REASON.MEMBER_CLAIM)
      throw ApiError.businessRule('Chỉ từ chối được phiếu hội viên báo đã chuyển khoản');
    assertContacted(locked);
    return updateCase(tx, locked, {
      data: { status: STATUS.REJECTED, note },
      actor,
      action: 'REJECT',
    });
  }, TX);
  await sendNotices([
    toMember({
      userId: kase.userId,
      kind: Enums.NotificationKind.PAYMENT_CLAIM_REJECTED,
      eventKey: `case:${kase.id}:rejected`,
      title: 'Chưa tìm thấy giao dịch chuyển khoản của bạn',
      message: `Lý do: ${note}. Vui lòng liên hệ lễ tân kèm biên lai chuyển khoản.`,
    }),
  ]);
  return kase;
};
