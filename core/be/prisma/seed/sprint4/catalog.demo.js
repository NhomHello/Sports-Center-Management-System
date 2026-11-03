import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { hashPassword } from '../../../src/common/utils/password.js';

/** Dữ liệu có prefix riêng, upsert chỉ bản demo, không reset DB hoặc sửa hồ sơ thật. */
export const seedSprint4Catalog = async (db = prisma) => {
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const role = await db.role.findUniqueOrThrow({ where: { code: 'COACH' } });
  const memberRole = await db.role.findFirstOrThrow({ where: { isDefault: true } });
  const coach = await db.user.upsert({
    where: { email: 's4.coach@scms.test' },
    update: {},
    create: {
      email: 's4.coach@scms.test',
      fullName: 'HLV Nguyễn Minh An (Demo S4)',
      roleId: role.id,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  const members = [];
  for (const [i, fullName] of ['Trần Hà Linh', 'Lê Gia Bảo', 'Phạm Minh Anh'].entries())
    members.push(
      await db.user.upsert({
        where: { email: `s4.member${i + 1}@scms.test` },
        update: {},
        create: {
          email: `s4.member${i + 1}@scms.test`,
          fullName: `${fullName} (Demo S4)`,
          roleId: memberRole.id,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      }),
    );
  const subject = await db.subject.upsert({
    where: { name: 'S4 Demo · Fitness' },
    update: {},
    create: { name: 'S4 Demo · Fitness' },
  });
  const roomType = await db.roomType.upsert({
    where: { name: 'S4 Demo · Phòng nhóm' },
    update: {},
    create: { name: 'S4 Demo · Phòng nhóm', subjects: { create: { subjectId: subject.id } } },
  });
  const room = await db.room.upsert({
    where: { name: 'S4 Demo · Studio' },
    update: {},
    create: { name: 'S4 Demo · Studio', capacity: 15, roomTypeId: roomType.id },
  });
  await db.coachSubject.upsert({
    where: { coachId_subjectId: { coachId: coach.id, subjectId: subject.id } },
    update: {},
    create: { coachId: coach.id, subjectId: subject.id },
  });
  await db.coachProfile.upsert({
    where: { userId: coach.id },
    update: {},
    create: {
      userId: coach.id,
      bio: 'HLV Fitness hướng dẫn an toàn theo trình độ học viên. Hồ sơ minh hoạ Sprint 4.',
      experienceYears: 6,
      certifications: ['Chứng chỉ Fitness cơ bản (dữ liệu demo)'],
      publicEmail: 's4.coach@scms.test',
      publicPhone: '0900000000',
      zalo: '0900000000',
      showContact: true,
    },
  });
  for (const [i, user] of members.entries())
    await db.memberProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        birthDate: new Date('2000-01-01'),
        gender: 'UNDISCLOSED',
        heightCm: 165 + i,
        weightKg: 60 + i,
        goals: 'Nâng sức bền và vận động đều đặn',
        level: 'BEGINNER',
        healthNotes: 'Dữ liệu minh hoạ, không phải hồ sơ sức khoẻ thực.',
        emergencyName: 'Người liên hệ demo',
        emergencyPhone: '0900000001',
        shareWithCoach: i !== 2,
      },
    });
  return { coach, members, room, subject };
};
