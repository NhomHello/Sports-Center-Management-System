import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { Button, Form, Input, Modal, Select, Switch, Table, Tag } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';

function RoomTypeForm({ item, onClose }) {
  const [form] = Form.useForm();
  const subjects = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'subjects', 'active'],
    queryFn: () =>
      service.listResources('subjects', {
        pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
        isActive: 'true',
      }),
  });
  const save = useScheduleMutation(
    (values) => service.saveRoomType({ ...values, ...(item.id && { id: item.id }) }),
    onClose,
  );
  return (
    <Modal
      open
      centered
      title={item.id ? 'Sửa loại phòng' : 'Thêm loại phòng'}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={save.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          isSelfTrainingArea: false,
          isActive: true,
          ...item,
          subjectIds: item.subjects?.map((s) => s.id) ?? [],
        }}
        onFinish={({ subjects: _subjects, ...values }) => save.mutate(values)}
      >
        <Form.Item
          name="name"
          label="Tên loại phòng"
          rules={[{ required: true, whitespace: true, min: 2 }]}
        >
          <Input maxLength={100} placeholder="Ví dụ: Studio, Phòng máy, Sàn võ" />
        </Form.Item>
        <Form.Item name="description" label="Chức năng / trang bị">
          <Input.TextArea maxLength={500} />
        </Form.Item>
        <Form.Item
          name="subjectIds"
          label="Bộ môn được dạy trong loại phòng này"
          rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một bộ môn' }]}
        >
          <Select
            mode="multiple"
            loading={subjects.isPending}
            options={(subjects.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
        <Form.Item name="isSelfTrainingArea" label="Là khu tự tập" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Góp ý GV: mỗi loại phòng có chức năng riêng — bộ môn dạy được và khu tự tập. */
export function RoomTypePanel() {
  const { can } = usePermission();
  const [editing, setEditing] = useState(null);
  const query = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'room-types'],
    queryFn: service.listRoomTypes,
  });
  const columns = [
    {
      title: 'Loại phòng',
      dataIndex: 'name',
      render: (v, r) => <strong title={r.description}>{v}</strong>,
    },
    {
      title: 'Bộ môn dạy được',
      dataIndex: 'subjects',
      render: (subjects) => subjects.map((s) => <Tag key={s.id}>{s.name}</Tag>),
    },
    { title: 'Khu tự tập', dataIndex: 'isSelfTrainingArea', render: (v) => (v ? 'Có' : '—') },
    { title: 'Số phòng', dataIndex: 'roomCount' },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ngừng'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      render: (_, item) =>
        can(P.ROOM_UPDATE) && <Button onClick={() => setEditing(item)}>Sửa</Button>,
    },
  ];
  return (
    <div className="scms-schedule-stack">
      {can(P.ROOM_CREATE) && (
        <Button type="primary" className="scms-panel-action" onClick={() => setEditing({})}>
          Thêm loại phòng
        </Button>
      )}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={query.data?.data ?? []}
        loading={query.isPending}
        pagination={false}
        scroll={{ x: true }}
      />
      {editing && <RoomTypeForm item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
