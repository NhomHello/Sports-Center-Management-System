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
