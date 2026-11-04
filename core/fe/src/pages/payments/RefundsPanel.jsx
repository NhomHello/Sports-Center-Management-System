import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Alert, App, Form, Input, Modal, Select, Space } from 'antd';
import { useState } from 'react';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listRefunds, completeRefund } from '@/services/sprint3.service';
import { QueryState } from '../schedule/QueryState';
import { RefundHistoryTable } from './RefundHistoryTable';

function RefundFilters({ onChange }) {
  return (
    <Space wrap>
      <Input.Search
        allowClear
        aria-label="Tìm mã hoàn tiền"
        placeholder="Mã hoàn HT…, hóa đơn hoặc hội viên"
        onSearch={(search) => onChange({ search })}
      />
      <Select
        allowClear
        aria-label="Lọc trạng thái hoàn tiền"
        placeholder="Trạng thái"
        style={{ minWidth: 180 }}
        options={[
          { value: 'PENDING', label: 'Chờ chuyển trả' },
          { value: 'DONE', label: 'Đã hoàn tất' },
        ]}
        onChange={(status) => onChange({ status })}
      />
    </Space>
  );
}

/** Tra cứu mã hoàn để admin chuyển trả; hội viên chỉ xem các yêu cầu thuộc chính mình. */
export function RefundList({ own = false }) {
  const table = useTableQuery();
  const client = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();
  const query = useQuery({
    queryKey: ['refunds', own, table.params],
    queryFn: () => listRefunds(table.params, own),
  });
  const { message } = App.useApp();
  const save = useMutation({
    mutationFn: ({ reference }) => completeRefund(selected.id, reference),
    onSuccess: () => {
      message.success('Đã xác nhận chuyển trả cho hội viên');
      setSelected(null);
      client.invalidateQueries({ queryKey: ['refunds'] });
      client.invalidateQueries({ queryKey: ['course-cancellations'] });
    },
  });
  const selectRefund = (row) => {
    save.reset();
    form.resetFields();
    setSelected(row);
  };
  return (
    <>
      <RefundFilters onChange={table.setFilters} />
      <QueryState query={query}>
        <RefundHistoryTable {...{ query, table, own }} onSelect={selectRefund} />
      </QueryState>
      <Modal
        open={Boolean(selected)}
        title={`Xác nhận đã chuyển trả ${selected?.code ?? ''}`}
        onCancel={() => setSelected(null)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        okText="Xác nhận"
        cancelText="Đóng"
      >
        {save.isError && <Alert type="error" title={save.error.message} />}
        <Form form={form} onFinish={save.mutate}>
          <Form.Item
            name="reference"
            label="Mã tham chiếu ngân hàng"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
