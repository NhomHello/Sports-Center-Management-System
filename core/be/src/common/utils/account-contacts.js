import { prisma } from '../../config/db.js';
import { ApiError } from '../errors/api-error.js';

const getContactConditions = ({ email, phone }) => [
  ...(email ? [{ email }] : []),
  ...(phone ? [{ phone: { in: [phone, phone.replace(/^0/, '+84')] } }] : []),
];

/** BR-1.1/1.10: báo lỗi đúng trường, bao gồm số +84 còn lưu từ phiên bản cũ. */
export const ensureUniqueContacts = async ({ email, phone }, excludeId, db = prisma) => {
  const contacts = getContactConditions({ email, phone });
  if (!contacts.length) return;
  const duplicate = await db.user.findFirst({
    where: { OR: contacts, ...(excludeId && { id: { not: excludeId } }) },
    select: { email: true, phone: true },
  });
  if (!duplicate) return;
  const field = email && duplicate.email?.toLowerCase() === email ? 'email' : 'phone';
  const message = field === 'email' ? 'Email đã được sử dụng' : 'Số điện thoại đã được sử dụng';
  throw ApiError.conflict(message, [{ field, message }]);
};
