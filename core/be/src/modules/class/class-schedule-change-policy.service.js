import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { overlaps } from './class-schedule.service.js';
import {
  assertRescheduleMembers,
  assertRescheduleNotice,
} from './class-reschedule-policy.service.js';
import { assertSessionResources } from './session-resource.service.js';

const sameTime = (a, b) => a.getTime() === b.getTime();

/** Validate the resulting schedule, including individually rescheduled sessions kept by the sync. */
export const assertScheduleChange = async (
  db,
  { old, future, plan, snapshots },
  now = new Date(),
) => {
  if (!plan.cancel.length && !plan.create.length && !plan.updates.length)
    return { enrolledCount: old._count.enrollments, conflicts: [] };
  if (
    old.sessions.some(
      (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt <= now && s.endAt > now,
    )
  )
    throw ApiError.businessRule('Không đổi lịch khi lớp đang có buổi diễn ra');
  const removed = new Set(plan.cancel.map((s) => s.id));
  const patches = new Map(plan.updates.map(({ session, patch }) => [session.id, patch]));
  const projected = future
    .filter((s) => s.status === Enums.SessionStatus.SCHEDULED && !removed.has(s.id))
    .map((s) => ({ ...s, ...patches.get(s.id) }))
    .concat(plan.create.map((s) => ({ ...s, ...snapshots })))
    .map((s) => ({
      ...s,
      roomId: s.roomId ?? snapshots.roomId,
      coachId: s.coachId ?? snapshots.coachId,
    }));
  const changedTimes = plan.updates.filter(
    ({ session, patch }) =>
      (patch.startAt && !sameTime(patch.startAt, session.startAt)) ||
      (patch.endAt && !sameTime(patch.endAt, session.endAt)),
  );
  await assertRescheduleNotice(
    [
      ...plan.cancel.map((s) => s.startAt),
      ...plan.create.map((s) => s.startAt),
      ...changedTimes.flatMap(({ session, patch }) => [
        session.startAt,
        patch.startAt ?? session.startAt,
      ]),
    ],
    now,
  );
  await assertProjectedResources(
    db,
    projected,
    future.map((s) => s.id),
  );
  return assertRescheduleMembers(db, old.id, projected, now);
};

const assertProjectedResources = async (db, slots, excludedIds) => {
  const groups = new Map();
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    if (
      slots
        .slice(i + 1)
        .some(
          (other) =>
            overlaps(slot, other) &&
            (slot.roomId === other.roomId || slot.coachId === other.coachId),
        )
    )
      throw ApiError.conflict('Lịch mới bị trùng phòng hoặc HLV giữa các buổi của lớp');
    const key = `${slot.roomId}:${slot.coachId}`;
    if (!groups.has(key)) groups.set(key, { resources: slot, slots: [] });
    groups.get(key).slots.push(slot);
  }
  for (const group of groups.values())
    await assertSessionResources(db, group.slots, group.resources, { ids: excludedIds });
};
