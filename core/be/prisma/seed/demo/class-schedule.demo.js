/**
 * Lịch lớp demo theo tuần (dayOfWeek: 0 = Chủ nhật … 6 = Thứ Bảy); phòng, bộ môn, HLV tham chiếu
 * theo tên trong data.demo.js.
 */
/**
 * Lịch lớp hằng tuần; lớp chạy từ ngày mai đến hết DEMO_CLASS_WEEKS tuần.
 * price = học phí cả khóa (góp ý GV: bán lớp theo khóa); 0 = lớp miễn phí đăng ký trực tiếp.
 */
export const DEMO_CLASS_WEEKS = 6;
export const DEMO_CLASSES = [
  {
    key: 'yogaMorning',
    price: 1080000,
    name: 'Yoga buổi sáng',
    subject: 'Yoga',
    room: 'Studio Yoga',
    coach: 'coach.yoga',
    capacity: 18,
    slots: [
      [1, '06:00', '07:00'],
      [3, '06:00', '07:00'],
      [5, '06:00', '07:00'],
    ],
  },
  {
    key: 'yogaEvening',
    price: 0,
    name: 'Yoga thư giãn buổi tối',
    subject: 'Yoga',
    room: 'Studio Yoga',
    coach: 'coach.yoga',
    capacity: 15,
    slots: [
      [2, '18:00', '19:00'],
      [4, '18:00', '19:00'],
    ],
  },
  {
    key: 'strength',
    price: 900000,
    name: 'Sức mạnh cơ bản',
    subject: 'Gym & Fitness',
    room: 'Phòng Gym',
    coach: 'coach.gym',
    capacity: 20,
    slots: [
      [1, '19:00', '20:00'],
      [3, '19:00', '20:00'],
      [5, '19:00', '20:00'],
    ],
  },
  {
    key: 'hiit',
    price: 720000,
    name: 'HIIT đốt mỡ',
    subject: 'Gym & Fitness',
    room: 'Phòng Gym',
    coach: 'coach.gym',
    capacity: 16,
    slots: [
      [2, '06:30', '07:15'],
      [4, '06:30', '07:15'],
      [6, '07:00', '07:45'],
    ],
  },
  {
    key: 'boxingBasic',
    price: 960000,
    name: 'Boxing nhập môn',
    subject: 'Boxing',
    room: 'Sàn Boxing',
    coach: 'coach.boxing',
    capacity: 10,
    slots: [
      [2, '19:30', '21:00'],
      [4, '19:30', '21:00'],
    ],
  },
  // Lớp nhóm nhỏ 2 người: luôn đầy để demo danh sách chờ (BR-2.16).
  {
    key: 'boxingSmall',
    price: 0,
    name: 'Boxing nhóm nhỏ (2 người)',
    subject: 'Boxing',
    room: 'Sàn Boxing',
    coach: 'coach.boxing',
    capacity: 2,
    slots: [[6, '17:00', '18:00']],
  },
  {
    key: 'pilates',
    price: 1200000,
    name: 'Pilates cải thiện tư thế',
    subject: 'Pilates',
    room: 'Phòng Pilates',
    coach: 'coach.pilates',
    capacity: 10,
    slots: [
      [2, '08:00', '09:00'],
      [4, '08:00', '09:00'],
      [6, '08:00', '09:00'],
    ],
  },
  {
    key: 'zumba',
    price: 0,
    name: 'Zumba vui khỏe',
    subject: 'Zumba & Dance',
    room: 'Phòng Dance',
    coach: 'coach.dance',
    capacity: 25,
    slots: [
      [1, '18:00', '19:00'],
      [3, '18:00', '19:00'],
      [0, '09:00', '10:00'],
    ],
  },
];
