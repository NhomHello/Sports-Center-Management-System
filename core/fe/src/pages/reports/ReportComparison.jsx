import { Card, Statistic } from 'antd';
import { formatCurrency } from '@/utils/format';
const percent = (value) =>
  value === null
    ? '—'
    : `${value > 0 ? '+' : ''}${value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`;
/** Server trả null khi kỳ trước bằng 0; UI không tự suy ra % hoặc chia lại doanh thu. */
export function ReportComparison({ comparison }) {
  if (!comparison) return null;
  return (
    <Card title="So với khoảng liền trước cùng số ngày">
      <div className="scms-report-stats">
        {[
          ['revenue', 'Thu'],
          ['refunded', 'Hoàn'],
          ['net', 'Thuần'],
        ].map(([key, label]) => (
          <div key={key}>
            <Statistic
              title={`${label} kỳ trước`}
              value={comparison.previous[key]}
              formatter={formatCurrency}
            />
            <span>{percent(comparison.percent[key])}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
