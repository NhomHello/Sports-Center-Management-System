import { Flex, Typography } from 'antd';
import { SPACING } from '@/theme/theme';

/**
 * Tieu de trang + nut hanh dong ben phai. Dung o dau MOI trang.
 * @param {{ title: string, subtitle?: string, extra?: import('react').ReactNode, eyebrow?: string }} props
 */
export function PageHeader({ title, subtitle, extra, eyebrow = 'SPORTS CENTER' }) {
  return (
    <Flex
      className="scms-page-header"
      justify="space-between"
      align="center"
      wrap
      gap={SPACING.SM}
      style={{ marginBottom: SPACING.LG }}
    >
      <div className="scms-page-header__copy">
        <Typography.Text className="scms-page-header__eyebrow">{eyebrow}</Typography.Text>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      {extra && <Flex gap={SPACING.SM}>{extra}</Flex>}
    </Flex>
  );
}
