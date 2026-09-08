import { Flex, Spin } from 'antd';

const FULLSCREEN_STYLE = { minHeight: '100vh' };
const INLINE_STYLE = { minHeight: 240 };

/** Spinner can giua, dung lam fallback cho Suspense / loading trang. */
export function PageLoading({ fullscreen = false }) {
  return (
    <Flex align="center" justify="center" style={fullscreen ? FULLSCREEN_STYLE : INLINE_STYLE}>
      <Spin size="large" />
    </Flex>
  );
}
