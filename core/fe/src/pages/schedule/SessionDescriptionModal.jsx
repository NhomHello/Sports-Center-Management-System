import { Alert, Form, Input, Modal } from 'antd';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { updateSessionDescription } from '@/services/sessionFeedback.service';
/** Chỉ thay nội dung buổi, không tạo lại lịch hoặc mất lịch sử điểm danh. */
export function SessionDescriptionModal({ session, onClose }) {
  const [form] = Form.useForm();
  const save = useScheduleMutation(
    ({ description }) => updateSessionDescription(session.id, description || null),
    onClose,
  );
  return (
    <Modal
      open
      title="Nội dung buổi học"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu nội dung"
      cancelText="Đóng"
      confirmLoading={save.isPending}
    >
      {save.isError && <Alert type="error" title={save.error.message} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{ description: session.description ?? '' }}
        onFinish={save.mutate}
      >
        <Form.Item name="description" label="Mô tả nội dung, mục tiêu và chuẩn bị cho buổi học">
          <Input.TextArea rows={6} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
