import { Enums, prisma } from '../../config/db.js';
import { CLASS_LIMITS } from '../../constants/index.js';

/**
 * Chay cac thao tac lien quan lich trong cung mot transaction.
 * Serializable giup han che race condition khi kiem tra va tao lich.
 *
 * @param {(db: import('@prisma/client').Prisma.TransactionClient) => Promise<unknown>} work
 */
export const withScheduleTransaction = (work) =>
  prisma.$transaction((db) => work(db), {
    isolationLevel: Enums.TransactionIsolationLevel.Serializable,
    timeout: CLASS_LIMITS.TX_TIMEOUT_MS,
    maxWait: CLASS_LIMITS.TX_MAX_WAIT_MS,
  });

/**
 * Ghi audit trong cung transaction voi thao tac nghiep vu.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} db
 * @param {{ id?: number } | undefined} actor
 * @param {{ action: string, entity: string, entityId: number|string, meta?: object }} entry
 */
export const writeScheduleAudit = (db, actor, entry) =>
  db.auditLog.create({
    data: {
      userId: actor?.id ?? null,
      ...entry,
      entityId: String(entry.entityId),
    },
  });
