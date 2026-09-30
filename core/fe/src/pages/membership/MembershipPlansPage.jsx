import { PlusOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { MembershipPlanFormModal } from './MembershipPlanFormModal';
import { CurrentMembershipCard, PlanGrid } from './MembershipCards';

const PlansContent = ({ plansQuery, plans, mutations }) => {
  if (plansQuery.isError) {
    return (
      <Alert type="error" showIcon message="Chưa tải được danh sách gói tập" action={<Button onClick={() => plansQuery.refetch()}>Thử lại</Button>} />
    );
  }
  if (plans.length === 0 && !plansQuery.isPending) {
    return (
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Typography.Text type="secondary" style={{ fontSize: 15 }}>Chưa có gói tập nào được mở bán.</Typography.Text>}
          style={{ padding: '60px 0' }}
        />
      </Card>
    );
  }
  return (
    <PlanGrid
      plans={plans}
      canPurchase={mutations.canPurchase}
      onPurchase={mutations.purchaseMutation.mutate}
      onEdit={mutations.canUpdate ? mutations.openEdit : null}
      onDelete={mutations.canDelete ? mutations.confirmDelete : null}
    />
  );
};

/** Trang bảng giá gói tập: Tông màu chủ đạo ấn tượng, hiện đại */
export default function MembershipPlansPage() {
  const hooks = useMembershipPlans();
  const currentMembership = hooks.ownMemberships?.find((m) => m.status === 'ACTIVE' || m.status === 'PENDING');

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <PageHeader
        title="Bảng Giá Dịch Vụ"
        subtitle="Khám phá các gói tập luyện cao cấp và lựa chọn hành trình phù hợp nhất."
        extra={
          <PermissionGate permission={PERMISSIONS.MEMBERSHIP_PLAN_CREATE}>
            <Button 
              type="primary"
              size="large"
              icon={<PlusOutlined />} 
              onClick={hooks.openCreate}
              style={{ borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}
            >
              Thêm gói mới
            </Button>
          </PermissionGate>
        }
      />

      <div style={{ marginTop: 40 }}>
        <CurrentMembershipCard membership={currentMembership} canPurchase={hooks.canPurchase} />
        
        <PlansContent plansQuery={hooks.plansQuery} plans={hooks.plans} mutations={hooks} />

        {hooks.plansQuery.isPending && (
          <Row gutter={[32, 32]} align="stretch" style={{ marginTop: 32 }}>
            {[1, 2, 3].map((item) => (
              <Col key={item} xs={24} md={12} lg={8}>
                <Card loading bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.04)', height: 400 }} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      <MembershipPlanFormModal
        open={hooks.formOpen}
        plan={hooks.editingPlan}
        loading={hooks.saveMutation.isPending}
        onClose={hooks.closeForm}
        onSubmit={(values) => hooks.saveMutation.mutate({ plan: hooks.editingPlan, values })}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
