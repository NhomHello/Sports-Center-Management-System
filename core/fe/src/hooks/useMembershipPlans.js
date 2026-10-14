import { PERMISSIONS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { INVOICE_STATUS, QUERY_KEYS, ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import * as membershipPlanService from '@/services/membershipPlan.service';
import * as membershipService from '@/services/membership.service';
import * as paymentService from '@/services/payment.service';

const PLAN_PAGE_SIZE = 50;
const PENDING_INVOICE_PAGE_SIZE = 100;

const listValidPendingInvoices = async () => {
  const response = await paymentService.listInvoices(
    { page: 1, pageSize: PENDING_INVOICE_PAGE_SIZE, status: INVOICE_STATUS.PENDING },
    true,
  );
  const now = Date.now();
  return {
    ...response,
    data: (response.data ?? []).filter(
      (invoice) => !invoice.expiresAt || new Date(invoice.expiresAt).getTime() > now,
    ),
  };
};

const useMemberPlanContext = (canPurchase, userId) => {
  const ownMembershipQuery = useQuery({
    queryKey: ['ownMembership'],
    queryFn: membershipService.listOwnMemberships,
    enabled: canPurchase,
  });
  const pendingInvoicesQuery = useQuery({
    queryKey: [...QUERY_KEYS.INVOICES, 'pending-by-plan', userId],
    queryFn: listValidPendingInvoices,
    enabled: canPurchase,
  });
  const pendingInvoiceByPlanId = useMemo(
    () =>
      new Map((pendingInvoicesQuery.data?.data ?? []).map((invoice) => [invoice.planId, invoice])),
    [pendingInvoicesQuery.data],
  );
  return {
    ownMembershipQuery,
    ownMembership: ownMembershipQuery.data?.data ?? null,
    pendingInvoicesQuery,
    pendingInvoiceByPlanId,
  };
};

const usePlanMutations = ({ setEditingPlan, setFormOpen }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERSHIP_PLANS });
  const saveMutation = useMutation({
    mutationFn: ({ plan, values }) =>
      plan
        ? membershipPlanService.updateMembershipPlan(plan.id, values)
        : membershipPlanService.createMembershipPlan(values),
    onSuccess: ({ message: text }) => {
      message.success(text);
      refresh();
      setFormOpen(false);
      setEditingPlan(undefined);
    },
    onError: (error) => message.error(error.message),
  });
  const purchaseMutation = useMutation({
    mutationFn: (plan) => membershipService.createOwnOrder({ planId: plan.id }),
    onSuccess: ({ data, message: text }) => {
      message.success(text);
      navigate(`${ROUTES.PAYMENTS}?invoice=${data.id}`);
    },
    onError: (error) => message.error(error.message),
  });
  const removeMutation = useMutation({
    mutationFn: (plan) => membershipPlanService.deleteMembershipPlan(plan.id),
    onSuccess: () => {
      message.success('Đã xoá gói tập');
      refresh();
    },
    onError: (error) => message.error(error.message),
  });
  const confirmDelete = (plan) =>
    Modal.confirm({
      centered: true,
      title: `Xoá gói ${plan.name}?`,
      content: 'Gói đã có lịch sử sẽ được ngừng bán để giữ dữ liệu.',
      okText: 'Xoá',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: () => removeMutation.mutateAsync(plan),
    });
  return { saveMutation, purchaseMutation, confirmDelete };
};

/** Quản lý query, quyền và mutation của màn hình gói tập. */
export function useMembershipPlans() {
  const { can } = usePermission();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editingPlan, setEditingPlan] = useState(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const canManage = can(PERMISSIONS.MEMBERSHIP_PLAN_CREATE, PERMISSIONS.MEMBERSHIP_PLAN_UPDATE);
  const canPurchase = can(PERMISSIONS.MEMBERSHIP_PURCHASE) && user?.role?.isDefault === true;
  const canUpdate = can(PERMISSIONS.MEMBERSHIP_PLAN_UPDATE);
  const canDelete = can(PERMISSIONS.MEMBERSHIP_PLAN_DELETE);
  const plansQuery = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERSHIP_PLANS, canManage],
    queryFn: () =>
      membershipPlanService.listMembershipPlans({
        page: 1,
        pageSize: PLAN_PAGE_SIZE,
        isActive: canManage ? undefined : true,
      }),
  });

  const memberContext = useMemberPlanContext(canPurchase, user?.id);

  const plans = useMemo(() => plansQuery.data?.data ?? [], [plansQuery.data]);

  const mutations = usePlanMutations({ setEditingPlan, setFormOpen });
  const openCreate = () => {
    setEditingPlan(undefined);
    setFormOpen(true);
  };
  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditingPlan(undefined);
  };
  return {
    plans,
    plansQuery,
    ...memberContext,
    editingPlan,
    formOpen,
    canPurchase,
    canUpdate,
    canDelete,
    openCreate,
    openEdit,
    closeForm,
    continuePayment: (invoice) => navigate(`${ROUTES.PAYMENTS}?invoice=${invoice.id}`),
    ...mutations,
  };
}
