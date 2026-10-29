import { useState } from 'react';
import { Card, Empty } from 'antd';
import { REPORT_CHART as C } from '@/constants/reports';
import { formatCurrency } from '@/utils/format';
const moneySeries = [
  { key: 'revenue', label: 'Thu', className: 'report-series-income' },
  { key: 'refunded', label: 'Hoàn', className: 'report-series-refund' },
  { key: 'net', label: 'Thuần', className: 'report-series-net' },
];
const memberSeries = [
  { key: 'newMembers', label: 'Hội viên mới', className: 'report-series-income' },
  { key: 'newEnrollments', label: 'Đăng ký mới', className: 'report-series-net' },
];
/** Biểu đồ cột hỗ trợ thuần âm, hover/focus đọc số cụ thể; bảng bên dưới luôn có đủ dữ liệu. */
export function ReportChart({ rows, members = false }) {
  const [selected, setSelected] = useState(null);
  const series = members ? memberSeries : moneySeries;
  if (!rows.length)
    return (
      <Card title="Theo kỳ">
        <Empty description="Không có dữ liệu" />
      </Card>
    );
  const values = rows.flatMap((row) => series.map((s) => row[s.key]));
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const width = Math.max(C.minWidth, rows.length * C.groupWidth);
  const plotHeight = C.height - C.top - C.bottom;
  const y = (value) => C.top + ((max - value) / (max - min)) * plotHeight;
  const active = rows.find((row) => row.date === selected) ?? rows[0];
  const format = members ? (v) => String(v) : formatCurrency;
  return (
    <Card title={members ? 'Hội viên và đăng ký theo kỳ' : 'Thu – hoàn – thuần theo kỳ'}>
      <figure className="scms-report-figure">
        <div className="scms-report-legend">
          {series.map((s) => (
            <span key={s.key}>
              <i className={s.className} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="scms-report-chart-scroll">
          <svg
            width={width}
            height={C.height}
            role="img"
            aria-label="Biểu đồ cột theo kỳ, dùng phím Tab để xem số liệu từng kỳ"
          >
            <line x1="0" x2={width} y1={y(0)} y2={y(0)} className="report-zero-line" />
            {rows.map((row, i) => (
              <g
                key={row.date}
                tabIndex={0}
                aria-label={`${row.date}: ${series.map((s) => `${s.label} ${format(row[s.key])}`).join(', ')}`}
                onFocus={() => setSelected(row.date)}
                onMouseEnter={() => setSelected(row.date)}
              >
                <title>
                  {row.date}: {series.map((s) => `${s.label} ${format(row[s.key])}`).join(' · ')}
                </title>
                {series.map((s, index) => (
                  <rect
                    key={s.key}
                    className={s.className}
                    x={i * C.groupWidth + C.padding + index * C.barWidth}
                    y={Math.min(y(row[s.key]), y(0))}
                    width={C.barWidth - 2}
                    height={Math.abs(y(row[s.key]) - y(0))}
                  />
                ))}
                <text
                  x={i * C.groupWidth + C.padding}
                  y={C.height - C.padding}
                  className="report-chart-label"
                >
                  {row.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <figcaption aria-live="polite">
          {active.date} · {series.map((s) => `${s.label}: ${format(active[s.key])}`).join(' · ')}
        </figcaption>
      </figure>
    </Card>
  );
}
