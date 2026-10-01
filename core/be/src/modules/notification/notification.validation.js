import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';

export const notificationListSchema = {
  query: paginationQuerySchema.extend({
    readStatus: z.enum(['READ', 'UNREAD']).optional(),
    kind: z.enum(Object.values(Enums.NotificationKind)).optional(),
  }),
};
export const notificationIdSchema = {
  params: z.object({ id: z.coerce.number().int().positive() }),
};
