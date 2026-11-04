import { SessionFeedbackPanel } from './SessionFeedbackPanel';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Input, Modal, Space, Tabs } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/sprint3.service';
import { AttendanceTable } from './AttendanceTable';
import { QueryState } from './QueryState';

const CLOCK_TICK_MS = 1000;
const ATTENDANCE_MODAL_BODY_STYLE = {
  body: { height: 'min(580px, calc(100vh - 180px))', overflowY: 'auto' },
};

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

function AttendanceTabContent({
  data,
  form,
  formKey,
  disabled,
  save,
}) {
  return (
    <>
      {save.isError && <Alert showIcon type="error" title={save.error.message} />}
      <Form
        key={formKey}
        form={form}
        onFinish={save.mutate}
        disabled={disabled}
        initialValues={Object.fromEntries(data.attendance.map((a) => [a.memberId, a.status]))}
      >
        <AttendanceTable data={data} />
      </Form>
    </>
  );
}

function AttendanceModalFooter({
  onClose,
  showSave,
  disabled,
  save,
  form,
  canManage,
  unlockForm,
  unlock,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {canManage && showSave && (
        <Form form={unlockForm} onFinish={unlock.mutate} style={{ width: '100%' }}>
          <div
            className="scms-form-row"
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Form.Item
              name="reason"
              rules={[{ required: true, whitespace: true }]}
              style={{ marginBottom: 0 }}
            >
              <Input className="scms-full-width" placeholder="Lý do mở hạn sửa" />
            </Form.Item>
            <Button htmlType="submit" loading={unlock.isPending} style={{ flexShrink: 0 }}>
              Mở hạn sửa
            </Button>
          </div>
        </Form>
      )}
      <Space size={12} style={{ alignSelf: 'flex-end' }}>
        <Button onClick={onClose}>Đóng</Button>
        {showSave && (
          <Button
            type="primary"
            disabled={disabled}
            loading={save.isPending}
            onClick={() => form.submit()}
          >
            Lưu điểm danh
          </Button>
        )}
      </Space>
    </div>
  );
}

/** Chỉ gửi các lựa chọn đã ghi; không mặc định mọi người vắng khi mở form. */
export function AttendanceModal({ session, onClose }) {
  const { can } = usePermission();
  const now = useAttendanceClock();
  const [activeTab, setActiveTab] = useState('attendance');
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
  const currentSession = data?.session ?? session;
  const { disabled, message: disabledMessage } = attendanceLock(currentSession, now, currentSession.attendanceUnlockedUntil);
  return (
    <Modal
      open
      title="Điểm danh buổi học"
      onCancel={onClose}
      width="min(800px, calc(100vw - 32px))"
      style={{ top: 16 }}
      styles={ATTENDANCE_MODAL_BODY_STYLE}
      footer={
        <AttendanceModalFooter
          onClose={onClose}
          showSave={Boolean(data) && activeTab === 'attendance'}
          disabled={disabled}
          save={save}
          form={form}
          canManage={can(P.ATTENDANCE_MANAGE)}
          unlockForm={unlockForm}
          unlock={unlock}
        />
      }
    >
      <QueryState query={query}>
        {disabled && <Alert showIcon type="warning" title={disabledMessage} />}
        {data && (
          <Tabs
            className="scms-full-width"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'attendance',
                label: 'Điểm danh',
                children: (
                  <AttendanceTabContent
                    data={data}
                    form={form}
                    formKey={query.dataUpdatedAt}
                    disabled={disabled}
                    save={save}
                  />
                ),
              },
              {
                key: 'feedback',
                label: 'Nhận xét học viên',
                children: <SessionFeedbackPanel session={currentSession} />,
              },
            ]}
          />
        )}
      </QueryState>
    </Modal>
  );
}
