import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { queueClassEvent } from '../class/class-event.service.js';
import { loadFutureSession, cancelSession } from '../class/class-session.service.js';
import { assertSessionResources } from '../class/session-resource.service.js';

const rangeFor = (data) => ({ startAt: new Date(data.startAt), endAt: new Date(data.endAt) });
async function affected(db, roomId, range) {
  return db.classSession.findMany({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      startAt: { lt: range.endAt },
      endAt: { gt: range.startAt },
      OR: [{ roomId }, { roomId: null, gymClass: { roomId } }],
    },
    include: {
      gymClass: {
        include: {
          _count: { select: { enrollments: { where: { status: Enums.EnrollmentStatus.BOOKED } } } },
        },
      },
    },
    orderBy: { startAt: 'asc' },
  });
}

async function availableRoom(session, room) {
  if (room.capacity < session.gymClass._count.enrollments || session.startAt <= new Date())
    return false;
  try {
    await assertSessionResources(
      prisma,
      [session],
      { roomId: room.id, coachId: session.coachId ?? session.gymClass.coachId },
      { ids: [session.id] },
    );
    return true;
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    return false;
  }
}

/** Xem trước các buổi ảnh hưởng và phòng đủ sức chứa thực tế. */
export const preview = async (roomId, data) => {
  if (!(await prisma.room.findUnique({ where: { id: roomId } })))
    throw ApiError.notFound('Không tìm thấy phòng');
  const sessions = await affected(prisma, roomId, rangeFor(data));
  const rooms = await prisma.room.findMany({ where: { id: { not: roomId }, isActive: true } });
  const result = [];
  for (const session of sessions) {
    const suggestions = [];
    for (const room of rooms) {
      if (await availableRoom(session, room)) suggestions.push(room);
    }
    result.push({ ...session, suggestions });
  }
  return result;
};

async function relocate(db, session, roomId, actor) {
  const room = await db.room.findFirst({ where: { id: roomId, isActive: true } });
  if (!room || room.capacity < session.gymClass._count.enrollments)
    throw ApiError.businessRule('Phòng mới không hoạt động hoặc không đủ sức chứa');
  await assertSessionResources(
    db,
    [session],
    { roomId, coachId: session.coachId ?? session.gymClass.coachId },
    { ids: [session.id] },
  );
  await db.classSession.update({
    where: { id: session.id },
    data: { roomId, roomName: room.name },
  });
  await queueClassEvent(db, session.gymClass, Enums.NotificationKind.CLASS_CHANGED, {
    sessionId: session.id,
    beforeRoomId: session.roomId,
    roomId,
    actorId: actor.id,
  });
}

/** BR-2.10: toàn bộ kế hoạch chuyển/huỷ được kiểm tra lại dưới khoá, lỗi rollback cả đợt. */
export const create = (roomId, data, actor) =>
  withScheduleTransaction(async (db) => {
    if (!(await db.room.findUnique({ where: { id: roomId } })))
      throw ApiError.notFound('Không tìm thấy phòng');
    const range = rangeFor(data);
    if (range.startAt < new Date()) throw ApiError.businessRule('Bảo trì phải bắt đầu ở tương lai');
    const sessions = await affected(db, roomId, range);
    const ids = sessions.map((s) => s.id);
    if (
      data.assignments.length !== ids.length ||
      data.assignments.some((a) => !ids.includes(a.sessionId))
    )
      throw ApiError.conflict('Danh sách buổi đã thay đổi; hãy xem trước lại', { sessionIds: ids });
    const item = await db.roomMaintenance.create({
      data: { roomId, ...range, reason: data.reason, actorId: actor.id },
    });
    for (const session of sessions) {
      await loadFutureSession(db, session.id);
      const assignment = data.assignments.find((a) => a.sessionId === session.id);
      if (assignment.roomId === null) await cancelSession(db, session, data.reason, actor);
      else await relocate(db, session, assignment.roomId, actor);
    }
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'RoomMaintenance',
      entityId: item.id,
      meta: data,
    });
    return item;
  });
