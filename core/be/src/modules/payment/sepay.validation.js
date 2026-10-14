import { z } from 'zod';

/** Payload SePay; passthrough để lưu nguyên các trường phụ (gateway, accumulated...) vào nhật ký. */
export const sepayWebhookSchema = {
  body: z
    .object({
      id: z.union([z.number(), z.string()]).transform(String),
      transferType: z.string(),
      transferAmount: z.coerce.number().nonnegative(),
      code: z.string().nullish(),
      content: z.string().nullish(),
      referenceCode: z.string().nullish(),
    })
    .passthrough(),
};
