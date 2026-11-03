import { prisma } from '../../../src/config/db.js';
import { create } from '../../../src/modules/class/class.service.js';
import { TIME } from '../../../src/constants/index.js';

/** Khóa đang bán để demo chọn khóa → giữ chỗ → SePay; không tạo gói tự tập. */
export const seedOpenCourse = async ({ coach, room, subject }) => {
  const name = 'S4 Demo · Fitness đang nhận đăng ký';
  let item = await prisma.gymClass.findFirst({ where: { name } });
  if (!item) {
    const start = new Date(Date.now() + 7 * TIME.MS_PER_DAY);
    const startsOn = start.toISOString().slice(0, 10);
    const endsOn = new Date(start.getTime() + 28 * TIME.MS_PER_DAY).toISOString().slice(0, 10);
    item = await create({ name, description: 'Khóa rèn luyện sức bền theo lịch cố định. Giá trọn khóa, học phí giữa khóa tính theo số buổi còn lại.',
      subjectId: subject.id, roomId: room.id, coachId: coach.id, capacity: 12, price: 1200000,
      startsOn, endsOn, weeklySchedule: [{ dayOfWeek: new Date(startsOn).getUTCDay(), startTime: '18:00', endTime: '19:00' }],
      registrationStartAt: new Date(Date.now() - TIME.MS_PER_DAY).toISOString(), registrationEndAt: new Date(`${endsOn}T00:00:00+07:00`).toISOString(),
    }, coach);
  }
  await prisma.classSession.updateMany({ where: { classId: item.id, description: null }, data: { description: 'Khởi động, luyện kỹ thuật theo trình độ và thả lỏng cuối buổi.' } });
  return item;
};
