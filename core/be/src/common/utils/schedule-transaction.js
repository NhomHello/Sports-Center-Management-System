import { Enums, prisma } from '../../config/db.js';
import { CLASS_LIMITS } from '../../constants/index.js';

/** BR-2.2/2.3/2.4: một khoá chung bảo vệ cả sức chứa và xung đột liên lớp. */
export const withScheduleTransaction = (work) =>
  prisma.$transaction(
    async (db) => {
      await db.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;
      return work(db);
    },
    {
      isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted,
      timeout: CLASS_LIMITS.TX_TIMEOUT_MS,
      maxWait: CLASS_LIMITS.TX_MAX_WAIT_MS,
    },
  );

/** Audit nghiệp vụ nằm cùng transaction: thất bại phải rollback toàn thao tác. */
export const writeScheduleAudit = (db, actor, entry) =>
  db.auditLog.create({ data: { userId: actor.id, ...entry, entityId: String(entry.entityId) } });
