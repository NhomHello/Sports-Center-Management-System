import { SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, SPRINT3, TIME } from '../../constants/index.js';
import { createForUsers } from '../notification/notification.service.js';
import * as settings from '../setting/setting.service.js';
import { getClassActions } from './class-booking-policy.service.js';
import { CLASS_INCLUDE } from './class.mapper.js';
import { heldSeats } from './class-member-eligibility.service.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';

const W = Enums.WaitlistStatus;
const eligibleState = (db, item, memberId, now) =>
  getClassActions(db, { ...item, capacity: Number.MAX_SAFE_INTEGER }, memberId, now);

/** BR-2.16: expire và giữ chỗ FIFO dưới cùng schedule lock với enroll/cancel. */
export const promoteWaitlist = async (db, classId, now = new Date()) => {
  await db.classWaitlist.updateMany({
    where: { classId, status: W.OFFERED, offeredUntil: { lte: now } },
    data: { status: W.EXPIRED },
  });
  const item = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
  if (!item) return;
  if (item.status !== Enums.ClassStatus.OPEN || item.registrationEndAt <= now) {
    await db.classWaitlist.updateMany({
      where: { classId, status: { in: [W.WAITING, W.OFFERED] } },
      data: { status: W.CANCELLED },
    });
    return;
  }
  const held = await heldSeats(db, classId, now);
  let seats = item.capacity - item._count.enrollments - held;
  const waiting = await db.classWaitlist.findMany({
    where: { classId, status: W.WAITING },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
  });
  const hours = await settings.getValue(K.CLASS_WAITLIST_HOLD_HOURS);
  for (const row of waiting) {
    if (seats <= 0) break;
    const state = await eligibleState(db, item, row.memberId, now);
    if (!state.canEnroll) {
      await db.classWaitlist.update({ where: { id: row.id }, data: { status: W.CANCELLED } });
      continue;
    }
    const offeredUntil = new Date(
      Math.min(now.getTime() + hours * TIME.MS_PER_HOUR, item.registrationEndAt.getTime()),
    );
    await db.classWaitlist.update({
      where: { id: row.id },
      data: { status: W.OFFERED, offeredUntil },
    });
    await createForUsers({
      db,
      userIds: [row.memberId],
      kind: Enums.NotificationKind.WAITLIST_OFFER,
      title: 'Đã có chỗ trong lớp',
      message: `Lớp ${item.name} giữ chỗ cho bạn đến ${vietnamDateTime(offeredUntil)}. Hãy xác nhận đăng ký.`,
      eventKey: `waitlist:${row.id}:${offeredUntil.toISOString()}`,
    });
    seats -= 1;
  }
};

/** Chỉ vào hàng chờ khi lớp đã đầy (bao gồm các chỗ đang giữ). */
export const join = (classId, actor) =>
  withScheduleTransaction(async (db) => {
    await promoteWaitlist(db, classId);
    const item = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
    if (!item) throw ApiError.notFound('Không tìm thấy lớp');
    const existing = await db.classWaitlist.findUnique({
      where: { classId_memberId: { classId, memberId: actor.id } },
    });
    if (existing && [W.WAITING, W.OFFERED].includes(existing.status)) return existing;
    const state = await eligibleState(db, item, actor.id, new Date());
    if (!state.canEnroll) throw ApiError.businessRule(state.enrollReason);
    if (item._count.enrollments + (await heldSeats(db, classId, new Date())) < item.capacity)
      throw ApiError.conflict('Lớp còn chỗ, hãy đăng ký trực tiếp');
    const row = await db.classWaitlist.upsert({
      where: { classId_memberId: { classId, memberId: actor.id } },
      create: { classId, memberId: actor.id },
      update: { status: W.WAITING, joinedAt: new Date(), offeredUntil: null },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'ClassWaitlist',
      entityId: row.id,
    });
    return row;
  });

/** Rời hàng chờ giải phóng chỗ giữ và thông báo ngay người kế tiếp. */
export const leave = (classId, actor) =>
  withScheduleTransaction(async (db) => {
    await db.classWaitlist.updateMany({
      where: { classId, memberId: actor.id, status: { in: [W.WAITING, W.OFFERED] } },
      data: { status: W.CANCELLED },
    });
    await promoteWaitlist(db, classId);
    return { status: W.CANCELLED };
  });

/** Chỉ trả thông tin hàng chờ của chính người gọi. */
export const own = (classId, actor) =>
  prisma.classWaitlist.findUnique({
    where: {
      classId_memberId: { classId, memberId: actor.id },
    },
  });

/** Job chuyển chỗ quá hạn; mỗi lớp dùng transaction riêng và khoá chung. */
export const runWaitlistJob = async (now = new Date()) => {
  const rows = await prisma.classWaitlist.findMany({
    where: { status: { in: [W.WAITING, W.OFFERED] } },
    distinct: ['classId'],
    select: { classId: true },
  });
  for (const row of rows)
    await withScheduleTransaction((db) => promoteWaitlist(db, row.classId, now));
};

/** Worker không chạy chồng trong cùng tiến trình; khoá DB bảo vệ nhiều tiến trình. */
export const startWaitlistWorker = () => {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runWaitlistJob();
    } catch (err) {
      logger.error({ err }, 'Job danh sách chờ lỗi');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, SPRINT3.JOB_INTERVAL_MS);
  timer.unref();
  tick();
  return () => clearInterval(timer);
};
