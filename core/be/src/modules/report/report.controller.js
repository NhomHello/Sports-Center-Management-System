import { memberReport } from './report-member.service.js';
import { exportMembers } from './report-member-export.service.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { dashboard } from './report.service.js';
import { exportReport } from './report-export.service.js';
/** GET /reports/dashboard, /reports/revenue. */
export const getDashboard = async (req, res) =>
  sendSuccess(res, { data: await dashboard(req.validated.query) });
/** GET /reports/export: trả file nhị phân với đúng content-type. */
export const download = async (req, res) => {
  const file = await exportReport(req.validated.query);
  res.type(file.type).attachment(file.filename).send(file.buffer);
};

/** Báo cáo hội viên dùng cùng nhóm thời gian với doanh thu. */
export const members = async (req, res) => sendSuccess(res, { data: await memberReport(req.validated.query) });
/** Xuất cùng builder với tab hội viên. */
export const downloadMembers = async (req, res) => {
  const file = await exportMembers(req.validated.query);
  res.type(file.type).attachment(file.filename).send(file.buffer);
};
