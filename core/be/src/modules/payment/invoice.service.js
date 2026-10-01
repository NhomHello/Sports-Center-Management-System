import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';
import * as settingService from '../setting/setting.service.js';

/** Quan hệ được phép xem; thông tin người thu không bao gồm credential. */
export const INVOICE_INCLUDE = {
  plan: true,
  membership: { include: { plan: true } },
  payments: { orderBy: { paidAt: 'desc' } },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
};

/** Danh sách read_own luôn lấy userId từ token, không nhận id tùy ý từ query. */
export const listInvoices = async (query, actor, canReadAll) => {
  const userId = canReadAll ? query.memberId : actor.id;
  const where = {
    ...(userId && { userId }),
    ...(query.status && { status: query.status }),
    ...(query.search && {
      OR: [
        { code: { contains: query.search } },
        { user: { fullName: { contains: query.search } } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      include: INVOICE_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.invoice.count({ where }),
  ]);
  const currency = await settingService.getValue(SETTING_KEYS.CURRENCY);
  return {
    items: items.map((item) => ({ ...item, currency })),
    meta: buildPageMeta({ ...query, total }),
  };
};

/** Chi tiết có thông tin trung tâm để chủ hóa đơn in mà không cần setting.read. */
export const getInvoice = async (id, actor, canReadAll) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, ...(!canReadAll && { userId: actor.id }) },
    include: INVOICE_INCLUDE,
  });
  if (!invoice) throw ApiError.notFound('Không tìm thấy hóa đơn trong phạm vi truy cập');
  const [name, address, phone, currency] = await Promise.all(
    [
      SETTING_KEYS.CENTER_NAME,
      SETTING_KEYS.CENTER_ADDRESS,
      SETTING_KEYS.CENTER_PHONE,
      SETTING_KEYS.CURRENCY,
    ].map((key) => settingService.getValue(key)),
  );
  const collectors = await prisma.user.findMany({
    where: { id: { in: invoice.payments.map((item) => item.actorId).filter(Boolean) } },
    select: { id: true, fullName: true },
  });
  const payments = invoice.payments.map((payment) => ({
    ...payment,
    actor: collectors.find((collector) => collector.id === payment.actorId) ?? null,
  }));
  return { ...invoice, payments, centerInfo: { name, address, phone }, currency };
};
