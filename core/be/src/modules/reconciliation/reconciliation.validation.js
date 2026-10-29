import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';
import { PAYMENT_LIMITS, TIME, VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
const money = z.coerce.number().int().positive();
const params = z.object({ id });
const reference = z.string().trim().min(1).max(VALIDATION.PAYMENT_REFERENCE_MAX_LENGTH);
const note = z.string().trim().min(1).max(PAYMENT_LIMITS.NOTE_MAX_LENGTH);
const reason = z.string().trim().min(1).max(PAYMENT_LIMITS.REASON_MAX_LENGTH);

export const caseListSchema = {
  query: paginationQuerySchema.extend({
    status: z.enum(Object.values(Enums.ReconciliationStatus)).optional(),
    reason: z.enum(Object.values(Enums.ReconciliationReason)).optional(),
    overdue: z.stringbool().optional(),
  }),
};
export const caseParamsSchema = { params };

export const contactSchema = {
  params,
  body: z
    .object({
      channel: z.enum(Object.values(Enums.ContactChannel)),
      content: note,
      result: reason.optional(),
    })
    .strict(),
};

/** Map vào hoá đơn có sẵn, hoặc chọn hội viên + gói để hệ thống tạo/tái sử dụng hoá đơn online. */
export const mapSchema = {
  params,
  body: z
    .object({ invoiceId: id.optional(), memberId: id.optional(), planId: id.optional() })
    .strict()
    .refine((body) => body.invoiceId || (body.memberId && body.planId), {
      message: 'Chọn hoá đơn, hoặc chọn hội viên và gói tập',
    }),
};
export const confirmSchema = { params, body: z.object({ amount: money, reference }).strict() };
export const renewSchema = { params, body: z.object({ planId: id }).strict() };
export const refundRequestSchema = {
  params,
  body: z.object({ amount: money.optional(), reason }).strict(),
};
export const noteSchema = { params, body: z.object({ note }).strict() };
export const syncSchema = {
  body: z.object({ from: z.coerce.date(), to: z.coerce.date() }).strict(),
};

export const refundListSchema = {
  query: paginationQuerySchema.extend({
    status: z.enum(Object.values(Enums.RefundStatus)).optional(),
  }),
};
export const refundCompleteSchema = { params, body: z.object({ reference }).strict() };

export const claimSchema = {
  params,
  body: z
    .object({
      // Cho lệch đồng hồ một phút; kiểm tra lúc gọi chứ không lúc nạp module.
      transferredAt: z.coerce
        .date()
        .refine((value) => value.getTime() <= Date.now() + TIME.MS_PER_MINUTE, {
          message: 'Thời điểm chuyển không được ở tương lai',
        }),
      amount: money,
      bankName: z.string().trim().min(1).max(VALIDATION.NAME_MAX_LENGTH),
      reference: reference.optional(),
      note: note.optional(),
    })
    .strict(),
};
