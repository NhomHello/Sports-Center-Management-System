import {
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Space, Tag, Tooltip, Typography } from 'antd';
import { formatCurrency } from '@/utils/format';

const getDisplayCode = (plan) =>
  /^[A-Z0-9_]{1,18}$/.test(plan.code ?? '')
    ? plan.code.replaceAll('_', ' ')
    : `GÓI #${String(plan.id).padStart(2, '0')}`;

const PurchaseAction = ({ plan, featured, pendingInvoice, onPurchase, onContinuePayment }) => {
  if (!onPurchase || !plan.isActive) return null;
  return (
    <>
      {pendingInvoice && (
        <span className="scms-plan-card__pending">
          <ClockCircleOutlined /> Đã có hóa đơn {pendingInvoice.code} chờ thanh toán
        </span>
      )}
      <Button
        type={featured ? 'primary' : 'default'}
        icon={pendingInvoice ? <ClockCircleOutlined /> : <ShoppingCartOutlined />}
        onClick={() => (pendingInvoice ? onContinuePayment(pendingInvoice) : onPurchase(plan))}
      >
        {pendingInvoice ? 'Tiếp tục thanh toán' : 'Chọn gói này'}
      </Button>
    </>
  );
};

const ManageActions = ({ plan, onEdit, onDelete }) => {
  if (!onEdit && !onDelete) return null;
  return (
    <Space className="scms-plan-card__manage">
      {onEdit && (
        <Tooltip title="Chỉnh sửa gói tập">
          <Button
            icon={<EditOutlined />}
            aria-label={`Chỉnh sửa ${plan.name}`}
            onClick={() => onEdit(plan)}
          >
            Chỉnh sửa
          </Button>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={plan.isActive ? 'Xóa hoặc ngừng bán' : 'Xóa gói tập'}>
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label={`Xóa hoặc ngừng bán ${plan.name}`}
            onClick={() => onDelete(plan)}
          >
            {plan.isActive ? 'Ngừng bán' : 'Xóa'}
          </Button>
        </Tooltip>
      )}
    </Space>
  );
};

export const PlanActions = ({
  plan,
  featured,
  canPurchase,
  pendingInvoice,
  onPurchase,
  onContinuePayment,
  onEdit,
  onDelete,
}) => (
  <div className="scms-plan-card__actions">
    <PurchaseAction
      plan={plan}
      featured={featured}
      pendingInvoice={pendingInvoice}
      onPurchase={canPurchase ? onPurchase : null}
      onContinuePayment={onContinuePayment}
    />
    <ManageActions plan={plan} onEdit={onEdit} onDelete={onDelete} />
  </div>
);

export const PlanBenefits = ({ benefits, description }) => {
  const items = benefits?.length
    ? benefits
    : [description || 'Liên hệ trung tâm để biết quyền lợi'];
  return (
    <Space className="scms-plan-card__benefits" orientation="vertical" size={12}>
      {items.map((benefit) => (
        <span className="scms-plan-card__benefit" key={benefit}>
          <CheckOutlined className="scms-plan-card__check" />
          <Typography.Text>{benefit}</Typography.Text>
        </span>
      ))}
    </Space>
  );
};

export const PlanCard = ({
  plan,
  featured,
  canPurchase,
  pendingInvoice,
  onPurchase,
  onContinuePayment,
  onEdit,
  onDelete,
}) => (
  <Card
    variant="borderless"
    hoverable
    className={`scms-plan-card${featured ? ' scms-plan-card--featured' : ''}`}
  >
    <Space orientation="vertical" size={20}>
      <Flex className="scms-plan-card__topline" justify="space-between" align="center" gap={12}>
        <span className="scms-plan-card__code">{getDisplayCode(plan)}</span>
        <span className="scms-plan-card__term">{plan.durationDays} NGÀY</span>
      </Flex>
      <div className="scms-plan-card__intro">
        <Typography.Title level={3}>{plan.name}</Typography.Title>
        {plan.description && (
          <Typography.Paragraph className="scms-plan-card__description">
            {plan.description}
          </Typography.Paragraph>
        )}
      </div>
      <PlanActions
        plan={plan}
        featured={featured}
        canPurchase={canPurchase}
        pendingInvoice={pendingInvoice}
        onPurchase={onPurchase}
        onContinuePayment={onContinuePayment}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <div className="scms-plan-card__pricing">
        <Typography.Text className="scms-plan-card__price">
          {formatCurrency(plan.price)}
        </Typography.Text>
        <span className="scms-plan-card__billing">
          / {plan.durationDays} ngày
          <small>Thanh toán một lần</small>
        </span>
      </div>
      <div className="scms-plan-card__rule" />
      <Typography.Text className="scms-plan-card__benefits-title">
        Quyền lợi bao gồm
      </Typography.Text>
      <PlanBenefits benefits={plan.benefits} description={plan.description} />
      {!plan.isActive && <Tag color="error">NGỪNG BÁN</Tag>}
    </Space>
  </Card>
);

export const PlanGrid = ({
  plans,
  canPurchase,
  pendingInvoiceByPlanId,
  onPurchase,
  onContinuePayment,
  onEdit,
  onDelete,
}) => {
  const sortedPlans = [...plans].sort((left, right) => left.price - right.price);
  return (
    <section className="scms-pricing-surface" aria-label="Bảng giá gói tập">
      <Row gutter={[20, 20]} align="stretch">
        {sortedPlans.map((plan, index) => (
          <Col key={plan.id} xs={24} md={12} xl={8} style={{ display: 'flex' }}>
            <PlanCard
              plan={plan}
              featured={index === Math.floor(sortedPlans.length / 2) && sortedPlans.length > 1}
              canPurchase={canPurchase}
              pendingInvoice={pendingInvoiceByPlanId?.get(plan.id)}
              onPurchase={onPurchase}
              onContinuePayment={onContinuePayment}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Col>
        ))}
      </Row>
      <div className="scms-pricing-assurance">
        <SafetyCertificateOutlined />
        Membership chỉ được kích hoạt hoặc gia hạn sau khi hóa đơn thanh toán thành công.
      </div>
    </section>
  );
};
