import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { App, Card, ConfigProvider, Space, Typography } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { MemoryRouter, useLocation } from 'react-router';
import { PERMISSIONS as P } from '@scms/shared';
import { MembershipActions } from '../../core/fe/src/pages/membership/MembershipActions';
import { EnrollmentActions } from '../../core/fe/src/pages/schedule/EnrollmentActions';
import { FreezeControls } from '../../core/fe/src/pages/membership/FreezeControls';
import { CreditPanel } from '../../core/fe/src/pages/member/CreditPanel';
import { ApplyCreditButton } from '../../core/fe/src/pages/payments/ApplyCreditButton';
import { ExcuseButton } from '../../core/fe/src/pages/schedule/ExcuseButton';
import { useAuthStore } from '../../core/fe/src/stores/authStore';
import { http } from '../../core/fe/src/services/http';
import { formatCurrency } from '../../core/fe/src/utils/format';
import 'antd/dist/reset.css';

const context = window.__GOPY_CONTEXT__;
const permissions = context.denied
  ? []
  : [P.MEMBERSHIP_PURCHASE, P.CLASS_CANCEL_SELF, P.PAYMENT_READ_OWN, P.MEMBERSHIP_FREEZE_SELF];
useAuthStore.setState({ user: { id: 1 }, permissions, isProfileLoaded: true });
const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function Workspace() {
  const location = useLocation();
  const membership = useQuery({
    queryKey: ['ownMembership', 1],
    queryFn: () => http.get('/memberships/11'),
    enabled: !context.denied,
  });
  const course = useQuery({
    queryKey: ['schedule', 'class', 21],
    queryFn: () => http.get('/classes/21'),
    enabled: !context.denied,
  });
  const invoice = useQuery({
    queryKey: ['invoices', 'detail', 101],
    queryFn: () => http.get('/invoices/101'),
    enabled: !context.denied,
  });
  const period = membership.data?.data ?? context.membership;
  const item = course.data?.data ?? context.course;
  const bill = invoice.data?.data ?? context.invoice;
  return (
    <main style={{ maxWidth: 1100, margin: '32px auto', padding: 24 }}>
      <Typography.Title level={2}>Kiểm thử hợp đồng FE Khôi</Typography.Title>
      <Typography.Paragraph>
        API mô phỏng — không phải nghiệm thu backend hoặc dữ liệu demo thật.
      </Typography.Paragraph>
      <div data-testid="location">
        {location.pathname}
        {location.search}
      </div>
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Card title="Kỳ gói đang dùng">
          <MembershipActions membership={period} />
        </Card>
        <Card title="Khóa học đã đăng ký">
          <EnrollmentActions item={item} />
        </Card>
        <Card title="Buổi học sắp tới">
          <ExcuseButton session={context.session} />
        </Card>
        <CreditPanel />
        <Card title="Hóa đơn mới">
          <p>{bill.status}</p>
          <p>Số tiền còn thiếu: {formatCurrency(bill.paymentInstruction?.amount)}</p>
          <ApplyCreditButton invoice={bill} />
        </Card>
        <Card title="Bảo lưu">
          <FreezeControls membership={period} own />
        </Card>
      </Space>
    </main>
  );
}
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={client}>
    <ConfigProvider locale={viVN}>
      <App>
        <MemoryRouter>
          <Workspace />
        </MemoryRouter>
      </App>
    </ConfigProvider>
  </QueryClientProvider>,
);
