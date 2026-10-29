import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS } from '@scms/shared';
import { Alert, App, Button, Checkbox, Form, Input, Modal, Space } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { QUERY_KEYS } from '@/constants';
import { COURSE_KEYS, COURSE_LIMITS, SUMMARY_STATUS } from '@/constants/courses';
import { publishSummary, reopenSummary } from '@/services/course.service';

function ActionModal({ mode, summary, mutation, onClose }) {
  const [form] = Form.useForm();
  const missing = summary.items.some((item) => item.attendance.missing > 0);
  const publishing = mode === 'publish';
  return (
    <Modal
      open
      title={publishing ? 'Công bố tổng kết' : 'Mở lại tổng kết'}
      okText={publishing ? 'Xác nhận công bố' : 'Xác nhận mở lại'}
      cancelText="Đóng"
      onCancel={() => !mutation.isPending && onClose()}
      onOk={form.submit}
      confirmLoading={mutation.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(data) => mutation.mutate({ mode, data })}
        disabled={mutation.isPending}
      >
        {publishing ? (
          <>
            <Alert
              type="warning"
              showIcon
              title="Bản tổng kết sẽ bị khóa. Hội viên nhận thông báo và email; công bố lại sẽ gửi bản cập nhật."
            />
            {missing && (
              <Form.Item
                name="acknowledgeMissingAttendance"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('Cần xác nhận cảnh báo chưa điểm danh')),
                  },
                ]}
              >
                <Checkbox>Tôi đã kiểm tra và xác nhận công bố dù còn buổi chưa điểm danh</Checkbox>
              </Form.Item>
            )}
          </>
        ) : (
          <Form.Item
            name="reason"
            label="Lý do mở lại"
            rules={[{ required: true, whitespace: true, message: 'Nhập lý do mở lại' }]}
          >
            <Input.TextArea maxLength={COURSE_LIMITS.REASON_LENGTH} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

/** S4-15: công bố và mở lại theo quyền; refetch khi xung đột để không ghi vào bản đã khóa. */
export function SummaryActions({ summary, canEdit }) {
  const { can } = usePermission();
  const { message } = App.useApp();
  const client = useQueryClient();
  const [mode, setMode] = useState(null);
  const refresh = () =>
    [
      COURSE_KEYS.SUMMARIES,
      COURSE_KEYS.RESULTS,
      COURSE_KEYS.REPORT,
      QUERY_KEYS.NOTIFICATIONS,
    ].forEach((queryKey) => client.invalidateQueries({ queryKey }));
  const mutation = useMutation({
    mutationFn: ({ mode: action, data }) =>
      action === 'publish'
        ? publishSummary(summary.classId, data)
        : reopenSummary(summary.classId, data),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái tổng kết');
      refresh();
      setMode(null);
    },
    onError: (error) => {
      message.error(error.message);
      refresh();
    },
  });
  const complete =
    summary.items.length > 0 && summary.items.every((row) => row.result && row.progress);
  return (
    <Space vertical className="scms-full-width">
      {summary.status === SUMMARY_STATUS.PUBLISHED && (
        <Alert type="success" showIcon title="Tổng kết đã công bố và khóa chỉnh sửa." />
      )}
      {summary.reopenedReason && (
        <Alert type="info" title={`Lý do mở lại: ${summary.reopenedReason}`} />
      )}
      {canEdit && (
        <>
          <Button type="primary" disabled={!complete} onClick={() => setMode('publish')}>
            Công bố tổng kết
          </Button>
          {!complete && (
            <Alert
              type="info"
              title="Cần lưu kết quả và mức tiến bộ cho tất cả hội viên trước khi công bố."
            />
          )}
        </>
      )}
      {summary.status === SUMMARY_STATUS.PUBLISHED && can(PERMISSIONS.COURSE_SUMMARY_REOPEN) && (
        <Button onClick={() => setMode('reopen')}>Mở lại tổng kết</Button>
      )}
      {mode && (
        <ActionModal
          mode={mode}
          summary={summary}
          mutation={mutation}
          onClose={() => setMode(null)}
        />
      )}
    </Space>
  );
}
