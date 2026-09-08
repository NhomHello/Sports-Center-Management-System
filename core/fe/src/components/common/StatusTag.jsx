import { Tag } from 'antd';

/**
 * Tag trang thai tu bang meta { [value]: { color, label } } (khai bao o constants).
 *   <StatusTag value={user.status} meta={USER_STATUS_META} />
 * @param {{ value: string, meta: Record<string, { color: string, label: string }> }} props
 */
export function StatusTag({ value, meta }) {
  const item = meta[value];
  if (!item) return <Tag>{value}</Tag>;
  return <Tag color={item.color}>{item.label}</Tag>;
}
