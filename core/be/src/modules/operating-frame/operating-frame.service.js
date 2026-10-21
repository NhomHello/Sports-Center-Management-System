import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';

const ENTITY = 'OperatingFrame';
const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME.VIETNAM_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Giờ "HH:mm" theo giờ Việt Nam của một thời điểm. */
export const vietnamClock = (date) => clock.format(date);

/** Khung giờ đang hoạt động, sắp theo giờ bắt đầu. */
export const loadActiveFrames = (db = prisma) =>
  db.operatingFrame.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } });

/** Khung chứa trọn khoảng [start, end] ("HH:mm"), hoặc undefined. */
export const frameFor = (frames, start, end) =>
  frames.find((frame) => frame.startTime <= start && end <= frame.endTime);

const describeFrames = (frames) =>
  frames.map((f) => `${f.name} ${f.startTime}–${f.endTime}`).join(', ');

/**
 * Mỗi khung giờ học (giờ Việt Nam) phải nằm trọn trong một khung giờ hoạt động.
 * @param {object} db
 * @param {{ startTime: string, endTime: string }[]} ranges
 */
export const assertWithinFrames = async (db, ranges) => {
  const frames = await loadActiveFrames(db);
  if (!frames.length) throw ApiError.businessRule('Chưa cấu hình khung giờ hoạt động');
  const outside = ranges.find((r) => !frameFor(frames, r.startTime, r.endTime));
  if (outside)
    throw ApiError.businessRule(
      `Giờ học ${outside.startTime}–${outside.endTime} không nằm trọn trong một khung giờ hoạt động (${describeFrames(frames)})`,
    );
};

/** Một buổi cụ thể: cùng ngày Việt Nam và nằm trong một khung giờ. */
export const assertSessionWithinFrames = (db, { startAt, endAt }) => {
  if (endAt.getTime() - startAt.getTime() >= TIME.MS_PER_DAY)
    throw ApiError.businessRule('Buổi học phải kết thúc trong ngày');
  return assertWithinFrames(db, [
    { startTime: vietnamClock(startAt), endTime: vietnamClock(endAt) },
  ]);
};

const assertNoOverlap = async (db, frame, excludeId) => {
  if (frame.isActive === false) return;
  const others = await db.operatingFrame.findMany({
    where: { isActive: true, ...(excludeId && { id: { not: excludeId } }) },
  });
  const clash = others.find((o) => frame.startTime < o.endTime && o.startTime < frame.endTime);
  if (clash) throw ApiError.businessRule(`Khung giờ chồng lên khung "${clash.name}"`);
};

/** Không ngừng/thu hẹp khung khi còn buổi học tương lai rơi ra ngoài các khung còn lại. */
const assertSessionsStillFit = async (db, frames) => {
  const sessions = await db.classSession.findMany({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      startAt: { gt: new Date() },
      gymClass: { status: { not: Enums.ClassStatus.CANCELLED } },
    },
    select: { startAt: true, endAt: true, gymClass: { select: { name: true } } },
  });
  const orphan = sessions.find(
    (s) => !frameFor(frames, vietnamClock(s.startAt), vietnamClock(s.endAt)),
  );
  if (orphan)
    throw ApiError.businessRule(
      `Lớp "${orphan.gymClass.name}" còn buổi ${vietnamClock(orphan.startAt)} nằm ngoài khung giờ mới`,
    );
};

const save = (db, actor, { id, data }) =>
  withScheduleTransaction(async (tx) => {
    const before = id ? await tx.operatingFrame.findUnique({ where: { id } }) : null;
    if (id && !before) throw ApiError.notFound('Không tìm thấy khung giờ');
    const next = { ...before, ...data };
    if (next.endTime <= next.startTime)
      throw ApiError.businessRule('Giờ kết thúc phải sau giờ bắt đầu');
    await assertNoOverlap(tx, next, id);
    const item = id
      ? await tx.operatingFrame.update({ where: { id }, data })
      : await tx.operatingFrame.create({ data });
    if (id) await assertSessionsStillFit(tx, await loadActiveFrames(tx));
    await writeScheduleAudit(tx, actor, {
      action: id ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.CREATE,
      entity: ENTITY,
      entityId: item.id,
      meta: { before, after: data },
    });
    return item;
  });

/** Danh sách khung giờ (cả khung ngừng hoạt động để quản lý bật lại). */
export const list = () =>
  prisma.operatingFrame.findMany({ orderBy: [{ isActive: 'desc' }, { startTime: 'asc' }] });

/** Tạo khung giờ; không được chồng lên khung đang hoạt động. */
export const create = (data, actor) => save(prisma, actor, { data });

/** Sửa / bật / ngừng khung giờ; không để buổi học tương lai rơi ra ngoài khung. */
export const update = (id, data, actor) => save(prisma, actor, { id, data });
