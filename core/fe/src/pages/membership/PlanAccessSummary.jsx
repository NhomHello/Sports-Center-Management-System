import { Space, Tag, Typography } from 'antd';
/** Hiển thị khung giờ và khu vực được sử dụng theo API. */
export function PlanAccessSummary({ plan }) {
  return (
    <Space orientation="vertical" size="small" className="scms-plan-access">
      <div>
        <Typography.Text strong>Khung giờ: </Typography.Text>
        {plan.frames?.length
          ? plan.frames.map((f) => (
              <Tag key={f.id}>
                {f.name} {f.startTime}–{f.endTime}
              </Tag>
            ))
          : 'Chưa có thông tin khung giờ'}
      </div>
      <div>
        <Typography.Text strong>Khu vực: </Typography.Text>
        {plan.areas?.length
          ? plan.areas.map((a) => <Tag key={a.id}>{a.name}</Tag>)
          : 'Chưa có thông tin khu vực'}
      </div>
      <Typography.Text type="secondary">Không cần đặt chỗ – check-in tại quầy</Typography.Text>
    </Space>
  );
}
