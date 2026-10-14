import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { api, bearer } from './helpers/api.js';
import { prisma } from '../src/config/db.js';
import { createSprintFixture, cleanupSprintFixture } from './helpers/sprint1.js';

let fixture;
beforeAll(async () => {
  fixture = await createSprintFixture();
  const entry = await prisma.auditLog.create({
    data: {
      userId: fixture.member.id,
      action: 'TEST_READ',
      entity: fixture.prefix,
      entityId: '1',
      meta: { oldValue: 'before', newValue: 'after' },
    },
  });
  fixture.auditIds.push(entry.id);
});
afterAll(() => cleanupSprintFixture(fixture));
describe('S3-08 audit history', () => {
  it('TC-AUDIT-01: filters and returns change details without credentials', async () => {
    const res = await api
      .get('/api/v1/audit-logs')
      .set(bearer(fixture.adminToken))
      .query({ entity: fixture.prefix, userId: fixture.member.id, pageSize: 1 });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].meta.newValue).toBe('after');
    expect(res.body.data[0].user).toEqual({
      id: fixture.member.id,
      fullName: fixture.member.fullName,
    });
  });
  it('TC-AUDIT-02: denies users without audit.read', async () => {
    const res = await api.get('/api/v1/audit-logs').set(bearer(fixture.memberToken));
    expect(res.status).toBe(403);
  });
  it('TC-AUDIT-03: rejects a reversed date range', async () => {
    const res = await api
      .get('/api/v1/audit-logs')
      .set(bearer(fixture.adminToken))
      .query({ from: '2026-10-15', to: '2026-10-14' });
    expect(res.status).toBe(400);
  });
});
