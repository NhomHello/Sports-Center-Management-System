import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { Button, Card, Form, Select } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { ReportTimeFields } from './ReportTimeFields';
import { reportQuery } from '@/utils/reportFilters';
import { listMembers } from '@/services/member.service';
import { listClasses } from '@/services/schedule.service';

/** Lọc theo tên từ API có quyền; chỉ gửi ngày và ID đã chọn khi người dùng áp dụng. */
export function ReportFilters({ today, onApply }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const [memberSearch, setMemberSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const members = useQuery({
    queryKey: ['report-member-options', memberSearch],
    queryFn: () => listMembers({ search: memberSearch }),
    enabled: can(P.MEMBER_READ),
  });
  const plans = useQuery({
    queryKey: ['report-plan-options', planSearch],
    queryFn: () =>
      listClasses({ search: planSearch, scope: can(P.CLASS_READ_ALL) ? 'management' : 'open' }),
    enabled: can(P.CLASS_READ),
  });
  return (
    <Card>
      <Form
        form={form}
        layout="inline"
        className="scms-report-filter-form"
        initialValues={{ range: [today.startOf('month'), today], groupBy: 'day', compare: true }}
        onFinish={(values) => onApply(reportQuery(values))}
      >
        <ReportTimeFields form={form} today={today} />
        {can(P.CLASS_READ) && (
          <Form.Item name="classId" label="Khóa học">
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
