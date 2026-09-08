/**
 * Root providers: React Query -> antd ConfigProvider (locale + theme) -> antd App (message/modal) -> Router.
 * Thu tu nay quan trong: App.useApp() chi dung duoc ben trong <App>.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { queryClient } from '@/config/queryClient';
import { AppRouter } from '@/router/AppRouter';
import { theme } from '@/theme/theme';

dayjs.locale('vi');

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={theme}>
        <AntdApp>
          <AppRouter />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
