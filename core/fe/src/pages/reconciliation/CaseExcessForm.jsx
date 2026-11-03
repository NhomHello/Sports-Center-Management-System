import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Select, Space } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listClasses } from '@/services/schedule.service';
import { formatCurrency } from '@/utils/format';

/** BR-PAY-17/18: dùng khoản thừa/chuyển lặp để đăng ký khóa học khi hội viên đồng ý (đã ghi liên hệ). */
export function CaseExcessForm({ item, pending, onAction }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const plans = useQuery({
    queryKey: ['reconcile-plans'],
    queryFn: () => listClasses({ scope: 'open', paidOnly: true }),
    enabled: can(PERMISSIONS.CLASS_READ),
  });
  const contacted = item.contacts.length > 0;
  const amount = item.excessAmount ?? item.amount;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Alert
        showIcon
        type="warning"
        title={`Khoản cần xử lý: ${formatCurrency(amount)}`}
        description="Ghi ý kiến hội viên vào nhật ký liên hệ, rồi chọn dùng khoản này để đăng ký khóa học hoặc hoàn tiền bên dưới."
      />
      <Form
        form={form}
        layout="vertical"
        disabled={pending || !contacted}
        onFinish={(data) => onAction({ action: 'renew', data })}
      >
        <Form.Item
          name="classId"
          label="Khóa học được hội viên đồng ý"
          rules={[{ required: true, message: 'Chọn khóa học' }]}
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
          Dùng khoản tiền để đăng ký khóa học
        </Button>
      </Form>
      {plans.isError && <Alert type="error" title={plans.error.message} />}
    </Space>
  );
}
