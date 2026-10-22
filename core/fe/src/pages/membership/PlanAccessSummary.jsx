import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';
/** Hiển thị khung giờ và khu vực được sử dụng theo API. */
export function PlanAccessSummary({ plan }) {
  return (
    <Space orientation="vertical" size="small" className="scms-plan-access">
      <div>
        <ClockCircleOutlined className="scms-plan-access__icon" />
        <Typography.Text strong> Khung giờ sử dụng: </Typography.Text>
        {plan.frames?.length
          ? plan.frames.map((f) => (
              <Tag key={f.id}>
                {f.name} {f.startTime}–{f.endTime}
              </Tag>
            ))
          : 'Liên hệ trung tâm'}
      </div>
      <div>
        <EnvironmentOutlined className="scms-plan-access__icon" />
        <Typography.Text strong> Khu vực sử dụng: </Typography.Text>
        {plan.areas?.length
          ? plan.areas.map((a) => <Tag key={a.id}>{a.name}</Tag>)
          : 'Liên hệ trung tâm'}
      </div>
      <Typography.Text type="secondary">
        Check-in theo khung giờ và khu vực được cấp. Khóa học có đăng ký riêng.
      </Typography.Text>
    </Space>
  );
}
