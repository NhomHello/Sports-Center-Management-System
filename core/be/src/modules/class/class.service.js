import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
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
