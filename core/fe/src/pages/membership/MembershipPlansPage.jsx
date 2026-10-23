import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentPlanPeriod } from '@/services/membershipPlan.service';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';
import { PlusOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { FreezeControls } from './FreezeControls';
import { CurrentMembershipCard } from './CurrentMembershipCard';
import { MembershipPlanFormModal } from './MembershipPlanFormModal';
import { PlanGrid } from './MembershipCards';

const PlansContent = ({ plansQuery, plans, mutations, onPurchase }) => {
  if (plansQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Chưa tải được danh sách gói tập"
        action={<Button onClick={() => plansQuery.refetch()}>Thử lại</Button>}
      />
    );
  }
  if (plans.length === 0 && !plansQuery.isPending) {
    return (
      <Card variant="borderless" className="scms-empty-card">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary" style={{ fontSize: 15 }}>
              Chưa có gói tập nào được mở bán.
            </Typography.Text>
          }
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }
  return (
    <PlanGrid
      plans={plans}
      canPurchase={mutations.canPurchase}
      pendingInvoiceByPlanId={mutations.pendingInvoiceByPlanId}
      onPurchase={onPurchase}
      isRenewal={mutations.ownMembership?.status === 'ACTIVE'}
      onContinuePayment={mutations.continuePayment}
      onEdit={mutations.canUpdate ? mutations.openEdit : null}
      onDelete={mutations.canDelete ? mutations.confirmDelete : null}
    />
  );
};

function MembershipHeader({ canPurchase, onCreate }) {
  return (
    <PageHeader
      title="Gói tập"
      subtitle={
        canPurchase
          ? 'Chọn gói tập phù hợp. Xem khung giờ, khu vực và ngày hiệu lực trước khi thanh toán.'
          : 'Quản lý danh mục gói tập đang mở bán (khung giờ, khu vực, giá, thời hạn).'
      }
      extra={
        <PermissionGate permission={PERMISSIONS.MEMBERSHIP_PLAN_CREATE}>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onCreate}>
            Thêm gói mới
          </Button>
        </PermissionGate>
      }
    />
  );
}

function MembershipContent({ hooks, periodQuery, currentMembership, onPurchase }) {
  return (
    <div className="scms-membership-content">
      {periodQuery.isError && (
        <Alert
          type="error"
          showIcon
          title="Chưa tải được kỳ gói tập"
          description={periodQuery.error.message}
          action={<Button onClick={() => periodQuery.refetch()}>Thử lại</Button>}
        />
      )}
      <CurrentMembershipCard membership={currentMembership} canPurchase={hooks.canPurchase} />
      <FreezeControls membership={currentMembership} own />
      <div className="scms-membership-catalog-heading">
        <Typography.Title level={3}>Danh mục gói tập</Typography.Title>
        <Typography.Text type="secondary">
          Mỗi lần mua là một kỳ riêng; kỳ mới nối sau kỳ đã mua khi còn hạn. Học phí khóa học được
          thanh toán riêng.
        </Typography.Text>
      </div>
      <PlansContent
        plansQuery={hooks.plansQuery}
        plans={hooks.plans}
        mutations={hooks}
        onPurchase={onPurchase}
      />
      {hooks.plansQuery.isPending && (
        <Row gutter={[32, 32]} align="stretch" style={{ marginTop: 32 }}>
          {[1, 2, 3].map((item) => (
            <Col key={item} xs={24} md={12} lg={8}>
              <Card loading variant="borderless" className="scms-plan-card" />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

function MembershipModals({
  hooks,
  purchasePlan,
  currentMembership,
  periodQuery,
  onClosePurchase,
}) {
  return (
    <>
      <PurchaseConfirmModal
        plan={purchasePlan}
        current={currentMembership}
        query={periodQuery}
        mutation={hooks.purchaseMutation}
        onClose={onClosePurchase}
      />
      <MembershipPlanFormModal
        open={hooks.formOpen}
        plan={hooks.editingPlan}
        loading={hooks.saveMutation.isPending}
        onClose={hooks.closeForm}
        onSubmit={(values) => hooks.saveMutation.mutate({ plan: hooks.editingPlan, values })}
      />
    </>
  );
}

/** Trang bảng giá gói tập dành cho hội viên và quản lý. */
export default function MembershipPlansPage() {
  const hooks = useMembershipPlans();
  const { user } = useAuth();
  const [purchasePlan, setPurchasePlan] = useState(null);
  const periodQuery = useQuery({
    queryKey: ['ownMembership', 'periods', user?.id],
    queryFn: getCurrentPlanPeriod,
    enabled: hooks.canPurchase,
  });
  const currentMembership = periodQuery.data?.data;

  return (
    <div className="scms-page-enter scms-membership-page">
      <MembershipHeader canPurchase={hooks.canPurchase} onCreate={hooks.openCreate} />
      <MembershipContent
        hooks={hooks}
        periodQuery={periodQuery}
        currentMembership={currentMembership}
        onPurchase={setPurchasePlan}
      />
      <MembershipModals
        hooks={hooks}
        purchasePlan={purchasePlan}
        currentMembership={currentMembership}
        periodQuery={periodQuery}
        onClosePurchase={() => setPurchasePlan(null)}
      />
    </div>
  );
}
