/**
 * Tai khoan mau cho moi truong dev (chi seed khi SEED_MOCK_DATA=true).
 * Mat khau chung: SEED_MOCK_PASSWORD trong .env. roleCode khop prisma/seed/roles.seed.js.
 * id thuc te do DB cap; FE mock (core/fe/src/mocks) gia dinh thu tu: admin=1, letan=2, coach=3,4, member=5..9.
 */
export const SEED_MOCK_USERS = [
  {
    email: 'letan@scms.local',
    fullName: 'Trần Thị Lễ Tân',
    phone: '0901000001',
    roleCode: 'RECEPTIONIST',
  },
  {
    email: 'coach.yoga@scms.local',
    fullName: 'Nguyễn Văn Yoga',
    phone: '0901000002',
    roleCode: 'COACH',
  },
  { email: 'coach.gym@scms.local', fullName: 'Lê Văn Gym', phone: '0901000003', roleCode: 'COACH' },
  {
    email: 'member1@scms.local',
    fullName: 'Phạm Hội Viên 1',
    phone: '0901000011',
    roleCode: 'MEMBER',
  },
  {
    email: 'member2@scms.local',
    fullName: 'Phạm Hội Viên 2',
    phone: '0901000012',
    roleCode: 'MEMBER',
  },
  {
    email: 'member3@scms.local',
    fullName: 'Phạm Hội Viên 3',
    phone: '0901000013',
    roleCode: 'MEMBER',
  },
  {
    email: 'member4@scms.local',
    fullName: 'Phạm Hội Viên 4',
    phone: '0901000014',
    roleCode: 'MEMBER',
  },
  {
    email: 'member5@scms.local',
    fullName: 'Phạm Hội Viên 5',
    phone: '0901000015',
    roleCode: 'MEMBER',
  },
];
