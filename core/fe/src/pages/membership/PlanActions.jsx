import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { INVOICE_CHANNEL } from '@/constants';

/** Hoá đơn tại quầy không có QR: hội viên thanh toán với lễ tân thay vì mở trang chuyển khoản. */
const CounterPendingNote = ({ invoice }) => (
  <span className="scms-plan-card__pending">
    <ShopOutlined /> Có hóa đơn tại quầy {invoice.code} chờ thu — thanh toán tại quầy lễ tân
  </span>
);

const PurchaseAction = ({
  plan,
  featured,
  pendingInvoice,
  onPurchase,
  onContinuePayment,
  isRenewal,
}) => {
  if (!onPurchase || !plan.isActive) return null;
  if (pendingInvoice?.channel === INVOICE_CHANNEL.COUNTER)
    return <CounterPendingNote invoice={pendingInvoice} />;
  return (
    <>
      {pendingInvoice && (
        <span className="scms-plan-card__pending">
          <ClockCircleOutlined /> Đã có hóa đơn {pendingInvoice.code} chờ chuyển khoản
        </span>
      )}
      <Button
        type={featured ? 'primary' : 'default'}
        icon={pendingInvoice ? <ClockCircleOutlined /> : <ShoppingCartOutlined />}
        onClick={() => (pendingInvoice ? onContinuePayment(pendingInvoice) : onPurchase(plan))}
      >
        {pendingInvoice ? 'Tiếp tục thanh toán' : isRenewal ? 'Gia hạn' : 'Chọn gói này'}
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
  isRenewal,
  pendingInvoice,
  onPurchase,
  onContinuePayment,
  onEdit,
  onDelete,
}) => (
  <div className="scms-plan-card__actions">
    <PurchaseAction
      isRenewal={isRenewal}
      plan={plan}
      featured={featured}
      pendingInvoice={pendingInvoice}
      onPurchase={canPurchase ? onPurchase : null}
      onContinuePayment={onContinuePayment}
    />
    <ManageActions plan={plan} onEdit={onEdit} onDelete={onDelete} />
  </div>
);
