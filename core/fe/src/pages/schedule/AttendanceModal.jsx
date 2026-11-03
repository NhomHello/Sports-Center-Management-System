import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/sprint3.service';
import { AttendanceTable } from './AttendanceTable';
import { QueryState } from './QueryState';

const CLOCK_TICK_MS = 1000;

function useAttendanceClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function attendanceLock(session, now, unlockedUntil) {
  const isUnlocked = new Date(unlockedUntil ?? 0).getTime() > now;
  if (session.status === 'CANCELLED') return { disabled: true, message: 'Buổi học đã bị hủy.' };
  if (new Date(session.startAt).getTime() > now)
    return { disabled: true, message: 'Chưa đến giờ bắt đầu điểm danh.' };
  if (new Date(session.endAt).getTime() <= now && !isUnlocked)
    return { disabled: true, message: 'Buổi học đã kết thúc; cần quản lý mở quyền sửa.' };
  return { disabled: false, message: null };
}

function AttendanceUnlockForm({ sessionId }) {
  const [form] = Form.useForm();
  const unlock = useScheduleMutation(({ reason }) => service.unlockAttendance(sessionId, reason));
  return (
    <Form form={form} className="scms-attendance-unlock" layout="vertical" onFinish={unlock.mutate}>
      <Form.Item
        name="reason"
        className="scms-attendance-unlock__field"
        rules={[{ required: true, whitespace: true }]}
      >
        <Input size="large" placeholder="Lý do mở hạn sửa" />
      </Form.Item>
      <Button
        size="large"
        htmlType="submit"
        loading={unlock.isPending}
        className="scms-attendance-unlock__button"
      >
        Mở hạn sửa
      </Button>
    </Form>
  );
}

/** Chỉ gửi các lựa chọn đã ghi; không mặc định mọi người vắng khi mở form. */
export function AttendanceModal({ session, onClose }) {
  const { can } = usePermission();
  const now = useAttendanceClock();
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
  const data = query.data?.data;
  const currentSession = data?.session ?? session;
  const { disabled, message: disabledMessage } = attendanceLock(
    currentSession,
    now,
    currentSession.attendanceUnlockedUntil,
  );
  return (
    <Modal
      open
      centered
      className="scms-attendance-modal"
      title="Điểm danh buổi học"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Lưu điểm danh"
      cancelText="Đóng"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled }}
      width={720}
      style={{ maxWidth: '92vw' }}
    >
      <QueryState query={query}>
        {disabled && <Alert showIcon type="warning" title={disabledMessage} />}
        {save.isError && <Alert showIcon type="error" title={save.error.message} />}
        {data && (
          <Form
            className="scms-attendance-form"
            key={query.dataUpdatedAt}
            form={form}
            onFinish={save.mutate}
            disabled={disabled}
            initialValues={Object.fromEntries(data.attendance.map((a) => [a.memberId, a.status]))}
          >
            <AttendanceTable data={data} />
          </Form>
        )}
        {can(P.ATTENDANCE_MANAGE) && <AttendanceUnlockForm sessionId={session.id} />}
      </QueryState>
    </Modal>
  );
}
