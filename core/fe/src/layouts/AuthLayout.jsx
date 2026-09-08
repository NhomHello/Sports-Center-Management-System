import { Card, Flex, Typography } from 'antd';
import { Outlet } from 'react-router';
import { env } from '@/config/env';
import { SPACING } from '@/theme/theme';

const CARD_WIDTH = 400;

/** Layout cho trang login/register: card can giua man hinh. */
export function AuthLayout() {
  return (
    <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: SPACING.MD }}>
      <Card style={{ width: '100%', maxWidth: CARD_WIDTH }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginTop: 0 }}>
          {env.APP_NAME}
        </Typography.Title>
        <Outlet />
      </Card>
    </Flex>
  );
}
