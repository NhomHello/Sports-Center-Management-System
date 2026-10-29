/**
 * Gói mẫu để demo mua và thanh toán. Gói chỉ khác nhau về thời hạn và đơn giá mỗi ngày
 * (gói dài rẻ hơn), mọi hội viên có membership còn hiệu lực đều có quyền lợi như nhau.
 */
const COMMON_BENEFITS = [
  'Sử dụng toàn bộ thiết bị và phòng tập',
  'Đăng ký lớp học',
  'Theo dõi lịch sử trên hệ thống',
];

export const SEED_MOCK_PLANS = [
  {
    code: 'STARTER_30',
    name: 'Khởi động 30 ngày',
    description: 'Gói linh hoạt dành cho hội viên mới bắt đầu.',
    durationDays: 30,
    price: 360000,
    benefits: COMMON_BENEFITS,
  },
  {
    code: 'ACTIVE_90',
    name: 'Năng động 90 ngày',
    description: 'Lựa chọn cân bằng cho lịch tập đều đặn, rẻ hơn mỗi ngày.',
    durationDays: 90,
    price: 900000,
    benefits: COMMON_BENEFITS,
  },
  {
    code: 'BASIC_60',
    name: 'Cân bằng 60 ngày',
    description: 'Gói tập vừa đủ cho hội viên duy trì thói quen.',
    durationDays: 60,
    price: 600000,
    benefits: COMMON_BENEFITS,
  },
  {
    code: 'PLUS_120',
    name: 'Bứt tốc 120 ngày',
    description: 'Gói dài hạn linh hoạt cho lịch tập thường xuyên.',
    durationDays: 120,
    price: 1080000,
    benefits: COMMON_BENEFITS,
  },
  {
    code: 'COMMIT_365',
    name: 'Bứt phá 365 ngày',
    description: 'Đơn giá mỗi ngày thấp nhất cho hành trình tập luyện dài hạn.',
    durationDays: 365,
    price: 2880000,
    benefits: COMMON_BENEFITS,
  },
];
