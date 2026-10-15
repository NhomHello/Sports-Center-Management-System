import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Space, Statistic } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { listOwnMemberships } from '@/services/membership.service';
import { listInvoices } from '@/services/payment.service';
import { getReport, getReconciliationSummary, getMemberSummary } from '@/services/sprint3.service';
import { vietnamInput } from '@/utils/schedule';
import { formatCurrency } from '@/utils/format';
import { getRemainingMembershipDays } from './dashboardData';

function Widget({ title, query, value, currency }) {
  return (
    <Card size="small" loading={query.isPending}>
      {query.isError ? (
        <Alert type="error" title={query.error.message} />
      ) : (
        <Statistic
          title={title}
          value={value(query.data)}
          formatter={currency ? (v) => formatCurrency(v) : undefined}
        />
      )}
    </Card>
  );
}
/** Chỉ gọi API cho chỉ số có quyền; không suy luận bằng tên vai trò. */
export function DashboardWidgets() {
  const { can } = usePermission();
  const today = vietnamInput(new Date());
  const filters = {
    from: today.startOf('month').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  };
  const own = useQuery({
    queryKey: ['ownMembership'],
    queryFn: listOwnMemberships,
    enabled: can(P.MEMBERSHIP_READ_OWN),
  });
  const invoices = useQuery({
    queryKey: ['invoices', 'pending-widget'],
    queryFn: () => listInvoices({ status: 'PENDING', channel: 'COUNTER', pageSize: 1 }),
    enabled: can(P.INVOICE_READ_ALL),
  });
  const members = useQuery({
    queryKey: ['members', 'active-widget'],
    queryFn: getMemberSummary,
    enabled: can(P.MEMBER_READ),
  });
  const report = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => getReport(filters),
    enabled: can(P.REPORT_VIEW),
  });
  const cases = useQuery({
    queryKey: ['reconciliation-summary'],
    queryFn: getReconciliationSummary,
    enabled: can(P.PAYMENT_RECONCILE),
  });
  return (
    <Space wrap>
      {can(P.MEMBERSHIP_READ_OWN) && (
        <Widget
          title="Số ngày gói còn lại"
          query={own}
          value={(r) => getRemainingMembershipDays(r?.data)}
        />
      )}
      {can(P.INVOICE_READ_ALL) && (
        <Widget
          title="Hóa đơn chờ thu tại quầy"
          query={invoices}
          value={(r) => r?.meta.total || 0}
        />
      )}
      {can(P.MEMBER_READ) && (
        <Widget title="Hội viên hoạt động" query={members} value={(r) => r?.data.active || 0} />
      )}
      {can(P.MEMBER_READ) && (
        <Widget title="Hội viên sắp hết hạn" query={members} value={(r) => r?.data.expiring || 0} />
      )}
      {can(P.REPORT_VIEW) && (
        <Widget
          title="Thực thu tháng này"
          query={report}
          value={(r) => r?.data.net || 0}
          currency
        />
      )}
      {can(P.PAYMENT_RECONCILE) && (
        <Widget title="Phiếu đối soát đang mở" query={cases} value={(r) => r?.data.open || 0} />
      )}
    </Space>
  );
}
