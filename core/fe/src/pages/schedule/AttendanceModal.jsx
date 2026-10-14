import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Modal, Space } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/sprint3.service';
import { AttendanceTable } from './AttendanceTable';
import { QueryState } from './QueryState';

/** Chỉ gửi các lựa chọn đã ghi; không mặc định mọi người vắng khi mở form. */
export function AttendanceModal({ session, onClose }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'attendance', session.id],
    queryFn: () => service.getAttendance(session.id),
  });
  const save = useScheduleMutation(
    (values) =>
      service.recordAttendance(
        session.id,
        Object.entries(values)
          .filter(([, status]) => status)
          .map(([id, status]) => ({ memberId: Number(id), status })),
      ),
    onClose,
  );
  const unlock = useScheduleMutation(({ reason }) => service.unlockAttendance(session.id, reason));
  const [unlockForm] = Form.useForm();
  const data = query.data?.data;
  const disabled = session.status === 'CANCELLED' || new Date(session.startAt) > new Date();
  return (
    <Modal
      open
      title="Điểm danh buổi học"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu điểm danh"
      cancelText="Đóng"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled }}
      width={760}
    >
      <QueryState query={query}>
        {disabled && (
          <Alert
            showIcon
            type="warning"
            title="Không thể điểm danh buổi chưa bắt đầu hoặc đã huỷ."
          />
        )}
        {save.isError && <Alert showIcon type="error" title={save.error.message} />}
        {data && (
          <Form
            key={query.dataUpdatedAt}
            form={form}
            onFinish={save.mutate}
            disabled={disabled}
            initialValues={Object.fromEntries(data.attendance.map((a) => [a.memberId, a.status]))}
          >
            <AttendanceTable data={data} session={session} />
          </Form>
        )}
        {can(P.ATTENDANCE_MANAGE) && (
          <Form form={unlockForm} onFinish={unlock.mutate}>
            <Space>
              <Form.Item name="reason" rules={[{ required: true, whitespace: true }]}>
                <Input placeholder="Lý do mở hạn sửa" />
              </Form.Item>
              <Button htmlType="submit" loading={unlock.isPending}>
                Mở hạn sửa
              </Button>
            </Space>
          </Form>
        )}
      </QueryState>
    </Modal>
  );
}
