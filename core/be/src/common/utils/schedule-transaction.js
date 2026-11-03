import { setTimeout as pause } from 'node:timers/promises';
import { Enums, prisma } from '../../config/db.js';
import { CLASS_LIMITS, PRISMA_ERROR, TRANSACTION_RETRY } from '../../constants/index.js';
import { ApiError } from '../errors/api-error.js';

/** Cùng thứ tự khoá schedule → invoice cho checkout, webhook, hết hạn và huỷ giữ chỗ. */
export const lockSchedule = (db) =>
  db.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;

/** Chỉ retry transaction đã rollback vì xung đột; không retry lỗi nghiệp vụ/ngoại lệ tuỳ ý. */
export const withScheduleTransaction = async (work) => {
  for (let attempt = 0; attempt < TRANSACTION_RETRY.MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (db) => {
          await lockSchedule(db);
          return work(db);
        },
        {
          isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted,
          timeout: CLASS_LIMITS.TX_TIMEOUT_MS,
          maxWait: CLASS_LIMITS.TX_MAX_WAIT_MS,
        },
      );
    } catch (error) {
      if (error.code !== PRISMA_ERROR.WRITE_CONFLICT) throw error;
      if (attempt + 1 === TRANSACTION_RETRY.MAX_ATTEMPTS)
        throw ApiError.conflict('Có nhiều người đăng ký cùng lúc, vui lòng thử lại');
      await pause(TRANSACTION_RETRY.DELAY_MS * (attempt + 1));
    }
  }
};

/** Audit nằm cùng transaction để lỗi phải rollback toàn thao tác. */
export const writeScheduleAudit = (db, actor, entry) =>
  db.auditLog.create({ data: { userId: actor.id, ...entry, entityId: String(entry.entityId) } });
