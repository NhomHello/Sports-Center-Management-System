import { Flex, Typography } from 'antd';
import { SPACING } from '@/theme/theme';

/**
 * Tieu de trang + nut hanh dong ben phai. Dung o dau MOI trang.
 * @param {{ title: string, subtitle?: string, extra?: import('react').ReactNode }} props
 */
export function PageHeader({ title, subtitle, extra }) {
  return (
    <Flex
      justify="space-between"
      align="center"
      wrap
      gap={SPACING.SM}
      style={{ marginBottom: SPACING.MD }}
    >
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      {extra && <Flex gap={SPACING.SM}>{extra}</Flex>}
    </Flex>
  );
}
