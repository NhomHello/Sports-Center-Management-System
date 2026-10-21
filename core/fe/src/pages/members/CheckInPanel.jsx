import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Select, Space } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listMembers } from '@/services/member.service';
import { listRoomTypes } from '@/services/schedule.service';
import { checkIn } from '@/services/sprint3.service';
import { formatDateTime } from '@/utils/format';

/** Check-in không tự kích hoạt gói; khung giờ / khu vực của gói và cảnh báo do backend kiểm tra. */
export function CheckInPanel() {
  const { can } = usePermission();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState(null);
  const [areaId, setAreaId] = useState(null);
  const enabled = can(PERMISSIONS.ATTENDANCE_CHECK_IN);
  const query = useQuery({
    queryKey: ['checkin-members', search],
    queryFn: () => listMembers({ search }),
    enabled,
  });
  const areas = useQuery({ queryKey: ['room-types'], queryFn: listRoomTypes, enabled });
  const mutation = useMutation({
    mutationFn: () => checkIn(memberId, areaId),
    onError: (error) => message.error(error.message),
  });
  if (!enabled) return null;
  return (
    <Card title="Check-in tại quầy">
      <Space wrap>
        <Select
          aria-label="Hội viên check-in"
          placeholder="Tìm theo tên hoặc số điện thoại"
          showSearch
          filterOption={false}
          onSearch={setSearch}
          onChange={(id) => {
            setMemberId(id);
            mutation.reset();
          }}
          loading={query.isFetching}
          options={(query.data?.data ?? []).map((m) => ({
            value: m.id,
            label: `${m.fullName} · ${m.phone ?? ''}`,
          }))}
        />
        <Select
          aria-label="Khu tự tập"
          placeholder="Khu vực (tuỳ chọn)"
          allowClear
          style={{ minWidth: 180 }}
          value={areaId}
          onChange={(id) => {
            setAreaId(id ?? null);
            mutation.reset();
          }}
          options={(areas.data?.data ?? [])
            .filter((type) => type.isActive && type.isSelfTrainingArea)
            .map((type) => ({ value: type.id, label: type.name }))}
        />
        <Button
          type="primary"
          disabled={!memberId}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Xác nhận đến trung tâm
        </Button>
      </Space>
      {query.isError && <Alert type="error" title={query.error.message} />}
      {mutation.isSuccess && (
        <Alert
          showIcon
          type={mutation.data.data.warning ? 'warning' : 'success'}
          title={mutation.data.data.warning || 'Đã ghi nhận check-in'}
          description={formatDateTime(mutation.data.data.createdAt)}
        />
      )}
    </Card>
  );
}
