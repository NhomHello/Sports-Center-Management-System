import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Select, Space } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listMembershipPlans } from '@/services/membershipPlan.service';
import { formatCurrency } from '@/utils/format';

/** BR-PAY-17: không tự cộng ngày, bắt buộc lưu ý kiến hội viên trước quyết định. */
export function CaseExcessForm({ item, pending, onAction }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const plans = useQuery({
    queryKey: ['reconcile-plans'],
    queryFn: () => listMembershipPlans({ isActive: true }),
    enabled: can(PERMISSIONS.MEMBERSHIP_PLAN_READ),
  });
  const contacted = item.contacts.length > 0;
  const amount = item.excessAmount ?? item.amount;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Alert
        showIcon
        type="warning"
        title={`Khoản cần xử lý: ${formatCurrency(amount)}`}
        description="Ghi ý kiến hội viên vào nhật ký liên hệ. Chọn hoàn phần tiền này hoặc dùng gia hạn khi hội viên đồng ý. Hoàn phần thừa giữ nguyên trạng thái hóa đơn."
      />
      <Form
        form={form}
        layout="vertical"
        disabled={pending || !contacted}
        onFinish={(data) => onAction({ action: 'renew', data })}
      >
        <Form.Item
          name="planId"
          label="Gói gia hạn được hội viên đồng ý"
          rules={[{ required: true, message: 'Chọn gói gia hạn' }]}
        >
          <Select
            loading={plans.isFetching}
            options={(plans.data?.data ?? []).map((p) => ({
              value: p.id,
              label: `${p.name} · ${formatCurrency(p.price)}`,
            }))}
          />
        </Form.Item>
        <Button htmlType="submit" loading={pending}>
          Dùng khoản tiền để gia hạn
        </Button>
      </Form>
      {plans.isError && <Alert type="error" title={plans.error.message} />}
      {can(PERMISSIONS.PAYMENT_REFUND) && (
        <Form
          layout="vertical"
          disabled={pending || !contacted}
          onFinish={(data) => onAction({ action: 'refund', data })}
        >
          <Form.Item
            name="reason"
            label="Lý do hoàn tiền"
            rules={[{ required: true, whitespace: true, message: 'Nhập lý do hoàn tiền' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Button htmlType="submit" loading={pending}>
            Tạo yêu cầu hoàn tiền
          </Button>
        </Form>
      )}
      {!contacted && <Alert type="info" title="Cần ghi ít nhất một lần liên hệ trước khi xử lý." />}
    </Space>
  );
}
