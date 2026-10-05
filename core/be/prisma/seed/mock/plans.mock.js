/** Danh mục gói mẫu tối thiểu để demo luồng xem, mua và thanh toán Sprint 1. */
export const SEED_MOCK_PLANS = [
  {
    code: 'STARTER_30',
    name: 'Khởi động 30 ngày',
    description: 'Gói linh hoạt dành cho hội viên mới bắt đầu.',
    durationDays: 30,
    price: 360000,
    benefits: ['Tập gym không giới hạn', 'Sử dụng phòng thay đồ', 'Theo dõi gói trên hệ thống'],
  },
  {
    code: 'ACTIVE_90',
    name: 'Năng động 90 ngày',
    description: 'Lựa chọn cân bằng cho lịch tập đều đặn.',
    durationDays: 90,
    price: 900000,
    benefits: ['Toàn bộ quyền lợi gói 30 ngày', 'Tham gia lớp nhóm', 'Tặng 1 buổi hướng dẫn'],
  },
  {
    code: 'COMMIT_365',
    name: 'Bứt phá 365 ngày',
    description: 'Tiết kiệm nhất cho hành trình tập luyện dài hạn.',
    durationDays: 365,
    price: 2880000,
    benefits: ['Toàn bộ quyền lợi gói 90 ngày', 'Ưu tiên đăng ký lớp', 'Đánh giá thể lực định kỳ'],
  },
];
