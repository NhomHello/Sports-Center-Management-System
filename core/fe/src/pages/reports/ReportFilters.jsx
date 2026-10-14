import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { Button, Card, DatePicker, Form, Select } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { DATE_FORMATS } from '@/constants';
import { listMembers } from '@/services/member.service';
import { listMembershipPlans } from '@/services/membershipPlan.service';

/** Lọc theo tên từ API có quyền; chỉ gửi ngày và ID đã chọn khi người dùng áp dụng. */
export function ReportFilters({ today, onApply }) {
  const { can } = usePermission();
  const [memberSearch, setMemberSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const members = useQuery({
    queryKey: ['report-member-options', memberSearch],
    queryFn: () => listMembers({ search: memberSearch }),
    enabled: can(P.MEMBER_READ),
  });
  const plans = useQuery({
    queryKey: ['report-plan-options', planSearch],
    queryFn: () => listMembershipPlans({ search: planSearch }),
    enabled: can(P.MEMBERSHIP_PLAN_READ),
  });
  return (
    <Card>
      <Form
        layout="inline"
        initialValues={{ range: [today.startOf('month'), today] }}
        onFinish={({ range, ...values }) =>
          onApply({
            ...values,
            from: range[0].format('YYYY-MM-DD'),
            to: range[1].format('YYYY-MM-DD'),
          })
        }
      >
        <Form.Item name="range" label="Khoảng ngày" rules={[{ required: true }]}>
          <DatePicker.RangePicker format={DATE_FORMATS.DATE} />
        </Form.Item>
        {can(P.MEMBERSHIP_PLAN_READ) && (
          <Form.Item name="planId" label="Gói tập">
            <Select
              allowClear
              style={{ width: 200 }}
              showSearch={{ filterOption: false, onSearch: setPlanSearch }}
              loading={plans.isFetching}
              options={(plans.data?.data || []).map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
        )}
        {can(P.MEMBER_READ) && (
          <Form.Item name="memberId" label="Hội viên">
            <Select
              allowClear
              style={{ width: 200 }}
              showSearch={{ filterOption: false, onSearch: setMemberSearch }}
              loading={members.isFetching}
              options={(members.data?.data || []).map((m) => ({
                value: m.id,
                label: `${m.fullName} · ${m.phone || m.email}`,
              }))}
            />
          </Form.Item>
        )}
        <Button htmlType="submit" type="primary">
          Áp dụng
        </Button>
      </Form>
    </Card>
  );
}
