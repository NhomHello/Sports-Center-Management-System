import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Descriptions, Empty, Form, Modal, Select } from 'antd';
import { useState } from 'react';
import { QUERY_KEYS, TABLE, USER_STATUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import * as memberService from '@/services/member.service';
import * as paymentService from '@/services/payment.service';
import {
  getApiAvailabilityNotice,
  getApiOperationErrorMessage,
  shouldRetryApiQuery,
} from '@/utils/apiAvailability';
import { formatCurrency } from '@/utils/format';
import { MembershipEffectPreview } from './MembershipEffectPreview';

function QueryError({ query, resource }) {
  if (!query.isError) return null;
  const notice = getApiAvailabilityNotice(query.error, resource);
  return (
    <Alert showIcon type={notice.type} title={notice.message} description={notice.description} />
  );
}

function CounterInvoiceContent({
  form,
  mutation,
  membersQuery,
  plansQuery,
  plans,
  plan,
  memberId,
  onSearch,
}) {
  return (
    <>
      <Alert
        type="info"
        showIcon
        title="Chọn hội viên và gói tập để tạo hóa đơn."
        style={{ marginBlock: 16 }}
      />
      <QueryError query={membersQuery} resource="Danh sách hội viên" />
      <QueryError query={plansQuery} resource="Danh mục gói đang bán" />
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          title={getApiOperationErrorMessage(mutation.error, 'tạo hóa đơn')}
        />
      )}
      <Form form={form} layout="vertical" onFinish={mutation.mutate} disabled={mutation.isPending}>
        <Form.Item
          name="memberId"
          label="Hội viên"
          rules={[{ required: true, message: 'Chọn hội viên nhận hóa đơn' }]}
        >
          <Select
            showSearch
            filterOption={false}
            onSearch={onSearch}
            loading={membersQuery.isFetching}
            placeholder="Tìm theo tên, email hoặc SĐT"
            options={(membersQuery.data?.data ?? []).map((member) => ({
              value: member.id,
              label: `${member.fullName} · ${member.email || member.phone || member.id}`,
              disabled: member.status !== USER_STATUS.ACTIVE,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="planId"
          label="Gói đang bán"
          rules={[{ required: true, message: 'Chọn gói tập' }]}
        >
          <Select
            loading={plansQuery.isPending}
            options={plans.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Chọn gói tập"
          />
        </Form.Item>
        {
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Giá gói (không thể sửa)">
              {plan ? formatCurrency(plan.price) : 'Chưa chọn gói'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời hạn">
              {plan ? `${plan.durationDays} ngày` : 'Chưa chọn gói'}
            </Descriptions.Item>
          </Descriptions>
        }
        <MembershipEffectPreview memberId={memberId} durationDays={plan?.durationDays} />
        {plansQuery.isSuccess && plans.length === 0 && (
          <Empty description="Chưa có gói đang bán trong danh mục trung tâm." />
        )}
      </Form>
    </>
  );
}

/** S16: chọn hội viên/gói từ API, giá chỉ đọc; không phát sinh membership khi PENDING. */
export function CounterInvoiceModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const planId = Form.useWatch('planId', form);
  const memberId = Form.useWatch('memberId', form);
  const membersQuery = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, 'counter-options', user?.id, search],
    queryFn: () =>
      memberService.listMembers({
        search: search || undefined,
        page: TABLE.DEFAULT_PAGE,
        pageSize: TABLE.DEFAULT_PAGE_SIZE,
      }),
    enabled: open,
    retry: shouldRetryApiQuery,
  });
  const plansQuery = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERSHIP_PLANS, user?.id],
    queryFn: paymentService.listSellingPlans,
    enabled: open,
    retry: shouldRetryApiQuery,
  });
  const plans = plansQuery.data?.data ?? [];
  const plan = plans.find((item) => item.id === planId);
  const mutation = useMutation({
    mutationFn: paymentService.createCounterInvoice,
    onSuccess: ({ data }) => {
      form.resetFields();
      onCreated(data.id);
    },
    onError: (error) => form.setFields(error.toFormFields()),
  });
  return (
    <Modal
      open={open}
      centered
      forceRender
      title="Tạo hóa đơn tại quầy"
      okText="Tạo hóa đơn"
      cancelText="Hủy"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !plan || !memberId || membersQuery.isError || plansQuery.isError }}
      onOk={() => form.submit()}
      onCancel={() => {
        if (!mutation.isPending) {
          form.resetFields();
          mutation.reset();
          onClose();
        }
      }}
    >
      <CounterInvoiceContent
        form={form}
        mutation={mutation}
        membersQuery={membersQuery}
        plansQuery={plansQuery}
        plans={plans}
        plan={plan}
        memberId={memberId}
        onSearch={setSearch}
      />
    </Modal>
  );
}
