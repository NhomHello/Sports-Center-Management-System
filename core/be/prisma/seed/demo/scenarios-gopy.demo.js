import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { excuseSession } from '../../../src/modules/attendance/attendance-excuse.service.js';
import { cancelEnrollment } from '../../../src/modules/cancellation/cancellation.service.js';
import { enroll } from '../../../src/modules/class/class-enrollment.service.js';
import { changePlan } from '../../../src/modules/purchase-change/purchase-change-request.service.js';
import { buyCourseAtCounter, orderCourseOnline, payAtCounter } from './payments.demo.js';

const as = (user, ...codes) => ({ user, permissions: new Set(codes) });

const paidEnrollment = (member) =>
  prisma.classEnrollment.findFirst({
    where: { memberId: member.id, status: 'BOOKED', invoiceId: { not: null } },
  });

/** member16: hủy khóa trước ngày bắt đầu → hoàn 100% vào số dư (demo "Dùng số dư"). */
const creditFromCancelledCourse = async (member, classes, staff) => {
  const existing = await paidEnrollment(member);
  if (!existing) await buyCourseAtCounter(member, classes.pilates, staff);
  const enrollment = existing ?? (await paidEnrollment(member));
  await cancelEnrollment(
    enrollment.id,
    { settlement: 'CREDIT', reason: 'Bận lịch công tác, giữ tiền để mua lần sau' },
    as(member, P.CLASS_CANCEL_SELF),
  );
};

/** member19: kỳ cũ đã kết thúc, đang dùng gói "Tự tập sáng sớm" (chỉ vào 05:00–09:00). */
const earlyBirdPlan = async (member, plans, staff) => {
  await prisma.membership.updateMany({
    where: { userId: member.id },
    data: {
      status: 'EXPIRED',
      activeUserId: null,
      endDate: new Date(Date.now() - TIME.MS_PER_DAY),
    },
  });
  await payAtCounter(member, plans.EARLY_30, staff);
};

/** member20: lễ tân đổi gói lên gói dài hơn, hóa đơn chênh lệch chờ thu tại quầy. */
const pendingPlanChange = async (member, plans, staff) => {
  const period = await prisma.membership.findFirstOrThrow({
    where: { userId: member.id, status: 'ACTIVE' },
    orderBy: { startDate: 'asc' },
  });
  await changePlan(period.id, { planId: plans.ACTIVE_90.id }, as(staff, P.MEMBERSHIP_MANAGE));
};

/** member21: đăng ký lớp miễn phí và báo nghỉ buổi gần nhất (Xin nghỉ, không tính vắng). */
const excusedSession = async (member, classes) => {
  await enroll(classes.zumba.id, member.id, member).catch(() => null);
  const session = await prisma.classSession.findFirstOrThrow({
    where: { classId: classes.zumba.id, status: 'SCHEDULED', startAt: { gt: new Date() } },
    orderBy: { startAt: 'asc' },
  });
  await excuseSession(session.id, {}, as(member, P.CLASS_CANCEL_SELF));
};

/** Giữ chỗ demo tới hết ngày mai để buổi demo vẫn thấy "Chờ thanh toán" (thực tế là 15 phút). */
const keepHold = async (invoice) => {
  const until = new Date(Date.now() + TIME.MS_PER_DAY);
  await prisma.invoice.update({ where: { id: invoice.id }, data: { expiresAt: until } });
  await prisma.classEnrollment.updateMany({
    where: { invoiceId: invoice.id },
    data: { holdExpiresAt: until },
  });
};

/** member17: giữ chỗ một khóa có học phí chưa học, chờ thanh toán online (lớp đầu tiên nhận được). */
const pendingCourseHold = async (member, classes) => {
  for (const key of ['hiit', 'boxingBasic', 'yogaMorning', 'pilates', 'strength']) {
    const held = await orderCourseOnline(member, classes[key]).catch(() => null);
    if (held) return keepHold(held);
  }
  return null;
};

/**
 * Tình huống demo sửa theo góp ý GV (GĐ2–4) cho member16–21; xem tài liệu demo mục góp ý GV.
 * member17: giữ chỗ một khóa chờ thanh toán online; member18: đã mua kỳ gói nối tiếp.
 */
export const seedFeedbackScenarios = async ({ users: u, plans }, classes) => {
  const staff = u.letan;
  await creditFromCancelledCourse(u.member16, classes, staff);
  await pendingCourseHold(u.member17, classes);
  await payAtCounter(u.member18, plans.STARTER_30, staff);
  await earlyBirdPlan(u.member19, plans, staff);
  await pendingPlanChange(u.member20, plans, staff);
  await excusedSession(u.member21, classes);
};
