import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Select, Typography } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';
import { QUERY_KEYS } from '@/constants';
import * as memberService from '@/services/member.service';
import * as scheduleService from '@/services/schedule.service';
import { ClassListPanel } from './ClassListPanel';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { QueryState } from './QueryState';

function MemberEnrollmentList({ memberId }) {
  const [detailId, setDetailId] = useState(null);
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'member', memberId],
    queryFn: () => scheduleService.getMemberEnrollments(memberId),
  });
  const items = query.data?.data || [];
  return (
    <>
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
    <div className="scms-staff-booking">
      <section className="scms-staff-member-search">
        <h3>Chọn hội viên để hỗ trợ</h3>
        <p>Tìm bằng email hoặc số điện thoại, chọn hội viên rồi đăng ký hoặc huỷ lớp.</p>
        <SearchInput
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
              aria-label="Chọn hội viên"
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
      </section>
      {memberId && (
        <>
          <Typography.Title level={5}>Các lớp đã đăng ký</Typography.Title>
          <MemberEnrollmentList memberId={memberId} />
          <Typography.Title level={5}>Đăng ký lớp mới</Typography.Title>
          <ClassListPanel key={memberId} memberId={memberId} renderActions={actions} />
        </>
      )}
    </div>
  );
}
