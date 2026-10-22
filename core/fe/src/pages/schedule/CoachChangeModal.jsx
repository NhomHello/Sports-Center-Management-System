import { useQuery } from '@tanstack/react-query';
import { Alert, DatePicker, Form, Modal, Select } from 'antd';
import { DATE_FORMATS, QUERY_KEYS } from '@/constants';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { listCoaches } from '@/services/schedule.service';
import { changeCoach } from '@/services/sprint3.service';

/** Đổi HLV cho các buổi tương lai; để trống ngày áp dụng cho toàn bộ buổi còn lại. */
export function CoachChangeModal({ item, onClose }) {
  const [form] = Form.useForm();
  const coaches = useQuery({ queryKey: [...QUERY_KEYS.SCHEDULE, 'coaches'], queryFn: listCoaches });
  const save = useScheduleMutation(
    ({ coachId, from }) =>
      changeCoach(item.id, { coachId, ...(from && { from: from.format('YYYY-MM-DD') }) }),
    onClose,
  );
  return (
    <Modal
      open
      title="Đổi HLV phụ trách"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      okText="Đổi HLV"
      cancelText="Đóng"
    >
      <Alert
        type="info"
        title="Buổi đã qua giữ HLV cũ. Hội viên, HLV cũ và mới sẽ nhận thông báo."
      />
      {(save.isError || coaches.isError) && (
        <Alert type="error" title={(save.error || coaches.error).message} />
      )}
      <Form form={form} layout="vertical" onFinish={save.mutate}>
        <Form.Item name="coachId" label="HLV thay thế" rules={[{ required: true }]}>
          <Select
            loading={coaches.isPending}
            options={(coaches.data?.data || [])
              // Góp ý GV: chỉ HLV có chuyên môn bộ môn của lớp, trừ HLV đang phụ trách.
              .filter((c) => c.subjectIds?.includes(item.subjectId) && c.id !== item.coachId)
              .map((c) => ({ value: c.id, label: c.fullName }))}
          />
        </Form.Item>
        <Form.Item name="from" label="Từ ngày (để trống: tất cả buổi tương lai)">
          <DatePicker format={DATE_FORMATS.DATE} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
