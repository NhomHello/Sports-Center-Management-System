import { useState } from 'react';
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

/** Trang bảng giá gói tập: Tông màu chủ đạo ấn tượng, hiện đại */
export default function MembershipPlansPage() {
  const hooks = useMembershipPlans();
  const [purchasePlan, setPurchasePlan] = useState(null);
  const currentMembership = hooks.ownMembership;

  return (
    <div className="scms-page-enter">
      <PageHeader
        title="Gói tự tập"
        subtitle={
          hooks.canPurchase
            ? 'Gói tự tập theo thời hạn, khung giờ và khu vực. Lớp học có học phí riêng ở mục Lịch tập.'
            : 'Quản lý danh mục gói tự tập đang mở bán (khung giờ, khu vực, giá, thời hạn).'
        }
        extra={
          <PermissionGate permission={PERMISSIONS.MEMBERSHIP_PLAN_CREATE}>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={hooks.openCreate}>
              Thêm gói mới
            </Button>
          </PermissionGate>
        }
      />

      <div>
        <CurrentMembershipCard
          membership={currentMembership}
          canPurchase={hooks.canPurchase}
          onChanged={() => hooks.ownMembershipQuery.refetch()}
        />
        <FreezeControls membership={currentMembership} own />

        <PlansContent
          plansQuery={hooks.plansQuery}
          plans={hooks.plans}
          mutations={hooks}
          onPurchase={setPurchasePlan}
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

      <PurchaseConfirmModal
        plan={purchasePlan}
        current={currentMembership}
        query={hooks.ownMembershipQuery}
        mutation={hooks.purchaseMutation}
        onClose={() => setPurchasePlan(null)}
      />
      <MembershipPlanFormModal
        open={hooks.formOpen}
        plan={hooks.editingPlan}
        loading={hooks.saveMutation.isPending}
        onClose={hooks.closeForm}
        onSubmit={(values) => hooks.saveMutation.mutate({ plan: hooks.editingPlan, values })}
      />
    </div>
  );
}
