import { describe, expect, it } from 'vitest';
import { councilCalendar } from '../prisma/seed/council/calendar.js';

const frames = [
  { startTime: '05:00', endTime: '09:00' },
  { startTime: '09:00', endTime: '13:00' },
  { startTime: '13:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '22:00' },
];
describe('Council data calendar uses Vietnam execution date', () => {
  it('maps future lessons over year end and keeps summary within even a one-day rating window', () => {
    const now = new Date('2026-12-31T16:45:00Z');
    const plan = councilCalendar(now, frames, 48);
    expect(plan.localDate).toBe('2026-12-31');
    expect(plan.A.sessions[0].startAt.toISOString()).toBe('2027-01-28T02:00:00.000Z');
    const completed = plan.courses.find((c) => c.key === 'C');
    expect(+now - +completed.sessions.at(-1).endAt).toBeLessThan(86400000);
    expect(+completed.sessions.at(-1).endAt).toBeLessThan(+now);
    const near = plan.courses.find((c) => c.key === 'NEAR');
    expect(+near.sessions[0].startAt - +now).toBeLessThan(48 * 3600000);
  });
  it('uses the Vietnam date after UTC midnight rollover and builds coherent weekly B lessons', () => {
    const now = new Date('2026-11-06T18:00:00Z');
    const plan = councilCalendar(now, frames, 72);
    expect(plan.localDate).toBe('2026-11-07');
    const b = plan.courses.find((c) => c.key === 'B');
    expect(+b.sessions[1].startAt).toBeLessThan(+now);
    expect(+b.sessions[2].startAt - +b.sessions[1].startAt).toBe(7 * 86400000);
    expect(+plan.courses.find((c) => c.key === 'R').sessions[0].startAt - +now).toBeGreaterThan(
      72 * 3600000,
    );
  });
  it('refuses missing operating frames instead of inventing invalid lesson times', () => {
    expect(() => councilCalendar(new Date(), [], 48)).toThrow('khung hoạt động');
  });
});
