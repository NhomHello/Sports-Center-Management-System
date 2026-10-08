import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Card, Input, Select, Space, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import * as memberService from '@/services/member.service';
import * as scheduleService from '@/services/schedule.service';
import { ClassListPanel } from './ClassListPanel';
import { ClassBookingActions } from './ClassBookingActions';
import { QueryState } from './QueryState';

function MemberEnrollmentList({ memberId }) {
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'member', memberId],
    queryFn: () => scheduleService.getMemberEnrollments(memberId),
  });
  const items = query.data?.data || [];
  return (
    <QueryState query={query} isEmpty={!items.length}>
      <div className="scms-class-grid">
        {items.map((item) => (
          <Card key={item.id} title={item.name}>
            <ClassBookingActions item={item} memberId={memberId} />
          </Card>
        ))}
      </div>
    </QueryState>
  );
}

/** UC-CB-08 tái sử dụng tìm kiếm Sprint 1 trước thao tác đăng ký/huỷ hộ. */
export function StaffBookingPanel() {
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, 'booking-search', search],
    queryFn: () => memberService.listMembers({ search }),
    enabled: Boolean(search),
  });
  const members = query.data?.data || [];
  const actions = (item) => <ClassBookingActions item={item} memberId={memberId} />;
  return (
    <Space vertical className="scms-schedule-stack">
      <Input.Search
        placeholder="Email hoặc số điện thoại hội viên"
        allowClear
        onSearch={(value) => {
          setSearch(value.trim());
          setMemberId(null);
        }}
      />
      {search && (
        <QueryState query={query} isEmpty={!members.length}>
          <Select
            className="scms-member-select"
            value={memberId}
            placeholder="Chọn hội viên"
            onChange={setMemberId}
            options={members.map((member) => ({
              value: member.id,
              label: `${member.fullName} · ${member.email || member.phone}`,
            }))}
          />
        </QueryState>
      )}
      {memberId && (
        <>
          <Typography.Title level={5}>Các lớp đã đăng ký</Typography.Title>
          <MemberEnrollmentList memberId={memberId} />
          <Typography.Title level={5}>Đăng ký lớp mới</Typography.Title>
          <ClassListPanel key={memberId} memberId={memberId} renderActions={actions} />
        </>
      )}
    </Space>
  );
}
