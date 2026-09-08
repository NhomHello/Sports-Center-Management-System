import { describe, expect, it } from 'vitest';
import { buildPageMeta, paginationQuerySchema, toPrismaPage } from './pagination.js';

describe('pagination', () => {
  it('parse query voi gia tri mac dinh', () => {
    const result = paginationQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 10 });
  });

  it('gioi han pageSize toi da', () => {
    expect(() => paginationQuerySchema.parse({ pageSize: 1000 })).toThrow();
  });

  it('tinh skip/take', () => {
    expect(toPrismaPage({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('tinh totalPages', () => {
    expect(buildPageMeta({ page: 1, pageSize: 10, total: 25 }).totalPages).toBe(3);
  });
});
