import { Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { createMappedPurchase, createMappedAttendance } from '../course-only/mapped-purchases.js';
import { populateCompletedCourse } from '../course-only/mapped-summaries.js';

const localDate = (date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: TIME.VIETNAM_ZONE }).format(date);
const clock = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME.VIETNAM_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

/** Exact API/form values for the course created live, using the same local calendar. */
export const councilClassPayload = (template, now) => {
  const first = template.sessions[0];
  return {
    name: template.name,
    description: 'Khóa học minh họa được tạo trực tiếp tại buổi báo cáo',
    subjectId: template.subjectId,
    roomId: template.roomId,
    coachId: template.coachId,
    price: template.price,
    capacity: template.capacity,
    startsOn: localDate(first.startAt),
    endsOn: localDate(template.sessions.at(-1).endAt),
    weeklySchedule: [
      {
        dayOfWeek: new Date(localDate(first.startAt)).getUTCDay(),
        startTime: clock(first.startAt),
        endTime: clock(first.endAt),
      },
    ],
    registrationStartAt: new Date(now.getTime() - TIME.MS_PER_DAY).toISOString(),
    registrationEndAt: new Date(first.startAt.getTime() - TIME.MS_PER_HOUR).toISOString(),
    status: Enums.ClassStatus.OPEN,
  };
};

/** Materialize a namespaced course and its real sessions; historical rows are labelled demo. */
export const createCouncilCourse = (db, { template, catalog, tag, now }) => {
  const coach = template.alternate || template.alternateCoach ? catalog.otherCoach : catalog.coach;
  const room = template.alternate || template.alternateRoom ? catalog.otherRoom : catalog.room;
  const subject = template.otherSubject ? catalog.otherSubject : catalog.subject;
  const first = template.sessions[0].startAt;
  const last = template.sessions.at(-1).endAt;
  const registrationStartAt = new Date(
    Math.min(now.getTime() - TIME.MS_PER_DAY, first.getTime() - 14 * TIME.MS_PER_DAY),
  );
  const schedule = new Map(
    template.sessions.map((s) => {
      const row = {
        dayOfWeek: new Date(localDate(s.startAt)).getUTCDay(),
        startTime: clock(s.startAt),
        endTime: clock(s.endAt),
      };
      return [JSON.stringify(row), row];
    }),
  );
  return db.gymClass.create({
    data: {
      name: `${tag} · ${template.key} · ${template.name}`,
      description:
        'Dữ liệu diễn tập hội đồng; map theo ngày chạy, không phải giao dịch ngân hàng thật.',
      subjectId: subject.id,
      coachId: coach.id,
      roomId: room.id,
      capacity: template.capacity,
      price: template.price,
      status: template.completed ? Enums.ClassStatus.COMPLETED : Enums.ClassStatus.OPEN,
      startsOn: new Date(localDate(first)),
      endsOn: new Date(localDate(last)),
      registrationStartAt,
      registrationEndAt: new Date(last.getTime() - TIME.MS_PER_HOUR),
      createdAt: registrationStartAt,
      weeklySchedule: [...schedule.values()],
      sessions: {
        create: template.sessions.map((s) => ({
          ...s,
          status: s.endAt <= now ? Enums.SessionStatus.COMPLETED : Enums.SessionStatus.SCHEDULED,
          coachId: coach.id,
          roomId: room.id,
          coachName: coach.fullName,
          roomName: room.name,
          description: `Buổi minh họa ${template.key}`,
        })),
      },
    },
    include: { sessions: { orderBy: { startAt: 'asc' } } },
  });
};

/** Set up purchases before lessons and keep the live demonstration actions unperformed. */
export const populateCouncilCourse = async (db, { template, course, catalog }, context) => {
  if (template.completed) {
    const member = template.key === 'C' ? catalog.member : catalog.otherMember;
    const dates = course.sessions.map((s) => localDate(s.startAt));
    await populateCompletedCourse(
      db,
      { course, template: { mode: 'draft', dates }, catalog: { members: [member] } },
      context,
    );
    if (template.key === 'C')
      await db.courseSummaryItem.updateMany({
        where: { summary: { classId: course.id } },
        data: {
          result: Enums.CourseResult.PASS,
          progress: 4,
          comment: 'Dữ liệu nền đầy đủ; HLV cập nhật và công bố trong WF4',
        },
      });
    return;
  }
  if (['B', 'FULL'].includes(template.key)) {
    const member = template.key === 'B' ? catalog.member : catalog.otherMember;
    const paidAt = new Date(
      Math.min(
        context.now.getTime() - TIME.MS_PER_HOUR,
        course.sessions[0].startAt.getTime() - TIME.MS_PER_DAY,
      ),
    );
    await createMappedPurchase(db, { course, member, index: 0, paidAt }, context);
    if (template.key === 'B')
      await createMappedAttendance(db, { ...course, sessions: [course.sessions[0]] }, member, 0);
  }
  const members =
    template.key === 'R'
      ? [catalog.member, catalog.otherMember]
      : template.key === 'MEMBER_CONFLICT'
        ? [catalog.otherMember]
        : [];
  if (members.length)
    await db.classEnrollment.createMany({
      data: members.map((m) => ({
        classId: course.id,
        memberId: m.id,
        enrolledBy: context.admin.id,
        status: Enums.EnrollmentStatus.BOOKED,
      })),
    });
};
