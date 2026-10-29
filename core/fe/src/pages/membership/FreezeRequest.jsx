import { PauseCircleOutlined } from '@ant-design/icons';
import { Button, Form, Popconfirm, Typography } from 'antd';
import { ResponsiveRangePicker } from '@/components/common/ResponsiveRangePicker';
import { DATE_FORMATS } from '@/constants';
import { formatDate } from '@/utils/format';

/** Giữ nguyên payload và validation server; chỉ tách form khỏi lịch sử. */
export function FreezeRequest({ form, mutation, current }) {
  if (current)
    return (
      <div className="scms-freeze-current">
        <Typography.Text strong>Lịch bảo lưu hiện tại</Typography.Text>
        <Typography.Paragraph>
          {formatDate(current.startAt)} – {formatDate(current.endAt)}
        </Typography.Paragraph>
        <Popconfirm
          title="Kết thúc lịch bảo lưu và cập nhật ngày hết hạn?"
          okText="Kết thúc bảo lưu"
          cancelText="Giữ bảo lưu"
          disabled={mutation.isPending}
          onConfirm={() => mutation.mutateAsync({ resume: true })}
        >
          <Button loading={mutation.isPending}>Kết thúc bảo lưu</Button>
        </Popconfirm>
      </div>
    );
  return (
    <Form
      form={form}
      className="scms-freeze-form"
      layout="vertical"
      disabled={mutation.isPending}
      onFinish={mutation.mutate}
    >
      <Form.Item
        name="dates"
        label="Khoảng thời gian bảo lưu"
        extra="Không bao gồm ngày kết thúc."
        rules={[{ required: true, message: 'Chọn khoảng bảo lưu' }]}
      >
        <ResponsiveRangePicker format={DATE_FORMATS.DATE} className="scms-full-width" />
      </Form.Item>
      <Button
        htmlType="submit"
        loading={mutation.isPending}
        icon={<PauseCircleOutlined aria-hidden />}
      >
        Yêu cầu bảo lưu
      </Button>
    </Form>
  );
}
