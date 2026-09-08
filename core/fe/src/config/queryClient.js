import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = 30 * 1000;

/** React Query client dung chung. Cau hinh mac dinh cho moi useQuery. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
