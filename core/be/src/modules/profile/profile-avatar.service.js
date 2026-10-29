import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';
import { PROFILE_LIMITS as L } from '../../constants/sprint4.js';
import { saveProfile } from './profile.service.js';
import { loadPublicCoach } from './coach-directory.service.js';
const PNG_SIGNATURE = '89504e470d0a1a0a';
const JPEG_SIGNATURE = 'ffd8ff';
const PNG_BYTES = 8;
const JPEG_BYTES = 3;
const JPEG_END_BYTES = 2;
/** Kiểm tra chữ ký thay vì tin filename/Content-Type; SVG và dữ liệu giả bị từ chối. */
export const updateAvatar = async (body, mime, actor) => {
  if (!Buffer.isBuffer(body) || !body.length || body.length > L.AVATAR_BYTES)
    throw ApiError.badRequest('Ảnh phải là JPG/PNG, tối đa 2 MB');
  const png = body.subarray(0, PNG_BYTES).toString('hex') === PNG_SIGNATURE;
  const jpeg =
    body.subarray(0, JPEG_BYTES).toString('hex') === JPEG_SIGNATURE &&
    body.subarray(-JPEG_END_BYTES).toString('hex') === 'ffd9';
  if (!((mime === 'image/png' && png) || (mime === 'image/jpeg' && jpeg)))
    throw ApiError.badRequest('Nội dung ảnh không đúng định dạng JPG/PNG');
  const account = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { email: true },
  });
  const old = await prisma.coachProfile.findUnique({
    where: { userId: actor.id },
    select: { userId: true },
  });
  await saveProfile(
    'coachProfile',
    actor.id,
    { ...(!old && { publicEmail: account.email }), avatarData: body, avatarMime: mime },
    actor,
  );
  return { hasAvatar: true };
};
/** Ảnh dùng cùng phạm vi công khai hoặc chính chủ; không trả blob trong danh sách. */
export const getAvatar = async (id, own = false) => {
  if (!own) await loadPublicCoach(id);
  const item = await prisma.coachProfile.findUnique({
    where: { userId: id },
    select: { avatarMime: true, avatarData: true },
  });
  if (!item?.avatarData) throw ApiError.notFound('Chưa có ảnh đại diện');
  return { mime: item.avatarMime, bytes: Buffer.from(item.avatarData) };
};
