import { z } from 'zod';

export const updateSettingsSchema = {
  body: z.object({
    items: z
      .array(
        z.object({
          key: z.string().trim().min(1),
          // Luon gui string; BE parse/validate theo type cua setting trong DB
          value: z.string(),
        }),
      )
      .min(1, 'Cần ít nhất một cấu hình'),
  }),
};
