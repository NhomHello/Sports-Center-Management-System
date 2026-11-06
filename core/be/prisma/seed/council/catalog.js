import { env } from '../../../src/config/env.js';
import { hashPassword } from '../../../src/common/utils/password.js';

/** Create a distinct demo namespace, preserving existing users, roles and business records. */
export const createCouncilCatalog = async (db, tag) => {
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const memberRole = await db.role.findFirstOrThrow({ where: { isDefault: true } });
  const coachRole = await db.role.findUniqueOrThrow({ where: { code: 'COACH' } });
  const receptionRole = await db.role.findUniqueOrThrow({ where: { code: 'RECEPTIONIST' } });
  const user = (key, fullName, roleId) =>
    db.user.create({
      data: {
        email: `${tag}.${key}@scms.test`,
        fullName: `[${tag}] ${fullName}`,
        passwordHash,
        roleId,
        emailVerifiedAt: new Date(),
      },
    });
  const coach = await user('coach', 'Huấn luyện viên chính', coachRole.id);
  const otherCoach = await user('coach2', 'Huấn luyện viên đối chứng', coachRole.id);
  const member = await user('m', 'Hội viên M', memberRole.id);
  const otherMember = await user('n', 'Hội viên N', memberRole.id);
  const reception = await user('reception', 'Lễ tân', receptionRole.id);
  const subject = await db.subject.create({ data: { name: `${tag} · Fitness` } });
  const otherSubject = await db.subject.create({ data: { name: `${tag} · Bộ môn khác` } });
  const type = await db.roomType.create({
    data: {
      name: `${tag} · Phòng nhóm`,
      subjects: {
        create: [subject, otherSubject].map((s) => ({ subjectId: s.id })),
      },
    },
  });
  const room = await db.room.create({
    data: { name: `${tag} · Studio 1`, capacity: 12, roomTypeId: type.id },
  });
  const otherRoom = await db.room.create({
    data: { name: `${tag} · Studio 2`, capacity: 12, roomTypeId: type.id },
  });
  await db.coachSubject.createMany({
    data: [coach, otherCoach].flatMap((c) =>
      [subject, otherSubject].map((s) => ({ coachId: c.id, subjectId: s.id })),
    ),
  });
  await db.coachProfile.create({
    data: { userId: coach.id, bio: 'Dữ liệu diễn tập hội đồng', experienceYears: 5 },
  });
  await db.memberProfile.create({
    data: { userId: member.id, goals: 'Nâng sức bền', level: 'BEGINNER', shareWithCoach: true },
  });
  return {
    coach,
    otherCoach,
    member,
    otherMember,
    reception,
    subject,
    otherSubject,
    room,
    otherRoom,
  };
};
