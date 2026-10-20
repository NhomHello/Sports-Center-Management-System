import { useState } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { Alert, Button, Form, Input, Modal, Switch, Table, Tag, TimePicker } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';

const HHMM = 'HH:mm';

function FrameForm({ item, onClose }) {
  const [form] = Form.useForm();
  const save = useScheduleMutation(
    ({ range, ...values }) =>
      service.saveFrame({
        ...values,
        startTime: range[0].format(HHMM),
        endTime: range[1].format(HHMM),
        ...(item.id && { id: item.id }),
      }),
    onClose,
  );
  const range = item.id
    ? [dayjs(`2000-01-01T${item.startTime}`), dayjs(`2000-01-01T${item.endTime}`)]
    : undefined;
  return (
    <Modal
      open
      centered
      title={item.id ? 'Sửa khung giờ' : 'Thêm khung giờ'}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={save.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true, ...item, range }}
        onFinish={save.mutate}
      >
        <Form.Item
          name="name"
          label="Tên khung"
          rules={[{ required: true, whitespace: true, min: 2 }]}
        >
          <Input maxLength={50} placeholder="Ví dụ: Sáng sớm" />
        </Form.Item>
        <Form.Item name="range" label="Từ – đến (giờ Việt Nam)" rules={[{ required: true }]}>
          <TimePicker.RangePicker format={HHMM} minuteStep={15} />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Góp ý GV: một ngày chia thành các khung giờ lớn; lịch học và gói tự tập nằm trong khung. */
export function OperatingFramePanel() {
  const { can } = usePermission();
  const [editing, setEditing] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'frames'],
    queryFn: service.listFrames,
  });
  const columns = [
    { title: 'Khung giờ', dataIndex: 'name', render: (v) => <strong>{v}</strong> },
    { title: 'Từ', dataIndex: 'startTime' },
    { title: 'Đến', dataIndex: 'endTime' },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ngừng'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_, item) =>
        can(P.SETTING_UPDATE) && <Button onClick={() => setEditing(item)}>Sửa</Button>,
    },
  ];
  return (
    <div className="scms-schedule-stack">
      <Alert
        showIcon
        type="info"
        title="Mỗi khung giờ học trong tuần phải nằm trọn trong một khung giờ hoạt động."
        description="Các khung không được chồng nhau. Không thể thu hẹp hay ngừng khung khi còn buổi học tương lai nằm trong khung đó."
      />
      {can(P.SETTING_UPDATE) && (
        <Button type="primary" className="scms-panel-action" onClick={() => setEditing({})}>
          Thêm khung giờ
        </Button>
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={query.data?.data ?? []}
        loading={query.isPending}
        pagination={false}
      />
      {editing && <FrameForm item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
