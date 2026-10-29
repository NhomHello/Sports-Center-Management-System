import dayjs from 'dayjs';
import { Alert, Form, Input, Modal, Switch, TimePicker, Typography } from 'antd';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';

const HHMM = 'HH:mm';

function initialValues(item) {
  return {
    name: item.name,
    isActive: item.isActive ?? true,
    range: item.id
      ? [dayjs(`2000-01-01T${item.startTime}`), dayjs(`2000-01-01T${item.endTime}`)]
      : undefined,
  };
}

function validateRange(_, range) {
  if (!range?.[0] || !range?.[1]) {
    return Promise.reject(new Error('Vui lòng chọn đủ giờ bắt đầu và kết thúc'));
  }

  if (range[0].format(HHMM) >= range[1].format(HHMM)) {
    return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu'));
  }

  return Promise.resolve();
}

function FramePreview({ form }) {
  const name = Form.useWatch('name', form);
  const range = Form.useWatch('range', form);
  const complete = range?.[0] && range?.[1];
  const time = complete
    ? `${range[0].format(HHMM)} – ${range[1].format(HHMM)}`
    : 'Chưa chọn thời gian';

  return (
    <div
      style={{
        padding: 20,
        marginBottom: 24,
        borderRadius: 12,
        background: '#f0f5ff',
        border: '1px solid #d6e4ff',
      }}
    >
      <Typography.Text type="secondary">XEM TRƯỚC KHUNG GIỜ</Typography.Text>
      <Typography.Title level={4} style={{ margin: '8px 0' }}>
        {name?.trim() || 'Tên khung giờ'}
      </Typography.Title>
      <Typography.Text strong style={{ color: '#1d39c4', fontSize: 20 }}>
        {time}
      </Typography.Text>
      <div style={{ marginTop: 8 }}>
        <Typography.Text type="secondary">Giờ Việt Nam · UTC+7</Typography.Text>
      </div>
    </div>
  );
}

/** Form thêm hoặc sửa khung giờ hoạt động, có xem trước cấu hình. */
export function OperatingFrameForm({ item, onClose }) {
  const [form] = Form.useForm();
  const save = useScheduleMutation(
    ({ range, name, isActive }) =>
      service.saveFrame({
        ...(item.id && { id: item.id }),
        name: name.trim(),
        isActive,
        startTime: range[0].format(HHMM),
        endTime: range[1].format(HHMM),
      }),
    onClose,
  );

  return (
    <Modal
      open
      centered
      width={520}
      title={item.id ? 'Chỉnh sửa khung giờ' : 'Thêm khung giờ hoạt động'}
      onCancel={onClose}
      onOk={form.submit}
      okText={item.id ? 'Lưu thay đổi' : 'Tạo khung giờ'}
      cancelText="Hủy"
      confirmLoading={save.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues(item)}
        onFinish={save.mutate}
        style={{ marginTop: 20 }}
      >
        <FramePreview form={form} />
        <Form.Item
          name="name"
          label="Tên khung giờ"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập tên khung giờ' },
            { min: 2, max: 50, message: 'Tên khung giờ cần từ 2 đến 50 ký tự' },
          ]}
        >
          <Input size="large" maxLength={50} placeholder="Ví dụ: Sáng sớm, Buổi tối" />
        </Form.Item>
        <Form.Item
          name="range"
          label="Thời gian hoạt động"
          extra="Chọn giờ bắt đầu và kết thúc trong cùng một ngày."
          rules={[{ validator: validateRange }]}
        >
          <TimePicker.RangePicker
            size="large"
            format={HHMM}
            order={false}
            placeholder={['Giờ bắt đầu', 'Giờ kết thúc']}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          name="isActive"
          label="Trạng thái sử dụng"
          valuePropName="checked"
          extra="Khung đang hoạt động sẽ xuất hiện khi xếp lịch học."
        >
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
        </Form.Item>
        <Alert
          showIcon
          type="info"
          title="Các khung đang hoạt động không được chồng lấn."
          description="Hệ thống sẽ kiểm tra lịch liên quan trước khi lưu thay đổi."
        />
      </Form>
    </Modal>
  );
}
