import { CheckOutlined, EditOutlined, ShoppingCartOutlined, CreditCardFilled, ThunderboltFilled } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Space, Tag, Typography } from 'antd';
import { formatCurrency } from '@/utils/format';

export const PlanActions = ({ plan, featured, canPurchase, onPurchase, onEdit, onDelete }) => (
  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 24 }}>
    {canPurchase && plan.isActive && (
      <Button 
        type={featured ? 'primary' : 'default'} 
        icon={<ShoppingCartOutlined />} 
        onClick={() => onPurchase(plan)}
        style={{ flex: 1, borderRadius: 8, fontWeight: 600, height: 44, ...(featured ? { boxShadow: '0 4px 12px rgba(22,119,255,0.3)' } : {}) }}
      >
        Mua gói này
      </Button>
    )}
    {(onEdit || onDelete) && (
      <Space className="scms-plan-card__manage">
        {onEdit && (
          <Button shape="circle" style={{ background: '#f5f5f5', border: 'none', color: '#1677ff' }} icon={<EditOutlined />} onClick={() => onEdit(plan)} />
        )}
        {onDelete && (
          <Button shape="circle" danger type="text" icon={<EditOutlined />} onClick={() => onDelete(plan)} />
        )}
      </Space>
    )}
  </div>
);

export const PlanBenefits = ({ benefits }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    {benefits.map((benefit, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
        <CheckOutlined style={{ color: '#1677ff', marginRight: 12, marginTop: 4, fontSize: 16 }} />
        <Typography.Text style={{ fontSize: 15, color: '#595959' }}>{benefit}</Typography.Text>
      </div>
    ))}
  </Space>
);

export const PlanCard = ({ plan, featured, canPurchase, onPurchase, onEdit, onDelete }) => {
  return (
    <Card 
      bordered={false}
      hoverable 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRadius: 16, 
        boxShadow: featured ? '0 12px 32px rgba(22,119,255,0.15)' : '0 4px 16px rgba(0,0,0,0.04)',
        border: featured ? '2px solid #1677ff' : '2px solid transparent',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)'
      }}
      bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '32px' }}
    >
      {featured && (
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', background: '#1677ff', color: '#fff', padding: '4px 16px', borderRadius: 20, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(22,119,255,0.4)' }}>
          <ThunderboltFilled /> PHỔ BIẾN NHẤT
        </div>
      )}

      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <Typography.Title level={3} style={{ margin: 0, color: '#1f1f1f', fontWeight: 800 }}>
          {plan.name}
        </Typography.Title>
        <Tag bordered={false} style={{ background: '#e6f4ff', color: '#1677ff', margin: 0, fontWeight: 700, borderRadius: 6, padding: '4px 8px' }}>
          {plan.code}
        </Tag>
      </Flex>
      
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'baseline' }}>
        <Typography.Title level={1} style={{ color: '#1677ff', margin: 0, fontWeight: 800 }}>
          {formatCurrency(plan.price)}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16, marginLeft: 8, fontWeight: 500 }}>/ {plan.durationDays} ngày</Typography.Text>
      </div>
      
      <div style={{ borderTop: '1px solid #f0f0f0', margin: '0 0 24px 0' }} />
      
      <div style={{ flex: 1 }}>
        <PlanBenefits benefits={plan.benefits || []} />
        {!plan.isActive && (
          <Tag bordered={false} color="error" style={{ marginTop: 24, fontWeight: 600, padding: '6px 16px', borderRadius: 6 }}>NGỪNG BÁN</Tag>
        )}
      </div>
      
      <PlanActions plan={plan} featured={featured} canPurchase={canPurchase} onPurchase={onPurchase} onEdit={onEdit} onDelete={onDelete} />
    </Card>
  );
};

export const PlanGrid = ({ plans, canPurchase, onPurchase, onEdit, onDelete }) => (
  <Row gutter={[32, 32]} align="stretch">
    {plans.map((plan, index) => (
      <Col key={plan.id} xs={24} md={12} lg={8} style={{ display: 'flex' }}>
        <PlanCard
          plan={plan}
          featured={index === Math.floor(plans.length / 2) && plans.length > 1}
          canPurchase={canPurchase}
          onPurchase={onPurchase}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </Col>
    ))}
  </Row>
);

export const CurrentMembershipCard = ({ membership, canPurchase }) => {
  if (!canPurchase || !membership) return null;
  const start = membership.startDate ? new Date(membership.startDate).toLocaleDateString('vi-VN') : '--';
  const end = membership.endDate ? new Date(membership.endDate).toLocaleDateString('vi-VN') : '--';
  const isActive = membership.status === 'ACTIVE';

  return (
    <Card 
      bordered={false} 
      style={{ 
        marginBottom: 40, 
        borderRadius: 20, 
        background: 'linear-gradient(135deg, #0050b3 0%, #1677ff 100%)',
        color: '#fff',
        boxShadow: '0 12px 24px rgba(22,119,255,0.25)'
      }}
      bodyStyle={{ padding: '32px 40px' }}
    >
      <Row gutter={24} align="middle">
        <Col xs={24} md={16}>
          <Space align="start" size="large">
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: 16, borderRadius: 16, display: 'flex', alignItems: 'center' }}>
              <CreditCardFilled style={{ fontSize: 32, color: '#fff' }} />
            </div>
            <div>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Gói tập của bạn
              </Typography.Text>
              <Typography.Title level={2} style={{ color: '#fff', margin: '4px 0 8px 0', fontWeight: 800 }}>
                {membership.plan?.name}
              </Typography.Title>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
                Mã: {membership.plan?.code}
              </div>
            </div>
          </Space>
        </Col>
        <Col xs={24} md={8} style={{ textAlign: 'right' }}>
          <Space direction="vertical" align="end" size="small">
            <Tag bordered={false} color={isActive ? '#52c41a' : '#faad14'} style={{ fontSize: 14, fontWeight: 700, borderRadius: 20, padding: '6px 16px' }}>
              {isActive ? 'ĐANG KÍCH HOẠT' : 'CHỜ XỬ LÝ'}
            </Tag>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 12, fontWeight: 500 }}>
              {start} — {end}
            </Typography.Text>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};
