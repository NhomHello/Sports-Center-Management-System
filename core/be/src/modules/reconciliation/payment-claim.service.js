import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';
import { lockInvoice } from '../payment/payment-apply.service.js';
import * as settingService from '../setting/setting.service.js';
import { fmtMoney, sendNotices, toReconcilers } from './payment-notify.service.js';
import { ACTIVE_STATUSES, openCase } from './reconciliation-case.service.js';

const CLAIMABLE = [Enums.InvoiceStatus.PENDING, Enums.InvoiceStatus.FAILED];

/**
 * UC-PAY-14: hội viên báo đã chuyển khoản nhưng hệ thống chưa ghi nhận (lỗi mạng, webhook chậm,
 * hoá đơn đã hết hạn). Chỉ mở phiếu MEMBER_CLAIM, không bao giờ tự PAID (BR-PAY-20).
 * @param {number} invoiceId
 * @param {{ transferredAt: Date, amount: number, bankName: string, reference?: string, note?: string }} body
 * @param {{ id: number }} actor hội viên đang đăng nhập (chỉ hoá đơn của chính mình)
 */
export const createClaim = async (invoiceId, body, actor) => {
  const windowDays = await settingService.getValue(SETTING_KEYS.PAYMENT_CLAIM_WINDOW_DAYS);
  const kase = await prisma.$transaction(
    async (tx) => {
      const invoice = await lockInvoice(tx, { id: invoiceId });
      // Hoá đơn của người khác trả 404 để không lộ sự tồn tại (giống UC-PAY-10 E1).
      if (!invoice || invoice.userId !== actor.id)
        throw ApiError.notFound('Không tìm thấy hoá đơn');
      if (!CLAIMABLE.includes(invoice.status))
        throw ApiError.businessRule('Hoá đơn đã thanh toán hoặc đã hoàn tiền');
      const oldest = new Date(Date.now() - windowDays * TIME.MS_PER_DAY);
      if (invoice.status === Enums.InvoiceStatus.FAILED && invoice.expiresAt < oldest)
        throw ApiError.businessRule(
          `Chỉ báo đã chuyển trong ${windowDays} ngày sau khi hoá đơn hết hạn`,
        );
      const open = await tx.reconciliationCase.findFirst({
        where: {
          invoiceId,
          reason: Enums.ReconciliationReason.MEMBER_CLAIM,
          status: { in: ACTIVE_STATUSES },
        },
      });
      if (open) throw ApiError.conflict('Hoá đơn này đã có phiếu báo chuyển khoản đang được xử lý');
      const { note, ...claim } = body;
      const created = await openCase(tx, {
        reason: Enums.ReconciliationReason.MEMBER_CLAIM,
        invoiceId,
        userId: actor.id,
        amount: body.amount,
        claim: { ...claim, transferredAt: body.transferredAt.toISOString() },
        note,
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: AUDIT_ACTIONS.CREATE,
          entity: ENTITIES.RECONCILIATION_CASE,
          entityId: String(created.id),
          meta: { invoiceId, amount: body.amount },
        },
      });
      return { ...created, invoiceCode: invoice.code };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
  await sendNotices([
    toReconcilers({
      eventKey: `case:${kase.id}:claim`,
      title: `Hội viên báo đã chuyển ${fmtMoney(kase.amount)} cho ${kase.invoiceCode}`,
      message: `Đối chiếu sao kê hoặc bấm "Đồng bộ từ SePay" để xử lý phiếu #${kase.id}.`,
    }),
  ]);
  return kase;
};
