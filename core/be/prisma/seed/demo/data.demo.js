/**
 * Dữ liệu demo "giống thật": bộ môn, phòng, gói tập, nhân viên, hội viên và lịch lớp hằng tuần.
 * Email/SĐT cố định để tài liệu demo (docs/kiem-thu/nghiem-thu) dùng lại được sau mỗi lần reset.
 * dayOfWeek: 0 = Chủ nhật, 1 = Thứ Hai ... 6 = Thứ Bảy.
 */

export const DEMO_SUBJECTS = [
  { name: 'Yoga', description: 'Yoga thư giãn, dẻo dai và hít thở cho mọi lứa tuổi.' },
  { name: 'Gym & Fitness', description: 'Tập sức mạnh, sức bền với máy và tạ tự do.' },
  { name: 'Boxing', description: 'Kỹ thuật đấm, di chuyển và thể lực đối kháng.' },
  { name: 'Pilates', description: 'Tăng sức mạnh vùng lõi, cải thiện tư thế.' },
  { name: 'Zumba & Dance', description: 'Nhảy theo nhạc, đốt mỡ và vui vẻ.' },
];

/** Loại phòng = chức năng phòng: bộ môn dạy được trong phòng và có phải khu tự tập không. */
export const DEMO_ROOM_TYPES = [
  {
    name: 'Studio',
    description: 'Sàn gỗ, thảm tập: lớp nhẹ nhàng, giữ thăng bằng.',
    subjects: ['Yoga', 'Pilates'],
  },
  {
    name: 'Phòng máy',
    description: 'Máy tập, tạ tự do; dùng cho lớp sức mạnh và hội viên tự tập.',
    subjects: ['Gym & Fitness'],
    isSelfTrainingArea: true,
  },
  { name: 'Sàn võ', description: 'Bao cát, sàn đài, găng.', subjects: ['Boxing'] },
  { name: 'Phòng nhảy', description: 'Gương lớn, âm thanh.', subjects: ['Zumba & Dance'] },
];

export const DEMO_ROOMS = [
  { name: 'Studio Yoga', capacity: 20, type: 'Studio', description: 'Tầng 2, sàn gỗ.' },
  { name: 'Phòng Pilates', capacity: 12, type: 'Studio', description: 'Tầng 2, có máy reformer.' },
  { name: 'Phòng Gym', capacity: 25, type: 'Phòng máy', description: 'Tầng 1, máy và tạ tự do.' },
  { name: 'Sàn Boxing', capacity: 12, type: 'Sàn võ', description: 'Tầng 3, bao cát, sàn đài.' },
  { name: 'Phòng Dance', capacity: 30, type: 'Phòng nhảy', description: 'Tầng 3, gương lớn.' },
];

/** Chuyên môn HLV (bộ môn được phân công dạy). */
export const DEMO_COACH_SUBJECTS = {
  'coach.yoga': ['Yoga', 'Pilates'],
  'coach.gym': ['Gym & Fitness'],
  'coach.boxing': ['Boxing'],
  'coach.pilates': ['Pilates', 'Yoga'],
  'coach.dance': ['Zumba & Dance'],
};

// Gói tự tập (góp ý GV): bán theo thời hạn + khung giờ + khu vực; lớp học bán riêng theo khóa.
// frames/areas theo tên khung giờ hoạt động / loại phòng khu tự tập; bỏ trống = không giới hạn.
const BENEFITS = [
  'Tự tập tại khu Phòng máy, check-in tại quầy',
  'Không cần đặt chỗ trước',
  'Bảo lưu tổng tối đa 60 ngày mỗi kỳ',
];
const plan = (fields) => ({ benefits: BENEFITS, areas: ['Phòng máy'], frames: [], ...fields });
export const DEMO_PLANS = [
  plan({
    code: 'TRIAL_7',
    name: 'Trải nghiệm 7 ngày',
    durationDays: 7,
    price: 120000,
    description: 'Gói dùng thử cho khách mới, vào mọi khung giờ.',
  }),
  plan({
    code: 'EARLY_30',
    name: 'Tự tập sáng sớm 30 ngày',
    durationDays: 30,
    price: 290000,
    frames: ['Sáng sớm'],
    description: 'Chỉ vào khung Sáng sớm 05:00–09:00, giá mềm cho người tập trước giờ làm.',
  }),
  plan({
    code: 'STARTER_30',
    name: 'Khởi động 30 ngày',
    durationDays: 30,
    price: 360000,
    description: 'Gói linh hoạt cho hội viên mới, mọi khung giờ.',
  }),
  plan({
    code: 'ACTIVE_90',
    name: 'Năng động 90 ngày',
    durationDays: 90,
    price: 900000,
    description: 'Cân bằng cho lịch tập đều đặn.',
  }),
  plan({
    code: 'STEADY_180',
    name: 'Bền bỉ 180 ngày',
    durationDays: 180,
    price: 1620000,
    description: 'Nửa năm tập luyện, giá tốt hơn.',
  }),
  plan({
    code: 'COMMIT_365',
    name: 'Bứt phá 365 ngày',
    durationDays: 365,
    price: 2880000,
    description: 'Đơn giá mỗi ngày thấp nhất.',
  }),
  // Gói đã ngừng bán: vẫn hiện trong lịch sử, không chọn được cho giao dịch mới (BR-1.6).
  plan({
    code: 'SUMMER_60',
    name: 'Hè sôi động 60 ngày',
    durationDays: 60,
    price: 600000,
    description: 'Khuyến mãi hè đã kết thúc.',
    isActive: false,
    status: 'STOPPED',
  }),
];

export const DEMO_STAFF = [
  {
    email: 'quanly@scms.local',
    fullName: 'Võ Thị Quản Lý',
    phone: '0901000100',
    role: 'CENTER_MANAGER',
  },
  {
    email: 'letan@scms.local',
    fullName: 'Trần Thị Lễ Tân',
    phone: '0901000001',
    role: 'RECEPTIONIST',
  },
  {
    email: 'letan2@scms.local',
    fullName: 'Đặng Minh Thư',
    phone: '0901000004',
    role: 'RECEPTIONIST',
  },
  {
    email: 'coach.yoga@scms.local',
    fullName: 'Nguyễn Văn Yoga',
    phone: '0901000002',
    role: 'COACH',
  },
  { email: 'coach.gym@scms.local', fullName: 'Lê Văn Gym', phone: '0901000003', role: 'COACH' },
  {
    email: 'coach.boxing@scms.local',
    fullName: 'Đỗ Văn Boxing',
    phone: '0901000005',
    role: 'COACH',
  },
  {
    email: 'coach.pilates@scms.local',
    fullName: 'Hoàng Thu Hà',
    phone: '0901000006',
    role: 'COACH',
  },
  {
    email: 'coach.dance@scms.local',
    fullName: 'Phan Bảo Ngọc',
    phone: '0901000007',
    role: 'COACH',
  },
];

const MEMBER_NAMES = [
  'Nguyễn Minh Anh',
  'Trần Quốc Bảo',
  'Lê Thu Cúc',
  'Hoàng Đức Dũng',
  'Phạm Gia Hân',
  'Vũ Ngọc Hà',
  'Đặng Thanh Hải',
  'Bùi Khánh Linh',
  'Đỗ Hoàng Long',
  'Ngô Phương Mai',
  'Dương Tuấn Minh',
  'Lý Bảo Ngọc',
  'Trịnh Văn Phúc',
  'Mai Thị Quỳnh',
  'Hồ Đăng Khoa',
  'Tạ Minh Tâm',
  'Cao Thùy Trang',
  'Lâm Quang Vinh',
  'Châu Ngọc Yến',
  'Kiều Anh Tuấn',
  'Phùng Thảo Vy',
  'Tô Gia Huy',
  'Quách Mỹ Duyên',
  'Lương Nhật Nam',
  'Vương Hải Yến',
  'Đinh Công Sơn',
  'Triệu Kim Oanh',
  'La Minh Khôi',
  'Hà Bích Ngân',
  'Mạc Đức Thịnh',
];
/** member1..member30; member1–15 dùng cho các tình huống trong tài liệu demo. */
export const DEMO_MEMBERS = MEMBER_NAMES.map((fullName, index) => ({
  email: `member${index + 1}@scms.local`,
  fullName,
  phone: `09020000${String(index + 1).padStart(2, '0')}`,
  role: 'MEMBER',
}));
