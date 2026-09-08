import { Card, Col, Row, Statistic, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { SPACING } from '@/theme/theme';

const COL_SPAN = { xs: 24, sm: 12, lg: 8 };

/**
 * Trang tong quan. Hien tai la placeholder: team Flow 3 thay bang so lieu bao cao that
 * (doanh thu, member moi, goi sap het han, ty le lap day lop) theo quyen REPORT_VIEW.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { permissions } = usePermission();

  return (
    <>
      <PageHeader title="Tổng quan" subtitle={`Xin chào, ${user?.fullName ?? ''}`} />
      <Row gutter={[SPACING.MD, SPACING.MD]}>
        <Col {...COL_SPAN}>
          <Card>
            <Statistic title="Vai trò" value={user?.role?.name ?? '-'} />
          </Card>
        </Col>
        <Col {...COL_SPAN}>
          <Card>
            <Statistic title="Số quyền được cấp" value={permissions.length} />
          </Card>
        </Col>
        <Col {...COL_SPAN}>
          <Card>
            <Typography.Text type="secondary">
              Khu vực này dành cho báo cáo (Flow 3). Xem docs/02-cau-truc-du-an.md để thêm trang.
            </Typography.Text>
          </Card>
        </Col>
      </Row>
    </>
  );
}
