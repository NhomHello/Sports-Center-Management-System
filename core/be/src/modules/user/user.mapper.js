/**
 * Chuyen record Prisma -> object tra ve FE. KHONG BAO GIO tra passwordHash ra ngoai.
 */

/** Prisma include dung chung khi can user kem role */
export const USER_WITH_ROLE = {
  role: { select: { id: true, code: true, name: true } },
};

/**
 * @param {object} user record User (include role)
 * @returns {object} user an toan de tra ve
 */
export const toPublicUser = ({ passwordHash: _passwordHash, ...user }) => user;
