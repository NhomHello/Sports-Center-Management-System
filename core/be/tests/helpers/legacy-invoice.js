import { createCounterOrder, createOnlineOrder } from '../../src/modules/membership/membership-invoice.service.js';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';

/** Fixture của hoá đơn gói tồn tại trước chuyển đổi; không mở lại API bán gói đã ngừng. */
export const legacyOrder = async (memberId, planId, channel = 'ONLINE') => {
  const actor = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  const create = channel === 'COUNTER' ? createCounterOrder : createOnlineOrder;
  return create({ memberId, planId }, actor);
};
