import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

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
    <div className="scms-plan-card__manage">
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
    </div>
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
