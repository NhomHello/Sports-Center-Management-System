/** Flow 1 - Goi tap (man hinh 4, 7) */
export const membershipPlans = [
  {
    id: 1,
    code: 'MONTHLY',
    name: 'Gói 1 tháng',
    durationDays: 30,
    price: 500000,
    benefits: ['Tập không giới hạn giờ', 'Đăng ký tối đa 3 lớp/tuần'],
    isActive: true,
  },
  {
    id: 2,
    code: 'QUARTERLY',
    name: 'Gói 3 tháng',
    durationDays: 90,
    price: 1350000,
    benefits: ['Tập không giới hạn giờ', 'Đăng ký tối đa 5 lớp/tuần', 'Tặng 1 buổi PT'],
    isActive: true,
  },
  {
    id: 3,
    code: 'YEARLY',
    name: 'Gói 12 tháng',
    durationDays: 365,
    price: 4800000,
    benefits: ['Tập không giới hạn', 'Không giới hạn lớp', 'Tặng 5 buổi PT', 'Tủ đồ riêng'],
    isActive: true,
  },
  {
    id: 4,
    code: 'TRIAL',
    name: 'Gói dùng thử 7 ngày',
    durationDays: 7,
    price: 99000,
    benefits: ['Trải nghiệm phòng tập', '1 lớp bất kỳ'],
    isActive: false,
  },
];

/** Flow 1 - Goi cua hoi vien (man hinh 3, 6). memberId khop user mock trong BE seed. */
export const memberships = [
  {
    id: 101,
    memberId: 5,
    memberName: 'Phạm Hội Viên 1',
    planId: 2,
    planName: 'Gói 3 tháng',
    startDate: '2026-08-01',
    endDate: '2026-10-30',
    status: 'ACTIVE',
  },
  {
    id: 102,
    memberId: 6,
    memberName: 'Phạm Hội Viên 2',
    planId: 1,
    planName: 'Gói 1 tháng',
    startDate: '2026-08-15',
    endDate: '2026-09-14',
    status: 'ACTIVE',
  },
  {
    id: 103,
    memberId: 7,
    memberName: 'Phạm Hội Viên 3',
    planId: 1,
    planName: 'Gói 1 tháng',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'EXPIRED',
  },
];
