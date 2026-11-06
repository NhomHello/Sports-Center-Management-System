import { TIME } from '../../../src/constants/index.js';

const dateText = (date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: TIME.VIETNAM_ZONE }).format(date);
const shift = (date, days) => new Date(date.getTime() + days * TIME.MS_PER_DAY);
const at = (date, clock) => new Date(`${dateText(date)}T${clock}:00+07:00`);
const hourAfter = (clock) =>
  `${String(Number(clock.slice(0, 2)) + 1).padStart(2, '0')}:${clock.slice(3)}`;

/** Map the actual execution date to valid operating frames; no fixed presentation date. */
export const councilCalendar = (now, frames, noticeHours) => {
  const slots = frames.filter(
    (f) => Number(f.endTime.slice(0, 2)) - Number(f.startTime.slice(0, 2)) >= 1,
  );
  if (slots.length < 3)
    throw new Error(
      'Cần ít nhất ba khung hoạt động dài từ một giờ để chuẩn bị các ca xung đột độc lập',
    );
  const candidates = [-1, 0]
    .flatMap((day) =>
      slots.map((f) => ({
        startAt: at(shift(now, day), f.startTime),
        endAt: at(shift(now, day), f.endTime),
      })),
    )
    .filter((s) => s.startAt <= now)
    .sort((a, b) => b.startAt - a.startAt);
  const current = candidates[0];
  const cutoff = new Date(Math.min(now.getTime() - TIME.MS_PER_HOUR, current.startAt.getTime()));
  const history = [-1, 0]
    .flatMap((day) =>
      slots.map((f) => ({
        startAt: at(shift(now, day), f.startTime),
        endAt: at(shift(now, day), hourAfter(f.startTime)),
      })),
    )
    .filter((s) => s.endAt <= cutoff)
    .sort((a, b) => b.endAt - a.endAt)[0];
  if (!history) throw new Error('Không tìm được buổi quá khứ hợp lệ để tạo tổng kết');
  const future = (days, index = 1) => ({
    startAt: at(shift(now, days), slots[index].startTime),
    endAt: at(shift(now, days), hourAfter(slots[index].startTime)),
  });
  return {
    anchor: now.toISOString(),
    localDate: dateText(now),
    timezone: TIME.VIETNAM_ZONE,
    A: course(
      'A',
      'Khóa tiếp theo (tạo trực tiếp ở WF1)',
      [28, 35, 42, 49].map((d) => future(d)),
    ),
    courses: buildCouncilCourses({ current, history, future, noticeHours }),
  };
};

const course = (key, name, sessions, options = {}) => ({
  key,
  name,
  sessions,
  price: 1200000,
  capacity: 8,
  ...options,
});
const shiftedSessions = (slot, days) =>
  days.map((d) => ({ startAt: shift(slot.startAt, d), endAt: shift(slot.endAt, d) }));

const buildCouncilCourses = ({ current, history, future, noticeHours }) => {
  const r = Math.max(60, Math.ceil(noticeHours / 24) + 2);
  const series = (start) => [0, 7, 14, 21].map((d) => future(start + d));
  return [
    course('B', 'Khóa đang theo dõi', shiftedSessions(current, [-7, 0, 7, 14])),
    course('C', 'Khóa đã kết thúc', shiftedSessions(history, [-6, -4, -2, 0]), { completed: true }),
    course('C_BAD', 'Tổng kết chưa đủ kết quả', shiftedSessions(history, [-6, -4, -2, 0]), {
      completed: true,
      alternate: true,
    }),
    course('A2', 'Khóa tương đương để đổi cả khóa', series(29)),
    course('FULL', 'Khóa tương đương đã đầy', series(30), { capacity: 1 }),
    course('OTHER', 'Khóa khác bộ môn', series(31), { alternate: true, otherSubject: true }),
    course('R', 'Nguồn đổi giờ hợp lệ', [future(r)], { price: 0 }),
    course('MEMBER_CONFLICT', 'Lịch khác của hội viên N', [future(r + 1)], {
      price: 0,
      alternate: true,
    }),
    course('COACH_CONFLICT', 'Lịch HLV đã có', [future(r + 1, 2)], {
      price: 0,
      alternateRoom: true,
    }),
    course('ROOM_CONFLICT', 'Lịch phòng đã có', [future(r + 1, 0)], {
      price: 0,
      alternateCoach: true,
    }),
    course('NEAR', 'Buổi học chưa đủ hạn báo trước', [future(1)], { price: 0 }),
  ];
};
