import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();

export const listNotificationsSchema = {
  query: paginationQuerySchema.extend({ isRead: z.stringbool().optional() }),
};

export const notificationIdSchema = { params: z.object({ id }) };

export const markNotificationsReadSchema = {
  body: z.object({
    ids: z.array(z.number().int().positive()).min(1).max(VALIDATION.NOTIFICATION_IDS_MAX),
  }),
};
