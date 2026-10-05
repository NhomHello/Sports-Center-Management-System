import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Form, Modal, Select, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { QUERY_KEYS } from '@/constants';
import * as membershipPlanService from '@/services/membershipPlan.service';
import * as membershipService from '@/services/membership.service';
import * as paymentService from '@/services/payment.service';

const PLAN_PAGE_SIZE = 50;

const InvoiceAlert = ({ invoice }) => (
  <Alert 
    type="info" 
    showIcon 
    message={
      <Space orientation="vertical">
        <Typography.Text strong>Hoá đơn {invoice.code} - {invoice.amount?.toLocaleString('vi-VN')} đ</Typography.Text>
        <Typography.Text>Kiểm tra đã nhận đủ tiền mặt từ hội viên trước khi xác nhận.</Typography.Text>
      </Space>
    } 
  />
);

const PlanSelectForm = ({ form, plansQuery, onSubmit }) => (
  <Form form={form} layout="vertical" onFinish={onSubmit}>
    <Form.Item
      name="planId"
      label="Gói tập"
      rules={[{ required: true, message: 'Vui lòng chọn gói tập' }]}
    >
      <Select
        loading={plansQuery.isPending}
        options={(plansQuery.data?.data ?? []).map((plan) => ({
          value: plan.id,
          label: `${plan.name} - ${plan.price?.toLocaleString('vi-VN')} đ`,
        }))}
        placeholder="Chọn gói đang mở bán"
      />
    </Form.Item>
  </Form>
);

/** Modal để lễ tân tạo hoá đơn mua/gia hạn cho hội viên tại quầy. */
export function MemberMembershipModal({ member, open, onClose }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const client = useQueryClient();
  const [invoice, setInvoice] = useState();

  const plansQuery = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERSHIP_PLANS, 'active-for-counter'],
    queryFn: () => membershipPlanService.listMembershipPlans({ page: 1, pageSize: PLAN_PAGE_SIZE, isActive: true }),
    enabled: open,
  });

  const orderMutation = useMutation({
    mutationFn: ({ planId }) => membershipService.createMemberOrder({ memberId: member.id, planId }),
    onSuccess: ({ data, message: text }) => { 
      message.success(text || 'Tạo đơn hàng thành công'); 
      setInvoice(data); 
    },
    onError: (error) => message.error(error.message || 'Lỗi khi tạo đơn hàng'),
  });

  const collectMutation = useMutation({
    mutationFn: paymentService.collectCash,
    onSuccess: () => { 
      message.success('Đã thu tiền và kích hoạt gói hội viên'); 
      client.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS }); 
      handleClose(); 
    },
    onError: (error) => message.error(error.message || 'Lỗi khi thu tiền'),
  });

  const handleClose = () => { 
    setInvoice(undefined); 
    onClose(); 
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [form, open]);

  return (
    <Modal
      open={open}
      centered
      title={`Mua / gia hạn gói cho ${member?.fullName ?? ''}`}
      okText={invoice ? 'Xác nhận đã thu tiền' : 'Tạo hoá đơn'}
      cancelText="Huỷ"
      confirmLoading={orderMutation.isPending || collectMutation.isPending}
      onOk={invoice ? () => collectMutation.mutate(invoice.id) : form.submit}
      onCancel={handleClose}
      destroyOnHidden
    >
      {invoice ? (
        <InvoiceAlert invoice={invoice} />
      ) : (
        <PlanSelectForm form={form} plansQuery={plansQuery} onSubmit={orderMutation.mutate} />
      )}
    </Modal>
  );
}
