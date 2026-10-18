import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { queueClassEvent } from './class-event.service.js';
import { refreshCancellationExceptions } from './class-exception.service.js';

const { SCHEDULED } = Enums.SessionStatus;
const time = (date) => date.getTime();
const toIso = (s) => ({ startAt: s.startAt.toISOString(), endAt: s.endAt.toISOString() });

/**
 * Giờ gốc theo lịch mẫu của các buổi đã đổi giờ riêng: lấy "before" của lần đổi đầu tiên trong
 * outbox class_events. Không có bản ghi thì coi giờ hiện tại là giờ gốc.
 */
const originalStarts = async (db, classId, sessions) => {
  const ids = new Set(sessions.filter((s) => s.rescheduledAt).map((s) => s.id));
  const origins = new Map();
  if (!ids.size) return origins;
  const events = await db.classEvent.findMany({
    where: { classId, kind: Enums.NotificationKind.CLASS_CHANGED },
    orderBy: { id: 'asc' },
    select: { changes: true },
  });
  for (const { changes } of events) {
    const id = changes?.sessionId;
    if (ids.has(id) && !origins.has(id) && changes.before?.startAt)
      origins.set(id, time(new Date(changes.before.startAt)));
  }
  return origins;
};

/** Buổi còn dùng phòng/HLV mặc định của lớp thì theo phòng/HLV mới; buổi đã đổi riêng giữ nguyên. */
const resourcePatch = (session, old, snapshots) => {
  const patch = {};
  if (session.roomId === old.roomId && snapshots.roomId !== old.roomId)
    Object.assign(patch, { roomId: snapshots.roomId, roomName: snapshots.roomName });
  if (session.coachId === old.coachId && snapshots.coachId !== old.coachId)
    Object.assign(patch, { coachId: snapshots.coachId, coachName: snapshots.coachName });
  return patch;
};

/** Phân loại buổi tương lai hiện có theo lịch mẫu mới; trả các thay đổi cần ghi. */
const planChanges = ({ future, origins, template, old, snapshots }) => {
  const byStart = new Map(template.map((s) => [time(s.startAt), s]));
  const covered = new Set();
  const cancel = [];
  const updates = [];
  for (const session of future) {
    const origin = origins.get(session.id) ?? time(session.startAt);
    const slot = byStart.get(origin);
    // Buổi đã huỷ riêng vẫn "chiếm" khung giờ để không bị sinh lại.
    if (slot) covered.add(origin);
    if (session.status !== SCHEDULED) continue;
    if (!slot) {
      cancel.push(session);
      continue;
    }
    const patch = resourcePatch(session, old, snapshots);
    if (!session.rescheduledAt && time(session.endAt) !== time(slot.endAt))
      patch.endAt = slot.endAt;
    if (Object.keys(patch).length) updates.push({ session, patch });
  }
  const create = template.filter((s) => !covered.has(time(s.startAt)));
  return { cancel, updates, create };
};

/**
 * Đồng bộ các buổi chưa diễn ra với lịch mẫu mới của lớp (BR-2.7). Chỉ huỷ buổi bị bỏ khỏi lịch,
 * chỉ tạo buổi mới thêm và giữ mọi thay đổi riêng từng buổi (đổi giờ, huỷ, đổi phòng/HLV).
 * Hội viên chỉ nhận thông báo khi thực sự có buổi thay đổi.
 * @returns {Promise<boolean>} true nếu có buổi thay đổi
 */
export async function syncFutureSessions(db, { old, actor, sessions, snapshots }) {
  const now = new Date();
  const ongoing = old.sessions.some(
    (s) => s.startAt <= now && s.endAt > now && s.status === SCHEDULED,
  );
  if (ongoing) throw ApiError.businessRule('Không đổi lịch khi lớp đang có buổi diễn ra');
  const future = old.sessions.filter((s) => s.startAt > now);
  const origins = await originalStarts(db, old.id, future);
  const { cancel, updates, create } = planChanges({
    future,
    origins,
    template: sessions,
    old,
    snapshots,
  });
  if (!cancel.length && !updates.length && !create.length) return false;
  if (cancel.length)
    await db.classSession.updateMany({
      where: { id: { in: cancel.map((s) => s.id) } },
      data: { status: Enums.SessionStatus.CANCELLED },
    });
  for (const { session, patch } of updates)
    await db.classSession.update({ where: { id: session.id }, data: patch });
  if (create.length)
    await db.classSession.createMany({
      data: create.map((s) => ({ ...s, ...snapshots, classId: old.id })),
    });
  const scheduled = await db.classSession.findMany({
    where: { classId: old.id, status: SCHEDULED, startAt: { gt: now } },
    orderBy: { startAt: 'asc' },
  });
  await refreshCancellationExceptions(db, old.id, scheduled);
  await queueClassEvent(db, old, Enums.NotificationKind.CLASS_CHANGED, {
    actorId: actor.id,
    before: cancel.map(toIso),
    after: create.map(toIso),
    updated: updates.map(({ session }) => session.id),
  });
  return true;
}
