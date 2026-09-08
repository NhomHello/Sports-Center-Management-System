import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';

/**
 * Ghi nhat ky thao tac quan trong. Khong await bat buoc (fire-and-forget), loi ghi log
 * khong lam hong request chinh.
 * @param {{ userId?: number|null, action: string, entity: string, entityId?: string|number|null, meta?: object, ip?: string }} entry
 * @returns {Promise<void>}
 */
export const recordAudit = async ({ userId = null, action, entity, entityId = null, meta, ip }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId === null ? null : String(entityId),
        meta,
        ip,
      },
    });
  } catch (err) {
    logger.error({ err, action, entity }, 'Ghi audit log that bai');
  }
};
