import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Form, Input, Modal, Rate, Select } from 'antd';
import { COURSE_KEYS, COURSE_LIMITS, RESULT_LABELS } from '@/constants/courses';
import { saveSummaryItem } from '@/services/course.service';

function useSaveItem({ item, classId, onClose, form }) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => saveSummaryItem(classId, item.id, data),
    onSuccess: () => {
      message.success('Đã lưu nháp kết quả');
      client.invalidateQueries({ queryKey: COURSE_KEYS.SUMMARIES });
      onClose();
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
      client.invalidateQueries({ queryKey: COURSE_KEYS.SUMMARIES });
    },
  });
  return mutation;
}

/** Lưu nháp nhiều lần, giữ nội dung đang nhập nếu API từ chối hoặc trạng thái vừa thay đổi. */
export function SummaryItemModal({ item, classId, onClose }) {
  const [form] = Form.useForm();
  const mutation = useSaveItem({ item, classId, onClose, form });
  const result = Form.useWatch('result', form);
  return (
    <Modal
      open
      title={`Kết quả · ${item.member.fullName}`}
      okText="Lưu nháp"
      cancelText="Đóng"
      onOk={form.submit}
      onCancel={() => !mutation.isPending && onClose()}
      confirmLoading={mutation.isPending}
    >
      <Alert
        type="info"
        showIcon
        title={`Chuyên cần ${item.attendance.percent}% · Gợi ý: ${RESULT_LABELS[item.suggestedResult]}`}
      />
      <Form
        form={form}
        layout="vertical"
        disabled={mutation.isPending}
        onFinish={mutation.mutate}
        initialValues={{
          result: item.result ?? item.suggestedResult,
          progress: item.progress,
          comment: item.comment,
          nextCourse: item.nextCourse,
        }}
      >
        <Form.Item
          name="result"
          label="Kết quả"
          rules={[{ required: true, message: 'Chọn kết quả' }]}
        >
          <Select
            options={Object.entries(RESULT_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Form.Item>
        <Form.Item
          name="progress"
          label="Mức tiến bộ"
          rules={[{ required: true, message: 'Chọn mức tiến bộ' }]}
        >
          <Rate count={COURSE_LIMITS.MAX_PROGRESS} />
        </Form.Item>
        <Form.Item
          name="comment"
          label="Nhận xét"
          extra="Bắt buộc khi chọn kết quả khác gợi ý của hệ thống."
          rules={[
            {
              required: Boolean(result && result !== item.suggestedResult),
              whitespace: true,
              message: 'Nhập nhận xét khi chọn khác gợi ý',
            },
          ]}
        >
          <Input.TextArea rows={3} maxLength={COURSE_LIMITS.TEXT_LENGTH} showCount />
        </Form.Item>
        <Form.Item name="nextCourse" label="Gợi ý khóa tiếp theo">
          <Input.TextArea maxLength={COURSE_LIMITS.TEXT_LENGTH} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
