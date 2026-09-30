import { PERMISSIONS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { QUERY_KEYS, ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as membershipPlanService from '@/services/membershipPlan.service';
import * as membershipService from '@/services/membership.service';

const PLAN_PAGE_SIZE = 50;

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
    onSuccess: ({ data, message: text }) => { message.success(text); navigate(`${ROUTES.PAYMENTS}?invoice=${data.id}`); },
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
  const [editingPlan, setEditingPlan] = useState(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const canManage = can(PERMISSIONS.MEMBERSHIP_PLAN_CREATE, PERMISSIONS.MEMBERSHIP_PLAN_UPDATE);
  const canPurchase = can(PERMISSIONS.MEMBERSHIP_PURCHASE);
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
  
  const ownMembershipQuery = useQuery({
    queryKey: ['ownMembership'],
    queryFn: membershipService.listOwnMemberships,
    enabled: canPurchase,
  });

  const plans = useMemo(() => plansQuery.data?.data ?? [], [plansQuery.data]);
  const ownMemberships = useMemo(() => ownMembershipQuery.data?.data ?? [], [ownMembershipQuery.data]);
  
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
    ownMembershipQuery,
    ownMemberships,
    editingPlan,
    formOpen,
    canPurchase,
    canUpdate,
    canDelete,
    openCreate,
    openEdit,
    closeForm,
    ...mutations,
  };
}
