import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';
import { Enums } from '../../config/db.js';

const id = z.coerce.number().int().positive();

export const notificationListSchema = {
  query: paginationQuerySchema.extend({
    readStatus: z.enum(['READ', 'UNREAD']).optional(),
    kind: z.enum(Object.values(Enums.NotificationKind)).optional(),
  }),
};
export const notificationIdSchema = {
  params: z.object({ id }),
};

export const markNotificationsReadSchema = {
  body: z.object({
    ids: z.array(z.number().int().positive()).min(1).max(VALIDATION.NOTIFICATION_IDS_MAX),
  }),
};
