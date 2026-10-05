import { sendSuccess } from '../../common/utils/api-response.js';
import { getWeek } from './schedule.service.js';
const load = async (req, res, kind) =>
  sendSuccess(res, {
    data: await getWeek({
      weekStart: req.validated.query.weekStart,
      kind,
      context: { user: req.user, permissions: req.permissions },
    }),
  });
/** Lịch của chính hội viên. */
export const own = (req, res) => load(req, res, 'own');
/** Lịch các lớp giảng dạy được phân công. */
export const teaching = (req, res) => load(req, res, 'teaching');
/** Lịch trong phạm vi quản lý. */
export const week = (req, res) => load(req, res, 'management');
