import { useQuery } from '@tanstack/react-query';
import { Card, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { getOwnAttendance } from '@/services/sprint3.service';
import { AttendanceFilters } from './AttendanceFilters';
import { AttendanceEmpty, AttendanceHistoryTable } from './AttendanceHistoryTable';
import { QueryState } from '../schedule/QueryState';
import './attendanceHistory.css';

/** Lịch sử chỉ đọc của người dùng hiện tại. */
export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const table = useTableQuery();
  const query = useQuery({
    queryKey: ['attendance-own', user?.id, table.params],
    queryFn: () => getOwnAttendance(table.params),
  });
  const rows = query.data?.data ?? [];
  const total = query.data?.meta?.total;
  const hasFilters = Object.values(table.filters).some(
    (value) => value !== undefined && value !== null,
  );
  const resetFilters = () =>
    table.setFilters({ from: undefined, to: undefined, classId: undefined, status: undefined });

  return (
    <>
      <PageHeader
        title="Lịch sử điểm danh"
        subtitle="Tra cứu kết quả điểm danh theo buổi học. Thời gian hiển thị theo giờ Việt Nam."
      />
      <Card className="scms-attendance-history" variant="borderless">
        <div className="scms-attendance-history__toolbar">
          <AttendanceFilters
            filters={table.filters}
            onChange={table.setFilters}
            onReset={resetFilters}
            hasFilters={hasFilters}
          />
        </div>
        <div className="scms-attendance-history__heading" aria-live="polite">
          <Typography.Text strong>Kết quả điểm danh</Typography.Text>
          {typeof total === 'number' && (
            <Typography.Text className="scms-attendance-history__count">
              {total} bản ghi
            </Typography.Text>
          )}
        </div>
        <QueryState query={query}>
          {rows.length ? (
            <AttendanceHistoryTable
              className="scms-attendance-history__table"
              rowKey="id"
              dataSource={rows}
              loading={query.isFetching}
              pagination={table.paginationProps(query.data?.meta)}
              onChange={table.onTableChange}
              scroll={{ x: 760 }}
            />
          ) : (
            <AttendanceEmpty filtered={hasFilters} onReset={resetFilters} />
          )}
        </QueryState>
      </Card>
    </>
  );
}
