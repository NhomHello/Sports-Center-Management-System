import { describe, expect, it } from 'vitest';
import { CLASS_DISPLAY_STATUS, classDisplayStatus } from './schedule';

const NOW = Date.parse('2026-10-18T05:00:00Z');
const base = {
  status: 'OPEN',
  endsOn: '2026-11-13',
  registrationStartAt: '2026-10-01T00:00:00Z',
  registrationEndAt: '2026-10-20T00:00:00Z',
};

describe('classDisplayStatus', () => {
  it.each([
    ['đang trong hạn đăng ký', base, CLASS_DISPLAY_STATUS.OPEN],
    [
      'chưa tới giờ mở',
      { ...base, registrationStartAt: '2026-10-19T00:00:00Z' },
      CLASS_DISPLAY_STATUS.UPCOMING,
    ],
    [
      'đã qua hạn đăng ký',
      { ...base, registrationEndAt: '2026-10-16T10:00:00Z' },
      CLASS_DISPLAY_STATUS.REGISTRATION_ENDED,
    ],
    ['lớp đã kết thúc', { ...base, endsOn: '2026-10-17' }, CLASS_DISPLAY_STATUS.ENDED],
    [
      'ngày kết thúc là hôm nay theo giờ Việt Nam',
      { ...base, endsOn: '2026-10-18', registrationEndAt: '2026-10-17T00:00:00Z' },
      CLASS_DISPLAY_STATUS.REGISTRATION_ENDED,
    ],
    ['đóng đăng ký', { ...base, status: 'CLOSED' }, CLASS_DISPLAY_STATUS.CLOSED],
    ['đã hủy', { ...base, status: 'CANCELLED' }, CLASS_DISPLAY_STATUS.CANCELLED],
  ])('%s', (_name, item, expected) => {
    expect(classDisplayStatus(item, NOW)).toBe(expected);
  });
});
