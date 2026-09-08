/**
 * Sinh items cho antd Menu tu route registry, chi giu route user co quyen.
 * Ham thuan (khong React) de test duoc.
 * @param {{ path: string, permission?: string|string[], menu?: { label: string, icon?: unknown, group?: string } }[]} routes
 * @param {(permission: string|string[]|undefined) => boolean} can
 */
export const buildMenuItems = (routes, can) => {
  const items = [];
  const groups = new Map();

  for (const route of routes) {
    if (!route.menu || !can(route.permission)) continue;
    const item = { key: route.path, icon: route.menu.icon, label: route.menu.label };
    if (!route.menu.group) {
      items.push(item);
      continue;
    }
    if (!groups.has(route.menu.group)) {
      const group = { key: `group:${route.menu.group}`, label: route.menu.group, children: [] };
      groups.set(route.menu.group, group);
      items.push(group);
    }
    groups.get(route.menu.group).children.push(item);
  }
  return items;
};
