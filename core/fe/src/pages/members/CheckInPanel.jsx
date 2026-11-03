import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Select, Space } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listMembers } from '@/services/member.service';
import { checkIn } from '@/services/sprint3.service';
/** Tiếp nhận tại quầy, không tạo quyền học hoặc yêu cầu mua gói tự tập. */
export function CheckInPanel() {
  const { can } = usePermission();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState(null);
  const query = useQuery({
    queryKey: ['checkin-course-members', search],
    queryFn: () => listMembers({ search }),
    enabled: can(P.ATTENDANCE_CHECK_IN),
  });
  const save = useMutation({
    mutationFn: () => checkIn(memberId),
    onSuccess: ({ data }) => message.success(data.warning || 'Đã ghi nhận check-in'),
  });
  if (!can(P.ATTENDANCE_CHECK_IN)) return null;
  return (
    <Card title="Check-in hội viên">
      <Space wrap>
        <Select
          aria-label="Hội viên check-in"
          showSearch={{ filterOption: false, onSearch: setSearch }}
          style={{ width: 300, maxWidth: '100%' }}
          onChange={setMemberId}
          loading={query.isFetching}
          placeholder="Tìm hội viên theo tên, SĐT hoặc email"
          options={(query.data?.data ?? []).map((m) => ({
            value: m.id,
            label: `${m.fullName} · ${m.phone || m.email || ''}`,
          }))}
        />
        <Button
          type="primary"
          disabled={!memberId}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          Xác nhận check-in
        </Button>
        {save.isError && <Alert type="error" title={save.error.message} />}
      </Space>
    </Card>
  );
}
