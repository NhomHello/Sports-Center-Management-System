import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Tooltip } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { getReconciliationSummary } from '@/services/sprint3.service';

const POLL_INTERVAL_MS = 30000;
/** BR-PAY-18: cảnh báo cao cho chuyển hai lần, liên kết trực tiếp đến phiếu cần xử lý. */
export function ReconciliationBadge() {
  const { can } = usePermission();
  const enabled = can(PERMISSIONS.PAYMENT_RECONCILE);
  const query = useQuery({
    queryKey: ['reconciliationSummary'],
    queryFn: getReconciliationSummary,
    enabled,
    refetchInterval: POLL_INTERVAL_MS,
  });
  if (!enabled) return null;
  const summary = query.data?.data;
  return (
    <Tooltip
      title={`Chuyển hai lần: ${summary?.duplicate ?? 0}; phiếu quá hạn: ${summary?.overdue ?? 0}`}
    >
      <Link to={ROUTES.RECONCILIATION}>
        <Badge count={summary?.duplicate ?? 0}>
          <Button danger={Boolean(summary?.duplicate)} aria-label="Xem cảnh báo đối soát">
            Đối soát
          </Button>
        </Badge>
      </Link>
    </Tooltip>
  );
}
