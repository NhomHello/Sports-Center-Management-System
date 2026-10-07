import { PERMISSIONS } from '@scms/shared';
import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './class-management.service.js';

/** Phạm vi của người gọi; `req.permissions` do middleware authorize gắn. */
const actorOf = (req) => ({
  userId: req.user.id,
  canReadAll: req.permissions.has(PERMISSIONS.CLASS_READ_ALL),
});

/** GET /class-management/classes */
export const list = async (req, res) => {
  const { data, meta } = await service.listClasses(actorOf(req), req.validated.query);
  sendSuccess(res, { data, meta });
};

/** GET /class-management/classes/:id */
export const detail = async (req, res) => {
  const data = await service.getClassDetail(actorOf(req), req.validated.params.id);
  sendSuccess(res, { data });
};

/** GET /class-management/sessions/:sessionId/roster */
export const roster = async (req, res) => {
  const data = await service.getSessionRoster(actorOf(req), req.validated.params.sessionId);
  sendSuccess(res, { data });
};
