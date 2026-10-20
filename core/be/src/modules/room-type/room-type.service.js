import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';

const ENTITY = 'RoomType';
export const ROOM_TYPE_INCLUDE = {
  subjects: { select: { subject: { select: { id: true, name: true } } } },
  _count: { select: { rooms: true } },
};

const toView = ({ subjects, _count, ...item }) => ({
  ...item,
  subjects: subjects.map((row) => row.subject),
  roomCount: _count.rooms,
});

/** Lớp còn buổi tương lai trong phòng thuộc loại này nhưng bộ môn không còn được hỗ trợ. */
const assertSubjectsStillServed = async (db, id, subjectIds) => {
  const orphan = await db.gymClass.findFirst({
    where: {
      room: { roomTypeId: id },
      subjectId: { notIn: subjectIds },
      status: { not: Enums.ClassStatus.CANCELLED },
      sessions: { some: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: new Date() } } },
    },
    select: { name: true, subject: { select: { name: true } } },
  });
  if (orphan)
    throw ApiError.businessRule(
      `Lớp "${orphan.name}" (${orphan.subject.name}) đang học trong loại phòng này; chuyển lớp trước khi bỏ bộ môn`,
    );
};

const assertNotInUse = async (db, id) => {
  const rooms = await db.room.count({ where: { roomTypeId: id, isActive: true } });
  if (rooms) throw ApiError.businessRule('Còn phòng đang hoạt động thuộc loại này');
};

/** Danh sách loại phòng kèm bộ môn và số phòng. */
export const list = async () =>
  (
    await prisma.roomType.findMany({
      include: ROOM_TYPE_INCLUDE,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    })
  ).map(toView);

/** Kiểm tra trước khi sửa: tồn tại, không bỏ bộ môn đang dùng, không ngừng khi còn phòng. */
const assertUpdatable = async (db, id, { subjectIds, isActive }) => {
  if (!(await db.roomType.findUnique({ where: { id } })))
    throw ApiError.notFound('Không tìm thấy loại phòng');
  if (subjectIds) await assertSubjectsStillServed(db, id, subjectIds);
  if (isActive === false) await assertNotInUse(db, id);
};

const write = (actor, { id, data }) =>
  withScheduleTransaction(async (db) => {
    const { subjectIds, ...fields } = data;
    if (id) await assertUpdatable(db, id, { subjectIds, isActive: fields.isActive });
    const subjects = subjectIds && {
      ...(id && { deleteMany: {} }),
      create: subjectIds.map((subjectId) => ({ subjectId })),
    };
    const item = id
      ? await db.roomType.update({
          where: { id },
          data: { ...fields, subjects },
          include: ROOM_TYPE_INCLUDE,
        })
      : await db.roomType.create({ data: { ...fields, subjects }, include: ROOM_TYPE_INCLUDE });
    await writeScheduleAudit(db, actor, {
      action: id ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.CREATE,
      entity: ENTITY,
      entityId: item.id,
      meta: data,
    });
    return toView(item);
  });

/** Tạo loại phòng với các bộ môn được dạy trong loại phòng này. */
export const create = (data, actor) => write(actor, { data });

/** Sửa loại phòng; không bỏ bộ môn đang có lớp, không ngừng khi còn phòng hoạt động. */
export const update = (id, data, actor) => write(actor, { id, data });
