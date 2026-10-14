import { Alert, DatePicker, Form, Input, Modal } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/sprint3.service';
import { vietnamInput, vietnamTimestamp } from '@/utils/schedule';

/** Chỉ đổi một buổi; cảnh báo và xung đột được backend trả về, không tự hủy booking. */
export function SessionActionModal({ session, mode, memberCount, onClose }) {
  const [form] = Form.useForm();
  const cancel = mode === 'cancel';
  const mutation = useScheduleMutation(
    (values) =>
      cancel
        ? service.cancelSession(session.id, values)
        : service.rescheduleSession(session.id, {
            startAt: vietnamTimestamp(values.range[0]),
            endAt: vietnamTimestamp(values.range[1]),
          }),
    (result) => {
      if (result.data?.conflicts?.length) return;
      onClose();
    },
  );
  return (
    <Modal
      open
      title={cancel ? 'Hủy buổi học' : 'Đổi giờ một buổi'}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      okText={cancel ? 'Hủy buổi' : 'Lưu giờ mới'}
      okButtonProps={{ danger: cancel }}
      cancelText="Đóng"
    >
      <Alert
        showIcon
        type="warning"
        title={`Sẽ thông báo ${memberCount} hội viên đang đăng ký.`}
        description={
          cancel
            ? 'Buổi bị hủy vẫn được giữ trong lịch sử và không thể điểm danh.'
            : 'Nếu trùng lịch của hội viên, hệ thống cảnh báo và cho họ tự hủy miễn phí.'
        }
      />
      {mutation.isError && <Alert showIcon type="error" title={mutation.error.message} />}
      {mutation.data?.data?.conflicts?.length > 0 && (
        <Alert
          showIcon
          type="warning"
          title="Đã đổi giờ"
          description={`${mutation.data.data.conflicts.length} hội viên có lịch trùng. Hệ thống giữ đăng ký và cho phép tự hủy miễn phí.`}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={mutation.mutate}
        initialValues={{ range: [vietnamInput(session.startAt), vietnamInput(session.endAt)] }}
      >
        {cancel ? (
          <Form.Item name="reason" label="Lý do hủy" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea maxLength={1000} />
          </Form.Item>
        ) : (
          <Form.Item
            name="range"
            label="Bắt đầu – kết thúc (giờ Việt Nam)"
            rules={[{ required: true }]}
          >
            <DatePicker.RangePicker showTime format={DATE_FORMATS.DATE_TIME} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
