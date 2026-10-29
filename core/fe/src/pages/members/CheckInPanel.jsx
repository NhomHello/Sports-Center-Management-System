import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Button, Card, Select, Space } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listMembers } from '@/services/member.service';
import { listRoomTypes } from '@/services/schedule.service';
import { checkIn } from '@/services/sprint3.service';
import { formatDateTime } from '@/utils/format';

const memberOptions = (members) =>
  members.map((member) => ({
    value: member.id,
    label: `${member.fullName} · ${member.phone ?? ''}`,
  }));

const areaOptions = (areas) =>
  areas
    .filter((area) => area.isActive && area.isSelfTrainingArea)
    .map((area) => ({ value: area.id, label: area.name }));

function CheckInFields({ query, areas, setSearch, setMemberId, areaId, setAreaId }) {
  return (
    <Space wrap>
      <Select
        aria-label="Hội viên check-in"
        placeholder="Tìm theo tên hoặc số điện thoại"
        showSearch
        filterOption={false}
        onSearch={setSearch}
        onChange={setMemberId}
        loading={query.isFetching}
        options={memberOptions(query.data?.data ?? [])}
      />
      <Select
        aria-label="Khu tự tập"
        placeholder="Khu vực (tuỳ chọn)"
        allowClear
        style={{ minWidth: 180 }}
        value={areaId}
        onChange={(id) => setAreaId(id ?? null)}
        options={areaOptions(areas.data?.data ?? [])}
      />
    </Space>
  );
}

function CheckInFeedback({ mutation, query }) {
  return (
    <>
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          title="Không thể check-in"
          description={mutation.error.message}
        />
      )}
      {query.isError && <Alert type="error" title={query.error.message} />}
      {mutation.isSuccess && (
        <Alert
          showIcon
          type={mutation.data.data.warning ? 'warning' : 'success'}
          title={mutation.data.data.warning || 'Đã ghi nhận check-in'}
          description={formatDateTime(mutation.data.data.createdAt)}
        />
      )}
    </>
  );
}

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
      <CheckInFields
        query={query}
        areas={areas}
        setSearch={setSearch}
        memberId={memberId}
        setMemberId={(id) => {
          setMemberId(id);
          mutation.reset();
        }}
        areaId={areaId}
        setAreaId={(id) => {
          setAreaId(id);
          mutation.reset();
        }}
      />
      <Button
        type="primary"
        disabled={!memberId}
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
        style={{ marginTop: 12 }}
      >
        Xác nhận đến trung tâm
      </Button>
      <CheckInFeedback mutation={mutation} query={query} />
    </Card>
  );
}
