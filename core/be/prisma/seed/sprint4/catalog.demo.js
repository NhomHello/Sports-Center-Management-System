import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { hashPassword } from '../../../src/common/utils/password.js';

/** Dữ liệu có prefix riêng, upsert chỉ bản demo, không reset DB hoặc sửa hồ sơ thật. */
export const seedSprint4Catalog = async () => {
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'COACH' } });
  const memberRole = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const coach = await prisma.user.upsert({ where: { email: 's4.coach@scms.test' }, update: {}, create: {
    email: 's4.coach@scms.test', fullName: 'HLV Nguyễn Minh An (Demo S4)', roleId: role.id, passwordHash, emailVerifiedAt: new Date() } });
  const members = [];
  for (const [i, fullName] of ['Trần Hà Linh', 'Lê Gia Bảo', 'Phạm Minh Anh'].entries()) members.push(await prisma.user.upsert({
    where: { email: `s4.member${i + 1}@scms.test` }, update: {}, create: { email: `s4.member${i + 1}@scms.test`, fullName: `${fullName} (Demo S4)`,
      roleId: memberRole.id, passwordHash, emailVerifiedAt: new Date() } }));
  const subject = await prisma.subject.upsert({ where: { name: 'S4 Demo · Fitness' }, update: {}, create: { name: 'S4 Demo · Fitness' } });
  const roomType = await prisma.roomType.upsert({ where: { name: 'S4 Demo · Phòng nhóm' }, update: {}, create: { name: 'S4 Demo · Phòng nhóm', subjects: { create: { subjectId: subject.id } } } });
  const room = await prisma.room.upsert({ where: { name: 'S4 Demo · Studio' }, update: {}, create: { name: 'S4 Demo · Studio', capacity: 15, roomTypeId: roomType.id } });
  await prisma.coachSubject.upsert({ where: { coachId_subjectId: { coachId: coach.id, subjectId: subject.id } }, update: {}, create: { coachId: coach.id, subjectId: subject.id } });
  await prisma.coachProfile.upsert({ where: { userId: coach.id }, update: {}, create: { userId: coach.id,
    bio: 'HLV Fitness hướng dẫn an toàn theo trình độ học viên. Hồ sơ minh hoạ Sprint 4.', experienceYears: 6,
    certifications: ['Chứng chỉ Fitness cơ bản (dữ liệu demo)'], publicEmail: 's4.coach@scms.test', publicPhone: '0900000000', zalo: '0900000000', showContact: true } });
  for (const [i, user] of members.entries()) await prisma.memberProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id,
    birthDate: new Date('2000-01-01'), gender: 'UNDISCLOSED', heightCm: 165 + i, weightKg: 60 + i,
    goals: 'Nâng sức bền và vận động đều đặn', level: 'BEGINNER', healthNotes: 'Dữ liệu minh hoạ, không phải hồ sơ sức khoẻ thực.',
    emergencyName: 'Người liên hệ demo', emergencyPhone: '0900000001', shareWithCoach: i !== 2 } });
  const plan = await prisma.membershipPlan.upsert({ where: { code: 'S4_DEMO_30' }, update: {}, create: {
    code: 'S4_DEMO_30', name: 'S4 Demo · Tự tập 30 ngày', durationDays: 30, price: 450000 } });
  return { coach, members, room, subject, plan };
};
