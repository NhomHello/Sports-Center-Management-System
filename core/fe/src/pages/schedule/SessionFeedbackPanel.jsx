import { SESSION_STATUS } from '@/constants/schedule';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Modal, Rate, Space, Table } from 'antd';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { QUERY_KEYS } from '@/constants';
import { getSessionFeedback, saveSessionFeedback } from '@/services/sessionFeedback.service';
import { QueryState } from './QueryState';
const NOTE_MAX = 2000;
function FeedbackEditor({ session, row, onClose }) {
  const [form] = Form.useForm();
  const save = useScheduleMutation(
    (values) =>
      saveSessionFeedback(session.id, row.member.id, {
        rating: values.rating || null,
        note: values.note || '',
        expectedVersion: row.feedback?.version ?? 0,
      }),
    onClose,
  );
  return (
    <Modal
      open
      title={`Nhận xét · ${row.member.fullName}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu nhận xét"
      cancelText="Đóng"
      confirmLoading={save.isPending}
    >
      <Alert
        type="info"
        title="Học viên chỉ xem được nhận xét của chính mình. Lưu nhận xét không đổi điểm danh."
      />
      {save.isError && <Alert showIcon type="error" title={save.error.message} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{ rating: row.feedback?.rating ?? 0, note: row.feedback?.note ?? '' }}
        onFinish={save.mutate}
      >
        <Form.Item name="rating" label="Đánh giá mức độ thực hiện (tùy chọn)">
          <Rate allowClear />
        </Form.Item>
        <Form.Item name="note" label="Nhận xét và lưu ý cho học viên">
          <Input.TextArea rows={4} maxLength={NOTE_MAX} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
/** Nhận xét vẫn mở sau buổi học; không nằm trong form điểm danh đã bị khoá. */
export function SessionFeedbackPanel({ session }) {
  const [editing, setEditing] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'session-feedback', session.id],
    queryFn: () => getSessionFeedback(session.id),
  });
  const disabled = session.status === SESSION_STATUS.CANCELLED || new Date(session.startAt) > new Date();
  return (
    <Space vertical className="scms-full-width">
      <h3>Nhận xét từng học viên</h3>
      <QueryState query={query}>
        <Table
          rowKey={(row) => row.member.id}
          dataSource={query.data?.data.items ?? []}
          pagination={false}
          scroll={{ x: 760 }}
          columns={[
            { title: 'Học viên', width: 200, render: (_, row) => row.member.fullName },
            {
              title: 'Đánh giá',
              width: 120,
              render: (_, row) =>
                row.feedback?.rating ? `${row.feedback.rating}/5` : 'Chưa đánh giá',
            },
            { title: 'Ghi chú', width: 320, render: (_, row) => row.feedback?.note || '—' },
            {
              title: 'Thao tác',
              width: 120,
              render: (_, row) => (
                <Button disabled={disabled} onClick={() => setEditing(row)}>
                  Nhận xét
                </Button>
              ),
            },
          ]}
        />
      </QueryState>
      {editing && (
        <FeedbackEditor
          session={session}
          row={editing}
          onClose={() => {
            setEditing(null);
            query.refetch();
          }}
        />
      )}
    </Space>
  );
}
