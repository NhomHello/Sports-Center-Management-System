import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Popconfirm } from 'antd';
import { INVOICE_CHANNEL, QUERY_KEYS, ROUTES } from '@/constants';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { createCourseOrder } from '@/services/courseOrder.service';
import { formatDateTime } from '@/utils/format';
import { CourseOrderPrice } from './CourseOrderPrice';
import { CourseOrderCashModal } from './CourseOrderCashModal';
const PENDING_PAYMENT = 'PENDING_PAYMENT';
const TICK_MS = 1000;

function useCourseHold(enrollment) {
  const client = useQueryClient();
  const [now, setNow] = useState(Date.now);

  const expiresAt = enrollment?.holdExpiresAt;
  const expires = new Date(expiresAt).getTime();
  const pending = enrollment?.status === PENDING_PAYMENT;
  const held = pending && expires > now;

  useEffect(() => {
    if (!pending || !expiresAt) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= expires) {
        clearInterval(timer);
        client.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [pending, expiresAt, expires, client]);
  return { held, expiresAt, expired: pending && expires <= now };
}

/** Giữ chỗ đến hạn BE trả; hết hạn làm mới lớp để server kiểm tra lại điều kiện. */
export function CourseOrderActions({ item, memberId, allowed, compact = false }) {
  const navigate = useNavigate();
  const [cashId, setCashId] = useState(null);
  const enrollment = item.enrollment;
  const { held, expiresAt, expired } = useCourseHold(enrollment);
  const canOrder = item.canEnroll || expired;
  const openInvoice = (id) =>
    memberId ? setCashId(id) : navigate(`${ROUTES.PAYMENTS}?invoice=${id}`);
  const mutation = useScheduleMutation(
    () =>
      createCourseOrder(item.id, {
        ...(memberId ? { memberId } : {}),
        channel: memberId ? INVOICE_CHANNEL.COUNTER : INVOICE_CHANNEL.ONLINE,
      }),
    ({ data }) => openInvoice(data.id),
  );
  if (!allowed) return null;
  return (
    <>
      {held ? (
        <>
          {!compact && (
            <p className="scms-booking-note scms-booking-note--waitlist">
              Chờ thanh toán đến {formatDateTime(expiresAt)}.
            </p>
          )}
          <Button
            type="primary"
            onClick={() => openInvoice(enrollment.invoiceId)}
            disabled={!enrollment.invoiceId}
          >
            Thanh toán
          </Button>
        </>
      ) : (
        <Popconfirm
          title="Xác nhận đăng ký khóa học"
          description={<CourseOrderPrice item={item} />}
          okText="Tạo hóa đơn"
          cancelText="Hủy"
          onConfirm={() => mutation.mutateAsync()}
          disabled={!canOrder || mutation.isPending}
        >
          <Button type="primary" disabled={!canOrder} loading={mutation.isPending}>
            {memberId ? 'Đăng ký hộ' : 'Đăng ký khóa học'}
          </Button>
        </Popconfirm>
      )}
      {mutation.isError && <Alert type="error" title={mutation.error.message} />}
      {cashId && <CourseOrderCashModal invoiceId={cashId} onClose={() => setCashId(null)} />}
    </>
  );
}
