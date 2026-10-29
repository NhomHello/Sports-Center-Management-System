import { sendSuccess } from '../../common/utils/api-response.js';
import * as profiles from './profile.service.js';
import * as directory from './coach-directory.service.js';
import * as students from './coach-members.service.js';
import * as avatar from './profile-avatar.service.js';
/** Hồ sơ HLV của token. */
export const ownCoach = async (req, res) =>
  sendSuccess(res, { data: await profiles.ownCoach(req.user.id) });
/** Cập nhật chính chủ. */
export const saveCoach = async (req, res) =>
  sendSuccess(res, { data: await profiles.updateCoach(req.validated.body, req.user) });
/** Hồ sơ hội viên của token. */
export const ownMember = async (req, res) =>
  sendSuccess(res, { data: await profiles.ownMember(req.user.id) });
/** Cập nhật tập luyện cá nhân. */
export const saveOwnMember = async (req, res) =>
  sendSuccess(res, {
    data: await profiles.updateMember(req.user.id, req.validated.body, req.user),
  });
/** Nhân viên xem hồ sơ hội viên. */
export const staffMember = async (req, res) =>
  sendSuccess(res, { data: await profiles.ownMember(req.validated.params.id) });
/** Nhân viên sửa hộ. */
export const saveStaffMember = async (req, res) =>
  sendSuccess(res, {
    data: await profiles.updateMember(req.validated.params.id, req.validated.body, req.user),
  });
/** Danh sách HLV công khai trong ứng dụng. */
export const coaches = async (req, res) => {
  const { items, meta } = await directory.listCoaches(req.validated.query);
  sendSuccess(res, { data: items, meta });
};
/** Chi tiết HLV đã lọc thông tin nội bộ. */
export const coach = async (req, res) =>
  sendSuccess(res, { data: await directory.coachDetail(req.validated.params.id) });
/** Học viên phụ trách. */
export const members = async (req, res) => {
  const { items, meta } = await students.listAssignedMembers(req.validated.query, req.user);
  sendSuccess(res, { data: items, meta });
};
/** Hồ sơ có giới hạn phân công. */
export const member = async (req, res) =>
  sendSuccess(res, {
    data: await students.assignedMemberDetail(req.validated.params.id, req.user),
  });
/** Ảnh binary đã kiểm tra tại service. */
export const uploadAvatar = async (req, res) =>
  sendSuccess(res, {
    data: await avatar.updateAvatar(req.body, req.get('content-type'), req.user),
  });
/** Binary ảnh dùng JWT như các endpoint khác. */
export const ownAvatar = async (req, res) => {
  const data = await avatar.getAvatar(req.user.id, true);
  res.type(data.mime).set('Cache-Control', 'private, no-store').send(data.bytes);
};
/** Ảnh hồ sơ công khai của HLV đang hoạt động. */
export const coachAvatar = async (req, res) => {
  const data = await avatar.getAvatar(req.validated.params.id);
  res.type(data.mime).set('Cache-Control', 'private, no-store').send(data.bytes);
};

/** Bộ môn trong danh mục HLV đang hoạt động. */
export const coachSubjects = async (_req, res) =>
  sendSuccess(res, { data: await directory.listCoachSubjects() });
