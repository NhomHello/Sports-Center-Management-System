import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PauseCircleOutlined } from '@ant-design/icons';
import { Alert, App, Button, Collapse, DatePicker, Form, Popconfirm, Table } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { freezeMembership, resumeMembership } from '@/services/sprint3.service';
import { DATE_FORMATS, QUERY_KEYS } from '@/constants';
import { formatDate } from '@/utils/format';
import './membershipOverview.css';

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

function FreezeRequest({ form, mutation, current }) {
  return (
    <>
      {current ? (
        <Popconfirm
          title="Kết thúc lịch bảo lưu và cập nhật ngày hết hạn?"
          okText="Kết thúc bảo lưu"
          cancelText="Giữ bảo lưu"
          onConfirm={() => mutation.mutateAsync({ resume: true })}
        >
          <Button loading={mutation.isPending}>Kết thúc bảo lưu</Button>
        </Popconfirm>
      ) : (
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
            <DatePicker.RangePicker format={DATE_FORMATS.DATE} className="scms-full-width" />
          </Form.Item>
          <Button
            htmlType="submit"
            loading={mutation.isPending}
            icon={<PauseCircleOutlined aria-hidden="true" />}
          >
            Yêu cầu bảo lưu
          </Button>
        </Form>
      )}
    </>
  );
}

function FreezeHistory({ freezes }) {
  if (!freezes.length) return <p className="scms-freeze-empty">Chưa có lịch sử bảo lưu.</p>;
  return (
    <Table
      rowKey="id"
      size="small"
      pagination={false}
      dataSource={freezes}
      scroll={{ x: 420 }}
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
  );
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
  const current = freezes.find((freeze) => !freeze.endedAt);
  return (
    <Collapse
      className="scms-freeze-panel"
      defaultActiveKey={current ? ['freeze'] : []}
      expandIconPlacement="end"
      items={[
        {
          key: 'freeze',
          label: (
            <span className="scms-freeze-panel__label">
              <PauseCircleOutlined /> Bảo lưu gói tập
            </span>
          ),
          extra: (
            <span className="scms-freeze-panel__summary">
              {current ? 'Có lịch bảo lưu' : 'Tạm dừng khi bạn cần'}
            </span>
          ),
          children: (
            <div className="scms-freeze-content">
              <Alert
                type="info"
                showIcon
                title="Lưu ý trước khi bảo lưu"
                description="Hủy các đăng ký trùng khoảng bảo lưu trước khi gửi. Giới hạn ngày và số lượt do trung tâm cấu hình. Kết thúc sớm chỉ cộng số ngày thực dừng."
              />
              <FreezeRequest form={form} mutation={mutation} current={current} />
              <FreezeHistory freezes={freezes} />
            </div>
          ),
        },
      ]}
    />
  );
}
