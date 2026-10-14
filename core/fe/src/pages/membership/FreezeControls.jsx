import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, DatePicker, Form, Popconfirm, Space, Table } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { freezeMembership, resumeMembership } from '@/services/sprint3.service';
import { DATE_FORMATS, QUERY_KEYS } from '@/constants';
import { formatDate } from '@/utils/format';

function useFreezeMutation(membership) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [form] = Form.useForm();
  const mutation = useMutation({
    mutationFn: ({ resume, dates }) =>
      resume
        ? resumeMembership(membership.id)
        : freezeMembership(membership.id, {
            from: dates[0].format('YYYY-MM-DD'),
            to: dates[1].format('YYYY-MM-DD'),
          }),
    onSuccess: () => {
      message.success('Đã cập nhật bảo lưu');
      form.resetFields();
      [QUERY_KEYS.MEMBERS, ['ownMembership'], ['profile'], ['freeze-current']].forEach((queryKey) =>
        client.invalidateQueries({ queryKey }),
      );
    },
    onError: (error) => message.error(error.message),
  });
  return { form, mutation };
}

/** BR-1.16: giới hạn từ server, không tự cộng ngày hay bỏ qua đăng ký trùng khoảng bảo lưu. */
export function FreezeControls({ membership, own = false }) {
  const { can } = usePermission();
  const { form, mutation } = useFreezeMutation(membership);
  if (
    !membership ||
    !can(own ? PERMISSIONS.MEMBERSHIP_FREEZE_SELF : PERMISSIONS.MEMBERSHIP_FREEZE_ALL)
  )
    return null;
  const freezes = membership.freezes ?? [];
  const current = freezes.find((f) => !f.endedAt);
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Alert
        type="info"
        showIcon
        title="Bảo lưu gói tập"
        description="Hủy các đăng ký trùng khoảng bảo lưu trước khi gửi. Giới hạn ngày và số lượt do trung tâm cấu hình. Kết thúc sớm chỉ cộng số ngày thực dừng."
      />
      {current ? (
        <Popconfirm
          title="Kết thúc lịch bảo lưu và cập nhật ngày hết hạn?"
          onConfirm={() => mutation.mutateAsync({ resume: true })}
        >
          <Button loading={mutation.isPending}>Kết thúc bảo lưu</Button>
        </Popconfirm>
      ) : (
        <Form
          form={form}
          layout="vertical"
          disabled={mutation.isPending}
          onFinish={mutation.mutate}
        >
          <Form.Item
            name="dates"
            label="Từ ngày / đến ngày (không gồm ngày kết thúc)"
            rules={[{ required: true, message: 'Chọn khoảng bảo lưu' }]}
          >
            <DatePicker.RangePicker format={DATE_FORMATS.DATE} />
          </Form.Item>
          <Button htmlType="submit" loading={mutation.isPending}>
            Yêu cầu bảo lưu
          </Button>
        </Form>
      )}
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={freezes}
        columns={[
          { title: 'Từ ngày', dataIndex: 'startAt', render: (v) => formatDate(v) },
          { title: 'Đến ngày', dataIndex: 'endAt', render: (v) => formatDate(v) },
          {
            title: 'Ngày được cộng',
            dataIndex: 'creditedDays',
            render: (v) => v ?? 'Chờ kết thúc',
          },
        ]}
      />
    </Space>
  );
}
