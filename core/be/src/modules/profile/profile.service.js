import { SETTING_KEYS as K } from '@scms/shared';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { writeScheduleAudit } from '../../common/utils/schedule-transaction.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { PROFILE_LIMITS } from '../../constants/sprint4.js';
import { getValue } from '../setting/setting.service.js';
import { coachProfileView, memberProfileView } from './profile.mapper.js';
const user = async (id) => {
  const item = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!item) throw ApiError.notFound('Không tìm thấy hồ sơ');
  return item;
};
/** Lưu hồ sơ và audit cùng transaction; audit chỉ lưu tên trường để không phát tán sức khoẻ. */
export const saveProfile = (model, userId, data, actor) =>
  prisma.$transaction(async (db) => {
    const result = await db[model].upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: model,
      entityId: userId,
      meta: { fields: Object.keys(data) },
    });
    return result;
  });
/** Email công khai mặc định bằng email hiện tại nhưng không tự cập nhật khi đổi email đăng nhập. */
export const ownCoach = async (id) => {
  const [account, p, bioMaxLength] = await Promise.all([
    user(id),
    prisma.coachProfile.findUnique({ where: { userId: id } }),
    getValue(K.COACH_BIO_MAX_LENGTH),
  ]);
  return {
    ...coachProfileView(p, account.email),
    bioMaxLength,
    avatarMaxBytes: PROFILE_LIMITS.AVATAR_BYTES,
  };
};
/** BR-S4-01: kiểm tra độ dài từ cấu hình trước ghi dữ liệu. */
export const updateCoach = async (data, actor) => {
  const max = await getValue(K.COACH_BIO_MAX_LENGTH);
  if (data.bio?.length > max)
    throw ApiError.badRequest(`Giới thiệu tối đa ${max} ký tự`, [
      { field: 'bio', message: `Tối đa ${max} ký tự` },
    ]);
  const account = await user(actor.id);
  const old = await prisma.coachProfile.findUnique({ where: { userId: actor.id } });
  await saveProfile(
    'coachProfile',
    actor.id,
    { ...(!old && { publicEmail: account.email }), ...data },
    actor,
  );
  return ownCoach(actor.id);
};
/** Hồ sơ riêng, có thể chưa được nhập. */
export const ownMember = async (id) => {
  await user(id);
  return memberProfileView(await prisma.memberProfile.findUnique({ where: { userId: id } }));
};
/** Nhân viên dùng cùng validation; userId do route/identity server quyết định. */
export const updateMember = async (id, data, actor) => {
  await user(id);
  const parsed = {
    ...data,
    ...('birthDate' in data && {
      birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00Z`) : null,
    }),
  };
  return memberProfileView(await saveProfile('memberProfile', id, parsed, actor));
};
