import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './course-history.service.js';
const list = async (res, memberId, query) => {
  const { items, meta } = await service.listCourses(memberId, query);
  sendSuccess(res, { data: items, meta });
};
/** Chính chủ luôn lấy hội viên từ token. */
export const ownCourses = (req, res) => list(res, req.user.id, req.validated.query);
/** Đọc đủ buổi, kể cả buổi chưa có kết quả. */
export const ownCourse = async (req, res) =>
  sendSuccess(res, { data: await service.getCourse(req.user.id, req.validated.params.classId) });
/** Nhân viên có quyền quản lý điểm danh đọc hồ sơ được chọn. */
export const memberCourses = (req, res) =>
  list(res, req.validated.params.memberId, req.validated.query);
/** Chi tiết hội viên vẫn áp dụng điều kiện khóa thuộc lịch sử hội viên đó. */
export const memberCourse = async (req, res) =>
  sendSuccess(res, {
    data: await service.getCourse(req.validated.params.memberId, req.validated.params.classId),
  });
