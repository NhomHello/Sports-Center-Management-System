import { CheckOutlined, SafetyCertificateOutlined, StarFilled } from '@ant-design/icons';
import { Card, Col, Row, Tag, Typography } from 'antd';
import { formatCurrency } from '@/utils/format';
import { computeSavings, pricePerDay } from '@/utils/planPricing';
import { PlanAccessTags } from './PlanAccessTags';
import { PlanActions } from './PlanActions';
import './membershipPlans.css';
import { PlanAccessSummary } from './PlanAccessSummary';

const getDisplayCode = (plan) =>
  /^[A-Z0-9_]{1,18}$/.test(plan.code ?? '')
    ? plan.code.replaceAll('_', ' ')
    : `GÓI #${String(plan.id).padStart(2, '0')}`;

export const PlanBenefits = ({ benefits }) => {
  const items = benefits?.length ? benefits : ['Quyền lợi đang được cập nhật'];
  return (
    <ul className="scms-plan-card__benefits">
      {items.map((benefit) => (
        <li className="scms-plan-card__benefit" key={benefit}>
          <CheckOutlined className="scms-plan-card__check" />
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );
};

export const PlanCard = ({ plan, featured, savingsPercent, ...actions }) => (
  <Card
    variant="borderless"
    className={`scms-plan-card${featured ? ' scms-plan-card--featured' : ''}`}
  >
    {featured && (
      <span className="scms-plan-card__ribbon">
        <StarFilled /> Gói đề xuất
      </span>
    )}
    <div className="scms-plan-card__topline">
      <span className="scms-plan-card__code">{getDisplayCode(plan)}</span>
      {!plan.isActive && <Tag color="error">NGỪNG BÁN</Tag>}
    </div>
    <Typography.Title level={3} className="scms-plan-card__name">
      {plan.name}
    </Typography.Title>
    <Typography.Paragraph className="scms-plan-card__description">
      {plan.description || 'Gói tập dành cho hội viên của trung tâm.'}
    </Typography.Paragraph>
    <div className="scms-plan-card__pricing">
      <span className="scms-plan-card__price">{formatCurrency(plan.price)}</span>
      <span className="scms-plan-card__billing">/ {plan.durationDays} ngày</span>
    </div>
    <div className="scms-plan-card__note">
      <span>{formatCurrency(pricePerDay(plan))} / ngày · thanh toán một lần</span>
      {savingsPercent > 0 && (
        <Tag color="green" className="scms-plan-card__saving">
          Tiết kiệm {savingsPercent}%
        </Tag>
      )}
    </div>
    <PlanAccessTags plan={plan} />
    <div className="scms-plan-card__rule" />
    <Typography.Text className="scms-plan-card__benefits-title">Quyền sử dụng</Typography.Text>
    <PlanAccessSummary plan={plan} />
    <PlanBenefits benefits={plan.benefits} />
    <PlanActions plan={plan} featured={featured} {...actions} />
  </Card>
);

export const PlanGrid = ({ plans, pendingInvoiceByPlanId, ...actions }) => {
  const sortedPlans = [...plans].sort((left, right) => left.price - right.price);
  const savings = computeSavings(sortedPlans);
  const featuredIndex = sortedPlans.length > 1 ? Math.floor(sortedPlans.length / 2) : -1;
  return (
    <section className="scms-pricing-surface" aria-label="Bảng giá gói tập">
      <Row gutter={[24, 24]} align="stretch">
        {sortedPlans.map((plan, index) => (
          <Col key={plan.id} xs={24} md={12} xl={8} className="scms-pricing-col">
            <PlanCard
              plan={plan}
              featured={index === featuredIndex}
              savingsPercent={savings.get(plan.id)}
              pendingInvoice={pendingInvoiceByPlanId?.get(plan.id)}
              {...actions}
            />
          </Col>
        ))}
      </Row>
      <div className="scms-pricing-assurance">
        <SafetyCertificateOutlined />
        Gói tập dùng trong khung giờ và khu vực ghi trên gói, kích hoạt sau khi thanh toán thành
        công. Lớp học bán riêng theo khóa ở mục Lịch tập.
      </div>
    </section>
  );
};
