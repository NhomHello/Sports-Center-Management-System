import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';

/**
 * @param {string} plain
 * @returns {Promise<string>}
 */
export const hashPassword = (plain) => bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);

/**
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
