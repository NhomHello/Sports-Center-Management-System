import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert, Button, DatePicker, Form, Input, Modal } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { previewMaintenance, createMaintenance } from '@/services/sprint3.service';
import { vietnamTimestamp } from '@/utils/schedule';
import { MaintenanceAssignments } from './MaintenanceAssignments';

/** Xem trước đủ các buổi; bắt buộc chọn chuyển phòng hoặc hủy từng buổi rồi mới áp dụng. */
export function RoomMaintenanceModal({ room, onClose }) {
  const [form] = Form.useForm();
  const [range, setRange] = useState(null);
  const [assignments, setAssignments] = useState({});
  const preview = useMutation({ mutationFn: (values) => previewMaintenance(room.id, values) });
  const save = useScheduleMutation(
    ({ reason }) =>
      createMaintenance(room.id, {
        ...range,
        reason,
        assignments: (preview.data?.data || []).map((s) => ({
          sessionId: s.id,
          roomId: assignments[s.id],
        })),
      }),
    onClose,
  );
  const handlePreview = async () => {
    const { dates } = await form.validateFields(['dates']);
    const next = { startAt: vietnamTimestamp(dates[0]), endAt: vietnamTimestamp(dates[1]) };
    setRange(next);
    setAssignments({});
    preview.mutate(next);
  };
  const complete =
    preview.isSuccess && preview.data.data.every((s) => assignments[s.id] !== undefined);
  const invalidatePreview = () => {
    preview.reset();
    setAssignments({});
  };
  return (
    <Modal
      open
      width={900}
      title={`Bảo trì · ${room.name}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Áp dụng kế hoạch"
      cancelText="Đóng"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: !complete }}
    >
      <Alert
        showIcon
        type="warning"
        title="Hội viên sẽ nhận thông báo đổi phòng hoặc hủy buổi. Lịch sử được giữ lại."
      />
      {(preview.isError || save.isError) && (
        <Alert type="error" title={(preview.error || save.error).message} />
      )}
      <Form form={form} layout="vertical" onFinish={save.mutate}>
        <Form.Item name="dates" label="Khoảng bảo trì (giờ Việt Nam)" rules={[{ required: true }]}>
          <DatePicker.RangePicker
            showTime
            format={DATE_FORMATS.DATE_TIME}
            onChange={invalidatePreview}
          />
        </Form.Item>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true }]}>
          <Input.TextArea maxLength={1000} />
        </Form.Item>
        <Button onClick={handlePreview} loading={preview.isPending}>
          Xem buổi bị ảnh hưởng
        </Button>
      </Form>
      {preview.isSuccess && (
        <MaintenanceAssignments
          sessions={preview.data.data}
          assignments={assignments}
          setAssignments={setAssignments}
        />
      )}
    </Modal>
  );
}
