import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Select, Typography, Tabs, Input, Alert, Space } from 'antd';

import { QUERY_KEYS } from '@/constants';
import * as memberService from '@/services/member.service';
import * as scheduleService from '@/services/schedule.service';
import { ClassListPanel } from './ClassListPanel';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { QueryState } from './QueryState';

function MemberEnrollmentList({ memberId }) {
  const [filter, setFilter] = useState('');
  const [detailId, setDetailId] = useState(null);
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'member', memberId],
    queryFn: () => scheduleService.getMemberEnrollments(memberId),
  });
  const items = (query.data?.data || []).filter((i) =>
    i.name.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <Input.Search
        allowClear
        placeholder="Lọc lớp đã đăng ký"
        onChange={(e) => setFilter(e.target.value)}
      />
      <QueryState query={query} isEmpty={!items.length}>
        <div className="scms-class-grid">
          {items.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              can={() => false}
              onDetail={() => setDetailId(item.id)}
            >
              <ClassBookingActions item={item} memberId={memberId} />
            </ClassCard>
          ))}
        </div>
      </QueryState>
      {detailId && (
        <ClassDetailDrawer
          id={detailId}
          memberId={memberId}
          onClose={() => setDetailId(null)}
          renderActions={(item) => <ClassBookingActions item={item} memberId={memberId} />}
        />
      )}
    </>
  );
}

/** UC-CB-08 tái sử dụng tìm kiếm Sprint 1 trước thao tác đăng ký/huỷ hộ. */
export function StaffBookingPanel() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, 'booking-search', search],
    queryFn: () => memberService.listMembers({ search }),
    enabled: Boolean(search),
  });
  const members = query.data?.data || [];
  const actions = (item) => <ClassBookingActions item={item} memberId={memberId} />;
  return (
    <div className="scms-staff-booking">
      <section className="scms-staff-member-search">
        <h3>Chọn hội viên để hỗ trợ</h3>
        <p>Gõ tên, email hoặc số điện thoại để chọn hội viên và hỗ trợ đăng ký lớp.</p>
        <Select
          showSearch={{ filterOption: false, onSearch: setInput }}
          allowClear
          className="scms-full-width"
          aria-label="Chọn hội viên"
          placeholder="Gõ tên, email hoặc số điện thoại"
          loading={query.isFetching}
          value={memberId}
          onChange={setMemberId}
          options={members.map((member) => ({
            value: member.id,
            label: `${member.fullName} · ${member.phone || member.email} · ${member.membership?.status || 'Chưa có gói'}`,
          }))}
        />
        {query.isError && <Alert type="error" title={query.error.message} />}
        {members.find((m) => m.id === memberId) && (
          <Space>
            <Typography.Text strong>
              {members.find((m) => m.id === memberId).fullName}
            </Typography.Text>
          </Space>
        )}
      </section>
      {memberId && (
        <Tabs
          items={[
            {
              key: 'enrolled',
              label: 'Đã đăng ký',
              children: <MemberEnrollmentList memberId={memberId} />,
            },
            {
              key: 'new',
              label: 'Đăng ký lớp mới',
              children: (
                <ClassListPanel key={memberId} memberId={memberId} renderActions={actions} />
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
