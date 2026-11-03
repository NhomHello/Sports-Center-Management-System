import { populateCompletedCourse } from './mapped-summaries.js';
import { Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { seedSprint4Catalog } from '../sprint4/catalog.demo.js';
import { DATASET, courseTemplates, lessonAt } from './dataset-config.js';
import { createMappedPurchase } from './mapped-purchases.js';
const TOPICS = [
  'Khởi động và làm quen kỹ thuật',
  'Kiểm soát tư thế và nhịp thở',
  'Phối hợp động tác và sức bền',
  'Ôn tập, đánh giá và thả lỏng',
];

/** Bộ dữ liệu mới có liên kết thật, gồm lịch sử, tổng kết và tình huống giữ chỗ/hàng chờ. */
export const seedMappedCourseData = async (db, context) => {
  const catalog = await seedSprint4Catalog(db);
  if ([catalog.coach, ...catalog.members].some((user) => user.id === context.admin.id))
    throw new Error('Tài khoản demo trùng admin được giữ; từ chối map đè lên admin');
  const oldest = new Date(
    lessonAt(courseTemplates(context.now)[0].dates[0], 0).getTime() - 14 * TIME.MS_PER_DAY,
  );
  await db.user.updateMany({
    where: { id: { in: [catalog.coach.id, ...catalog.members.map((m) => m.id)] } },
    data: { createdAt: oldest },
  });
  const created = [];
  for (const template of courseTemplates(context.now)) {
    const course = await createCourse(db, template, catalog, context.now);
    if (template.mode === 'open') await populateOpen(db, { course, template, catalog }, context);
    else await populateCompletedCourse(db, { course, template, catalog }, context);
    created.push({ id: course.id, name: course.name, mode: template.mode });
  }
  return {
    courses: created,
    coachId: catalog.coach.id,
    memberIds: catalog.members.map((m) => m.id),
  };
};
function createCourse(db, template, { coach, room, subject }, now) {
  const sessions = template.dates.map((date, index) => ({
    startAt: lessonAt(date, template.hour),
    endAt: lessonAt(date, template.hour + 1),
    status:
      template.mode === 'open' ? Enums.SessionStatus.SCHEDULED : Enums.SessionStatus.COMPLETED,
    description: TOPICS[index],
    coachId: coach.id,
    roomId: room.id,
    coachName: coach.fullName,
    roomName: room.name,
  }));
  const isOpen = template.mode === 'open';
  const registrationStartAt = new Date(
    (isOpen ? now : sessions[0].startAt).getTime() - 7 * TIME.MS_PER_DAY,
  );
  return db.gymClass.create({
    data: {
      name: template.name,
      createdAt: registrationStartAt,
      updatedAt: isOpen ? now : sessions.at(-1).endAt,
      description:
        'Khóa học theo lịch cố định; giá trọn khóa được chia theo số buổi còn lại khi đăng ký giữa khóa.',
      coachId: coach.id,
      roomId: room.id,
      subjectId: subject.id,
      price: template.price,
      capacity: template.capacity ?? DATASET.HISTORY_CAPACITY,
      status: isOpen ? Enums.ClassStatus.OPEN : Enums.ClassStatus.COMPLETED,
      startsOn: new Date(template.dates[0]),
      endsOn: new Date(template.dates.at(-1)),
      weeklySchedule: isOpen
        ? [
            {
              dayOfWeek: new Date(template.dates[0]).getUTCDay(),
              startTime: '18:00',
              endTime: '19:00',
            },
          ]
        : [],
      registrationStartAt,
      registrationEndAt: new Date(sessions.at(-1).startAt.getTime() - TIME.MS_PER_HOUR),
      sessions: { create: sessions },
    },
    include: { sessions: { orderBy: { startAt: 'asc' } } },
  });
}
async function populateOpen(db, { course, template, catalog }, context) {
  if (template.tag !== 'open') return;
  await createMappedPurchase(
    db,
    { course, member: catalog.members[0], index: 0, paidAt: context.now },
    context,
  );
  await createMappedPurchase(
    db,
    { course, member: catalog.members[1], index: 1, paidAt: context.now, pending: true },
    context,
  );
  await db.classWaitlist.create({
    data: {
      classId: course.id,
      memberId: catalog.members[2].id,
      status: Enums.WaitlistStatus.WAITING,
      joinedAt: context.now,
    },
  });
}
