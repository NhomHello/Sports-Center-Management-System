import { Alert, Button, Form, Input } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { unblockMember } from '@/services/sprint3.service';
import { QUERY_KEYS } from '@/constants';
import { formatDateTime } from '@/utils/format';

/** Gỡ chặn theo quyền, luôn lưu lý do và không ảnh hưởng đăng ký đã có. */
export function BookingBlockPanel({ member, onUpdated }) {
  const { can } = usePermission();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ reason }) => unblockMember(member.id, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      client.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
      onUpdated({ ...member, bookingBlockedUntil: null });
    },
  });
  if (!member.bookingBlockedUntil || new Date(member.bookingBlockedUntil) <= new Date())
    return null;
  return (
    <>
      <Alert
        type="warning"
        showIcon
        title={`Tạm chặn do vắng nhiều buổi. Được đăng ký lại từ ${formatDateTime(member.bookingBlockedUntil)}`}
      />
      {can(PERMISSIONS.CLASS_UNBLOCK) && (
        <Form layout="vertical" disabled={mutation.isPending} onFinish={mutation.mutate}>
          <Form.Item
            name="reason"
            label="Lý do gỡ chặn"
            rules={[{ required: true, whitespace: true, message: 'Nhập lý do gỡ chặn' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Button htmlType="submit" loading={mutation.isPending}>
            Gỡ chặn đăng ký
          </Button>
        </Form>
      )}
      {mutation.isError && <Alert type="error" title={mutation.error.message} />}
    </>
  );
}
