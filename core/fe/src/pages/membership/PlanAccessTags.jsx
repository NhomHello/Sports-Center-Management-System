import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Space, Tag } from 'antd';

/**
 * GY-21: khung giờ và khu vực được vào của gói tự tập. Không chọn = không giới hạn mục đó.
 * @param {{ plan: { frames?: object[], areas?: object[] } }} props
 */
export function PlanAccessTags({ plan }) {
  const frames = plan?.frames ?? [];
  const areas = plan?.areas ?? [];
  return (
    <Space wrap size={[4, 4]}>
      {frames.length ? (
        frames.map((frame) => (
          <Tag key={`f${frame.id}`} icon={<ClockCircleOutlined />} color="blue">
            {frame.name} {frame.startTime}–{frame.endTime}
          </Tag>
        ))
      ) : (
        <Tag icon={<ClockCircleOutlined />}>Mọi khung giờ</Tag>
      )}
      {areas.length ? (
        areas.map((area) => (
          <Tag key={`a${area.id}`} icon={<EnvironmentOutlined />} color="green">
            {area.name}
          </Tag>
        ))
      ) : (
        <Tag icon={<EnvironmentOutlined />}>Mọi khu tự tập</Tag>
      )}
    </Space>
  );
}
