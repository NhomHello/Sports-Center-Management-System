import { SyncOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PERMISSIONS as P } from '@scms/shared';
import { App, Button, DatePicker, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { DATE_FORMATS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { syncSepay } from '@/services/reconciliation.service';

const summarize = ({ fetched, processed }) => {
  const parts = Object.entries(processed ?? {}).map(([status, count]) => `${status}: ${count}`);
  return `Đã lấy ${fetched} giao dịch từ SePay${parts.length ? ` (${parts.join(', ')})` : ''}.`;
};

/** UC-PAY-14: kéo giao dịch SePay bị lỡ webhook; bấm nhiều lần an toàn vì xử lý theo id giao dịch. */
export function SepaySyncButton() {
  const { can } = usePermission();
  const { message } = App.useApp();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(() => [dayjs().startOf('day'), dayjs()]);
  const sync = useMutation({
    mutationFn: () => syncSepay(range[0].toISOString(), range[1].toISOString()),
    onSuccess: (res) => {
      message.success(summarize(res.data ?? {}));
      setOpen(false);
      client.invalidateQueries({ queryKey: ['reconciliation'] });
      client.invalidateQueries({ queryKey: ['reconciliationSummary'] });
    },
    onError: (error) => message.error(error.message),
  });
  if (!can(P.PAYMENT_RECONCILE)) return null;
  return (
    <>
      <Button icon={<SyncOutlined />} onClick={() => setOpen(true)}>
        Đồng bộ từ SePay
      </Button>
      <Modal
        open={open}
        title="Đồng bộ giao dịch từ SePay"
        okText="Đồng bộ"
        cancelText="Đóng"
        confirmLoading={sync.isPending}
        okButtonProps={{ disabled: !range?.[0] || !range?.[1] }}
        onOk={() => sync.mutate()}
        onCancel={() => setOpen(false)}
      >
        <Typography.Paragraph type="secondary">
          Dùng khi hội viên báo đã chuyển khoản nhưng hệ thống chưa nhận webhook. Giao dịch đã xử lý
          sẽ được bỏ qua.
        </Typography.Paragraph>
        <DatePicker.RangePicker
          showTime
          className="scms-full-width"
          format={DATE_FORMATS.DATE_TIME}
          value={range}
          onChange={setRange}
        />
      </Modal>
    </>
  );
}
