import { Alert, App, DatePicker, Form, Input, Modal } from 'antd';
import { previewReschedule } from '@/services/schedule.service';
import { DATE_FORMATS } from '@/constants';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/sprint3.service';
import { vietnamInput, vietnamTimestamp } from '@/utils/schedule';

const rangeOf = (values) => ({
  startAt: vietnamTimestamp(values.range[0]),
  endAt: vietnamTimestamp(values.range[1]),
});

/** Xem trước (khung giờ, phòng, HLV, học viên bị trùng) rồi mới đổi giờ (góp ý GV). */
async function confirmReschedule({ session, values, mutation, modal, message }) {
  try {
    const { data } = await previewReschedule(session.id, rangeOf(values));
    modal.confirm({
      title: 'Xác nhận đổi giờ buổi học',
      content: `${data.enrolledCount} học viên sẽ nhận thông báo giờ mới.${
        data.conflicts.length
          ? ` ${data.conflicts.length} người bị trùng lịch: ${data.conflicts.map((c) => c.fullName).join(', ')} (được tự huỷ miễn phí).`
          : ' Không ai bị trùng lịch.'
      }`,
      okText: 'Đổi giờ',
      cancelText: 'Xem lại',
      onOk: () => mutation.mutateAsync(values),
    });
  } catch (error) {
    message.error(error.message);
  }
}

/** Chỉ đổi một buổi; cảnh báo và xung đột được backend trả về, không tự hủy booking. */
export function SessionActionModal({ session, mode, memberCount, onClose }) {
  const [form] = Form.useForm();
  const { modal, message } = App.useApp();
  const cancel = mode === 'cancel';
  const mutation = useScheduleMutation(
    (values) =>
      cancel
        ? service.cancelSession(session.id, values)
        : service.rescheduleSession(session.id, rangeOf(values)),
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
        onFinish={(values) =>
          cancel
            ? mutation.mutate(values)
            : confirmReschedule({ session, values, mutation, modal, message })
        }
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
