import { Alert, Button, Form, Input, Select, Timeline, Typography } from 'antd';
import { CONTACT_LABELS } from '@/constants/reconciliation';
import { formatDateTime } from '@/utils/format';

/** BR-PAY-19: nhật ký chỉ thêm, lưu ý kiến hội viên trước khi xử lý tiền thừa/chuyển lặp. */
export function CaseContacts({ item, active, pending, onAction }) {
  const [form] = Form.useForm();
  return (
    <>
      <Typography.Title level={5}>Nhật ký liên hệ hội viên</Typography.Title>
      <Timeline
        items={item.contacts.map((contact) => ({
          key: contact.id,
          content: (
            <>
              <strong>
                {CONTACT_LABELS[contact.channel]} · {formatDateTime(contact.createdAt)}
              </strong>
              <p>{contact.content}</p>
              <p>
                {contact.result} · {contact.actor?.fullName}
              </p>
            </>
          ),
        }))}
      />
      {!item.contacts.length && (
        <Alert
          type="info"
          showIcon
          title="Chưa ghi nhận liên hệ. Cần lưu ý kiến hội viên trước khi xử lý tiền thừa hoặc chuyển lặp."
        />
      )}
      {active && (
        <Form
          form={form}
          layout="vertical"
          disabled={pending}
          onFinish={async (data) => {
            await onAction({ action: 'contacts', data });
            form.resetFields();
          }}
        >
          <Form.Item
            name="channel"
            label="Kênh liên hệ"
            rules={[{ required: true, message: 'Chọn kênh liên hệ' }]}
          >
            <Select
              options={Object.entries(CONTACT_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung và ý kiến hội viên"
            rules={[{ required: true, whitespace: true, message: 'Nhập nội dung liên hệ' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="result" label="Kết quả liên hệ">
            <Input.TextArea />
          </Form.Item>
          <Button htmlType="submit" loading={pending}>
            Ghi lần liên hệ
          </Button>
        </Form>
      )}
    </>
  );
}
