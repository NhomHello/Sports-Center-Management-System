import { ApiError } from '../../common/errors/api-error.js';
import { SETTING_DEFINITIONS, getSettingValidationError } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const cache = new Map();
const DEFINITIONS_BY_KEY = new Map(
  SETTING_DEFINITIONS.map((definition) => [definition.key, definition]),
);
const enrichSetting = (setting) => ({
  ...DEFINITIONS_BY_KEY.get(setting.key),
  ...setting,
  defaultValue: undefined,
});

/** Parser theo type; nem loi neu gia tri khong hop le. */
const PARSERS = {
  [Enums.SettingType.STRING]: (raw) => raw,
  [Enums.SettingType.NUMBER]: (raw) => {
    const num = Number(raw);
    if (raw.trim() === '' || Number.isNaN(num)) throw new Error('phải là số');
    return num;
  },
  [Enums.SettingType.BOOLEAN]: (raw) => {
    if (raw !== 'true' && raw !== 'false') throw new Error('phải là true/false');
    return raw === 'true';
  },
  [Enums.SettingType.JSON]: (raw) => JSON.parse(raw),
};

/**
 * Parse gia tri string theo type.
 * @param {{ key: string, type: string }} setting
 * @param {string} raw
 */
const parseValue = (setting, raw) => {
  const validationError = getSettingValidationError(enrichSetting(setting), raw);
  if (validationError)
    throw ApiError.badRequest(`${setting.label ?? setting.key}: ${validationError}`, [
      { field: setting.key, message: validationError },
    ]);
  try {
    return PARSERS[setting.type](raw);
  } catch (err) {
    throw ApiError.badRequest(`Giá trị của ${setting.key} ${err.message}`, { key: setting.key });
  }
};

/**
 * Doc gia tri setting (da parse dung type, co cache). DAY LA CACH DUY NHAT doc so nghiep vu.
 * Vi du: const hours = await getValue(SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE);
 * @param {string} key
 * @returns {Promise<unknown>}
 */
export const getValue = async (key) => {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) throw ApiError.notFound(`Chưa cấu hình ${key}, hãy chạy npm run db:seed`);

  const value = parseValue(setting, setting.value);
  cache.set(key, {
    value,
    expiresAt: Date.now() + env.SETTING_CACHE_TTL_SECONDS * TIME.MS_PER_SECOND,
  });
  return value;
};

/** Danh sach setting nhom theo group cho UI. */
export const listGrouped = async () => {
  const settings = await prisma.systemSetting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  });
  const groups = new Map();
  for (const setting of settings) {
    if (!groups.has(setting.group)) groups.set(setting.group, { group: setting.group, items: [] });
    groups.get(setting.group).items.push(enrichSetting(setting));
  }
  return [...groups.values()];
};

/**
 * Cap nhat nhieu setting. Validate tung gia tri theo type truoc khi ghi.
 * @param {{ key: string, value: string }[]} items
 * @param {{ id: number }} actor
 */
export const updateMany = async (items, actor) => {
  const keys = items.map((item) => item.key);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(settings.map((s) => [s.key, s]));

  for (const item of items) {
    const setting = byKey.get(item.key);
    if (!setting) throw ApiError.notFound(`Không tồn tại cấu hình ${item.key}`);
    parseValue(setting, item.value);
  }

  await prisma.$transaction(async (tx) => {
    for (const { key, value } of items)
      await tx.systemSetting.update({ where: { key }, data: { value } });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.SETTING,
        meta: { before: settings.map(({ key, value }) => ({ key, value })), after: items },
      },
    });
  });
  keys.forEach((key) => cache.delete(key));
  return listGrouped();
};
