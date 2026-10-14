import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Drawer, Space } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { ACTIVE_CASE_STATUSES, CASE_REASON } from '@/constants/reconciliation';
import * as service from '@/services/reconciliation.service';
import { CaseSummary } from './CaseSummary';
import { CaseConfirmForm } from './CaseConfirmForm';

/** Phiếu đối soát giữ nguyên lịch sử; lỗi xung đột làm mới trạng thái trước khi thử lại. */
export function CaseDrawer({ id, onClose }) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['reconciliation', id],
    queryFn: () => service.getCase(id),
    enabled: Boolean(id),
  });
  const mutation = useMutation({
    mutationFn: ({ action, data }) => service.actOnCase(id, action, data),
    onSuccess: async (res) => {
      message.success(res.message);
      await Promise.all(
        ['reconciliation', 'reconciliationSummary'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      client.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
      client.invalidateQueries({ queryKey: ['ownMembership'] });
    },
    onError: (error) => {
      message.error(error.message);
      query.refetch();
    },
  });
  const item = query.data?.data;
  const active = item && ACTIVE_CASE_STATUSES.includes(item.status);
  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title="Chi tiết phiếu đối soát"
      size="large"
      loading={query.isPending}
    >
      {query.isError && <Alert type="error" title={query.error.message} />}
      {item && (
        <Space orientation="vertical" className="scms-full-width" size="middle">
          <CaseSummary item={item} />
          {active && [CASE_REASON.MEMBER_CLAIM, CASE_REASON.UNDERPAID].includes(item.reason) && (
            <CaseConfirmForm
              key={id}
              pending={mutation.isPending}
              onSubmit={(data) => mutation.mutate({ action: 'confirm', data })}
            />
          )}
        </Space>
      )}
    </Drawer>
  );
}
