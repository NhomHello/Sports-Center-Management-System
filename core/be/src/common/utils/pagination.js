import { z } from 'zod';
import { PAGINATION } from '../../constants/index.js';

/**
 * Zod schema cho query phan trang, dung chung: validate({ query: paginationQuerySchema.extend({...}) })
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
});

/**
 * Chuyen { page, pageSize } thanh { skip, take } cho Prisma.
 * @param {{ page: number, pageSize: number }} query
 */
export const toPrismaPage = ({ page, pageSize }) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

/**
 * Meta phan trang tra ve FE.
 * @param {{ page: number, pageSize: number, total: number }} input
 */
export const buildPageMeta = ({ page, pageSize, total }) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});
