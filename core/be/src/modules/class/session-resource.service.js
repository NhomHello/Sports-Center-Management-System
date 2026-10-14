import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { overlaps } from './class-schedule.service.js';

/** Kiểm tra phòng/HLV theo từng buổi, bao gồm các buổi khác trong cùng lớp. */
export const assertSessionResources = async (db, slots, resources, exclude = {}) => {
  const first = new Date(Math.min(...slots.map((s) => s.startAt.getTime())));
  const last = new Date(Math.max(...slots.map((s) => s.endAt.getTime())));
  const candidates = await db.classSession.findMany({
    where: {
      status: Enums.SessionStatus.SCHEDULED,
      startAt: { lt: last },
      endAt: { gt: first },
      ...(exclude.classId && { classId: { not: exclude.classId } }),
      ...(exclude.ids && { id: { notIn: exclude.ids } }),
      OR: [
        { coachId: resources.coachId },
        { roomId: resources.roomId },
        { coachId: null, gymClass: { coachId: resources.coachId } },
        { roomId: null, gymClass: { roomId: resources.roomId } },
      ],
      gymClass: { status: { not: Enums.ClassStatus.CANCELLED } },
    },
  });
  if (slots.some((s) => candidates.some((old) => overlaps(s, old))))
    throw ApiError.conflict('Phòng hoặc HLV bị trùng lịch');
  const maintenance = await db.roomMaintenance.findMany({
    where: { roomId: resources.roomId, startAt: { lt: last }, endAt: { gt: first } },
  });
  if (slots.some((s) => maintenance.some((m) => overlaps(s, m))))
    throw ApiError.conflict('Phòng đang bảo trì trong khoảng buổi học');
};
