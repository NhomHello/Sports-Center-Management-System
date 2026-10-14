import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Select } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listMembers } from '@/services/member.service';
import { listInvoices } from '@/services/payment.service';
import { listMembershipPlans } from '@/services/membershipPlan.service';
import { INVOICE_STATUS } from '@/constants';

/** Gán sai mã vào hóa đơn còn chờ/thất bại hoặc tạo hóa đơn cho gói đang bán. */
export function CaseMapForm({ pending, onAction }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const memberId = Form.useWatch('memberId', form);
  const members = useQuery({
    queryKey: ['reconcile-members', search],
    queryFn: () => listMembers({ search }),
    enabled: can(PERMISSIONS.MEMBER_READ),
  });
  const invoices = useQuery({
    queryKey: ['reconcile-invoices', memberId],
    queryFn: () => listInvoices({ memberId }),
    enabled: Boolean(memberId) && can(PERMISSIONS.INVOICE_READ_ALL),
  });
  const plans = useQuery({
    queryKey: ['reconcile-plans'],
    queryFn: () => listMembershipPlans({ isActive: true }),
    enabled: can(PERMISSIONS.MEMBERSHIP_PLAN_READ),
  });
  const errors = [members, invoices, plans].filter((q) => q.isError);
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={pending}
      onFinish={({ invoiceId, planId }) =>
        onAction({ action: 'map', data: invoiceId ? { invoiceId } : { memberId, planId } })
      }
    >
      <Alert
        showIcon
        type="info"
        title="Chọn hội viên rồi chọn hóa đơn, hoặc gói để tạo hóa đơn mới. Server đối chiếu tiền trước khi kích hoạt."
      />
      {errors.map((q) => (
        <Alert key={q.error.message} type="error" title={q.error.message} />
      ))}
      <Form.Item
        name="memberId"
        label="Hội viên"
        rules={[{ required: true, message: 'Chọn hội viên' }]}
      >
        <Select
          showSearch
          filterOption={false}
          onSearch={setSearch}
          onChange={() => form.resetFields(['invoiceId', 'planId'])}
          loading={members.isFetching}
          options={(members.data?.data ?? []).map((m) => ({
            value: m.id,
            label: `${m.fullName} · ${m.phone ?? ''}`,
          }))}
        />
      </Form.Item>
      <Form.Item name="invoiceId" label="Hóa đơn có sẵn">
        <Select
          allowClear
          loading={invoices.isFetching}
          options={(invoices.data?.data ?? [])
            .filter((i) => [INVOICE_STATUS.PENDING, INVOICE_STATUS.FAILED].includes(i.status))
            .map((i) => ({ value: i.id, label: i.code }))}
        />
      </Form.Item>
      <Form.Item name="planId" label="Hoặc gói đang bán">
        <Select
          allowClear
          options={(plans.data?.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
        />
      </Form.Item>
      <Button htmlType="submit" type="primary" disabled={!memberId} loading={pending}>
        Gán giao dịch
      </Button>
    </Form>
  );
}
