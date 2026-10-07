import { PERMISSIONS } from '@scms/shared';
import { sendSuccess } from '../../common/utils/api-response.js';
import * as scheduleService from './schedule.service.js';

/** GET /schedule/me */
export const myWeek = async (req, res) => {
  const data = await scheduleService.getMySchedule(req.user.id, req.validated.query);
  sendSuccess(res, { data });
};

/** GET /schedule/teaching */
export const teaching = async (req, res) => {
  const actor = {
    userId: req.user.id,
    canReadAll: req.permissions.has(PERMISSIONS.CLASS_READ_ALL),
  };
  const data = await scheduleService.getTeachingSchedule(actor, req.validated.query);
  sendSuccess(res, { data });
};
