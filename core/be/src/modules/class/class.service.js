import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { queueClassEvent } from './class-event.service.js';
import { buildSessions, validateResources } from './class-schedule.service.js';

const CLASS_INCLUDE = Object.freeze({
  subject: true,
  room: true,
  coach: {
    select: {
      id: true,
      fullName: true,
    },
  },
  sessions: {
    orderBy: {
      startAt: 'asc',
    },
  },
});

const toData = (data) => ({
  ...data,
  startsOn: new Date(data.startsOn),
  endsOn: new Date(data.endsOn),
  registrationStartAt: new Date(data.registrationStartAt),
  registrationEndAt: new Date(data.registrationEndAt),
});

const toDateOnly = (value) => value.toISOString().split('T')[0];

const hasScheduleChanged = (old, data) =>
  old.roomId !== data.roomId ||
  old.coachId !== data.coachId ||
  toDateOnly(old.startsOn) !== data.startsOn ||
  toDateOnly(old.endsOn) !== data.endsOn ||
  JSON.stringify(old.weeklySchedule) !== JSON.stringify(data.weeklySchedule);

const replaceFutureSessions = async (db, classId, sessions) => {
  const now = new Date();

  await db.classSession.updateMany({
    where: {
      classId,
      startAt: { gt: now },
      status: Enums.SessionStatus.SCHEDULED,
    },
    data: {
      status: Enums.SessionStatus.CANCELLED,
    },
  });

  await db.classSession.createMany({
    data: sessions.map((session) => ({
      ...session,
      classId,
    })),
  });
};

/**
 * Tao lop va cac buoi hoc trong cung mot transaction.
 *
 * @param {object} data
 * @param {{ id?: number }} actor
 * @returns {Promise<object>}
 */
export const create = (data, actor) =>
  withScheduleTransaction(async (db) => {
    const sessions = buildSessions(data);

    await validateResources(db, data, sessions);

    const item = await db.gymClass.create({
      data: {
        ...toData(data),
        sessions: {
          create: sessions,
        },
      },
      include: CLASS_INCLUDE,
    });

    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'GymClass',
      entityId: item.id,
      meta: data,
    });

    return item;
  });

/**
 * Cap nhat lop va thay the cac buoi hoc tuong lai neu lich thay doi.
 *
 * @param {number} id
 * @param {object} data
 * @param {{ id?: number }} actor
 * @returns {Promise<object>}
 */
export const update = (id, data, actor) =>
  withScheduleTransaction(async (db) => {
    const old = await db.gymClass.findUnique({
      where: { id },
      include: {
        sessions: true,
      },
    });

    if (!old) {
      throw ApiError.notFound('Không tìm thấy lớp');
    }

    if (old.status === Enums.ClassStatus.CANCELLED) {
      throw ApiError.businessRule('Lớp đã hủy không thể sửa');
    }

    const sessions = buildSessions(data);

    await validateResources(db, data, sessions, id);

    const scheduleChanged = hasScheduleChanged(old, data);

    if (scheduleChanged) {
      await replaceFutureSessions(db, id, sessions);
    }

    const item = await db.gymClass.update({
      where: { id },
      data: toData(data),
      include: CLASS_INCLUDE,
    });

    if (scheduleChanged) {
      await queueClassEvent(db, item, Enums.NotificationKind.CLASS_CHANGED, {
        roomId: data.roomId,
        coachId: data.coachId,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
        weeklySchedule: data.weeklySchedule,
      });
    }

    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'GymClass',
      entityId: id,
      meta: data,
    });

    return item;
  });

/**
 * Huy lop va cac buoi hoc tuong lai.
 *
 * @param {number} id
 * @param {{ id?: number }} actor
 * @returns {Promise<object>}
 */
export const cancel = (id, actor) =>
  withScheduleTransaction(async (db) => {
    const item = await db.gymClass.findUnique({
      where: { id },
      include: CLASS_INCLUDE,
    });

    if (!item) {
      throw ApiError.notFound('Không tìm thấy lớp');
    }

    if (item.status === Enums.ClassStatus.CANCELLED) {
      return item;
    }

    await db.classSession.updateMany({
      where: {
        classId: id,
        startAt: { gt: new Date() },
        status: Enums.SessionStatus.SCHEDULED,
      },
      data: {
        status: Enums.SessionStatus.CANCELLED,
      },
    });

    const updated = await db.gymClass.update({
      where: { id },
      data: {
        status: Enums.ClassStatus.CANCELLED,
      },
      include: CLASS_INCLUDE,
    });

    await queueClassEvent(db, updated, Enums.NotificationKind.CLASS_CANCELLED);

    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.DELETE,
      entity: 'GymClass',
      entityId: id,
    });

    return updated;
  });
