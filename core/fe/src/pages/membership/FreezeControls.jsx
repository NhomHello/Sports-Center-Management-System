import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, DatePicker, Form, Popconfirm, Space, Table, Tag } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { freezeMembership, resumeMembership } from '@/services/sprint3.service';
import { getPurchaseMembership } from '@/services/purchase.service';
import { DATE_FORMATS } from '@/constants';
import { formatDate } from '@/utils/format';
import { vietnamCalendarDate, vietnamInput } from '@/utils/schedule';
import { refreshPurchases } from './CancelPurchasePolicy';

const HISTORY_COLUMNS = [
  { title: 'Từ ngày', dataIndex: 'startAt', render: (value) => formatDate(vietnamInput(value)) },
  { title: 'Đến ngày', dataIndex: 'endAt', render: (value) => formatDate(vietnamInput(value)) },
  {
    title: 'Ngày được cộng',
    dataIndex: 'creditedDays',
    render: (value) => value ?? 'Chờ kết thúc',
  },
];
const hasBudget = (data) =>
  Number.isSafeInteger(data?.freezeDaysUsed) &&
  data.freezeDaysUsed >= 0 &&
  Number.isSafeInteger(data?.freezeDaysLeft) &&
  data.freezeDaysLeft >= 0;
const resolveMinDays = (policy, data) => policy?.minDays ?? data.freezeMinDays;
const freezeFormDisabled = ({ data, query, mutation, minDays, ready }) =>
  !ready ||
  query.isFetching ||
  mutation.isPending ||
  data.freezeDaysLeft < minDays ||
  data.status !== 'ACTIVE';

function useFreezeRecord(membership, allowed) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['freeze-current', user?.id, membership?.id],
    queryFn: () => getPurchaseMembership(membership.id),
    enabled: Boolean(membership?.id) && allowed,
    retry: false,
    staleTime: 0,
  });
}

function useFreezeMutation(membershipId) {
  const { message } = App.useApp();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ resume, dates }) =>
      resume
        ? resumeMembership(membershipId)
        : freezeMembership(membershipId, {
            from: dates[0].format('YYYY-MM-DD'),
            to: dates[1].format('YYYY-MM-DD'),
          }),
    onSuccess: async () => {
      message.success('Đã cập nhật bảo lưu');
      await refreshPurchases(client);
    },
    onError: () => client.invalidateQueries({ queryKey: ['freeze-current'] }),
  });
}

function validateRange(dates, data, minDays) {
  if (!dates) return Promise.reject(new Error('Chọn khoảng bảo lưu'));
  const [from, to] = dates.map(vietnamCalendarDate);
  const days = to.diff(from, 'day');
  if (from.isBefore(vietnamInput().startOf('day')))
    return Promise.reject(new Error('Không bảo lưu lùi ngày'));
  if (from.isSame(vietnamInput(data.endDate), 'day') || from.isAfter(vietnamInput(data.endDate)))
    return Promise.reject(new Error('Ngày bắt đầu phải trước khi gói hết hạn'));
  if (days < minDays || days > data.freezeDaysLeft)
    return Promise.reject(new Error(`Chọn từ ${minDays} đến ${data.freezeDaysLeft} ngày`));
  return Promise.resolve();
}

function FreezeForm({ data, minDays, mutation, disabled }) {
  const [form] = Form.useForm();
  const disabledDate = (date, info) => {
    if (vietnamCalendarDate(date).isBefore(vietnamInput().startOf('day'))) return true;
    return Boolean(info.from) && Math.abs(date.diff(info.from, 'day')) > data.freezeDaysLeft;
  };
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      onFinish={(values) => {
        if (!disabled) mutation.mutate(values, { onSuccess: () => form.resetFields() });
      }}
    >
      <Form.Item
        name="dates"
        label="Từ ngày / đến ngày (không gồm ngày kết thúc)"
        rules={[{ validator: (_, dates) => validateRange(dates, data, minDays) }]}
      >
        <DatePicker.RangePicker format={DATE_FORMATS.DATE} disabledDate={disabledDate} />
      </Form.Item>
      <Button htmlType="submit" loading={mutation.isPending}>
        Yêu cầu bảo lưu
      </Button>
    </Form>
  );
}

function FreezeStatus({ current, frozen, mutation }) {
  return (
    <Space orientation="vertical">
      <Tag color="warning">
        {frozen ? 'Đang bảo lưu đến' : 'Đã đặt lịch bảo lưu đến'}{' '}
        {formatDate(vietnamInput(current.endAt))}
      </Tag>
      <Popconfirm
        title="Kết thúc bảo lưu? Chỉ cộng số ngày thực tế đã dừng."
        okText="Kết thúc bảo lưu"
        cancelText="Giữ bảo lưu"
        disabled={mutation.isPending}
        onConfirm={() => mutation.mutate({ resume: true })}
      >
        <Button loading={mutation.isPending}>Kết thúc bảo lưu</Button>
      </Popconfirm>
    </Space>
  );
}

function FreezeContent({ data, query, mutation, minDays }) {
  const freezes = Array.isArray(data.freezes) ? data.freezes : [];
  const current = freezes.find((freeze) => !freeze.endedAt);
  const ready = hasBudget(data) && Number.isSafeInteger(minDays) && minDays > 0;
  const disabled = freezeFormDisabled({ data, query, mutation, minDays, ready });
  return (
    <Space orientation="vertical" className="scms-full-width">
      {hasBudget(data) && (
        <Alert
          showIcon
          type="info"
          title={`Đã bảo lưu ${data.freezeDaysUsed} / ${data.freezeDaysUsed + data.freezeDaysLeft} ngày`}
          description={`Còn ${data.freezeDaysLeft} ngày. Kết thúc sớm chỉ cộng ngày thực dừng; không thay đổi lịch khóa học.`}
        />
      )}
      {!ready && (
        <Alert
          showIcon
          type="warning"
          title="Chưa tải đủ giới hạn bảo lưu. Vui lòng thử lại trước khi chọn khoảng nghỉ."
        />
      )}
      {current ? (
        <FreezeStatus current={current} frozen={data.status === 'FROZEN'} mutation={mutation} />
      ) : (
        <FreezeForm data={data} minDays={minDays} mutation={mutation} disabled={disabled} />
      )}
      {mutation.isError && <Alert showIcon type="error" title={mutation.error.message} />}
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={freezes}
        columns={HISTORY_COLUMNS}
        scroll={{ x: true }}
        locale={{ emptyText: 'Chưa có lịch sử bảo lưu' }}
      />
    </Space>
  );
}

/** GY-41: minDays lấy từ policy live của caller/BE, không dùng giá trị seed làm cấu hình hiện hành. */
export function FreezeControls({ membership, own = false, policy }) {
  const { can } = usePermission();
  const allowed = can(own ? P.MEMBERSHIP_FREEZE_SELF : P.MEMBERSHIP_FREEZE_ALL);
  const query = useFreezeRecord(membership, allowed);
  const mutation = useFreezeMutation(membership?.id);
  if (!membership || !allowed) return null;
  if (query.isPending) return <Alert type="info" title="Đang tải bảo lưu…" />;
  if (query.isError)
    return (
      <Alert
        type="error"
        title={query.error.message}
        action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  const data = query.data?.data;
  if (!data) return <Alert type="warning" title="Không tìm thấy kỳ gói" />;
  return (
    <FreezeContent
      key={data.id}
      data={data}
      query={query}
      mutation={mutation}
      minDays={resolveMinDays(policy, data)}
    />
  );
}
