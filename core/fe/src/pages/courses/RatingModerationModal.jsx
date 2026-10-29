import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Modal } from 'antd';
import { COURSE_KEYS, COURSE_LIMITS } from '@/constants/courses';
import { PROFILE_KEYS } from '@/constants/profile';
import { moderateRating } from '@/services/course.service';
/** Bắt buộc lý do; ẩn nhận xét không thay đổi sao của hội viên. */
export function RatingModerationModal({ item, onClose }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ reason }) => moderateRating(item.id, { hidden: !item.hidden, reason }),
    onSuccess: () => {
      message.success('Đã cập nhật hiển thị nhận xét');
      [COURSE_KEYS.RATINGS, PROFILE_KEYS.COACHES].forEach((queryKey) =>
        client.invalidateQueries({ queryKey }),
      );
      onClose();
    },
    onError: (error) => message.error(error.message),
  });
  return (
    <Modal
      open
      title={item.hidden ? 'Hiện lại nhận xét' : 'Ẩn nhận xét'}
      okText="Lưu quyết định"
      cancelText="Đóng"
      onCancel={() => !mutation.isPending && onClose()}
      onOk={form.submit}
      confirmLoading={mutation.isPending}
    >
      <p>{item.comment || 'Không có nhận xét bằng chữ'}</p>
      <Form form={form} layout="vertical" onFinish={mutation.mutate} disabled={mutation.isPending}>
        <Form.Item
          name="reason"
          label="Lý do kiểm duyệt"
          rules={[{ required: true, whitespace: true, message: 'Nhập lý do quyết định' }]}
        >
          <Input.TextArea maxLength={COURSE_LIMITS.REASON_LENGTH} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
