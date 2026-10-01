import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import * as settingService from '../setting/setting.service.js';

const INVOICE_INCLUDE = {
  plan: true,
  membership: { include: { plan: true } },
  payments: { orderBy: { paidAt: 'desc' } },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
};

/** Lấy chi tiết hoá đơn theo quyền sở hữu hoặc quyền xem toàn bộ. */
export const getInvoice = async (id, actor, canReadAll) => {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: INVOICE_INCLUDE });
  if (!invoice || (!canReadAll && invoice.userId !== actor.id)) {
    throw ApiError.notFound('Không tìm thấy hoá đơn');
  }
  return invoice;
};

/** Dữ liệu bản in chỉ được tạo từ hoá đơn PAID và giữ nguyên số tiền gốc. */
export const getReceipt = async (id, actor, canReadAll) => {
  const invoice = await getInvoice(id, actor, canReadAll);
  if (invoice.status !== Enums.InvoiceStatus.PAID) {
    throw ApiError.businessRule('Chỉ in hoặc xuất hoá đơn đã thanh toán');
  }
  const [centerName, centerAddress, centerPhone, currency] = await Promise.all([
    settingService.getValue(SETTING_KEYS.CENTER_NAME),
    settingService.getValue(SETTING_KEYS.CENTER_ADDRESS),
    settingService.getValue(SETTING_KEYS.CENTER_PHONE),
    settingService.getValue(SETTING_KEYS.CURRENCY),
  ]);
  return {
    invoice,
    center: { name: centerName, address: centerAddress, phone: centerPhone },
    currency,
  };
};
