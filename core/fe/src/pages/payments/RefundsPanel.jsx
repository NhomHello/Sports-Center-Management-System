import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input, Modal, Table } from 'antd';
import { useState } from 'react';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listRefunds, completeRefund } from '@/services/sprint3.service';
import { formatCurrency } from '@/utils/format';
import { QueryState } from '../schedule/QueryState';

/** Có thể tiếp tục xác nhận chuyển trả sau khi đóng modal tạo hoàn tiền. */
/** Danh sách yêu cầu hoàn tiền chờ chuyển trả; trang Hóa đơn hiện ở tab riêng khi có quyền. */
export function RefundList() {
  const table = useTableQuery();
  const client = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();
  const query = useQuery({
    queryKey: ['refunds', table.params],
    queryFn: () => listRefunds(table.params),
  });
  const { message } = App.useApp();
  const save = useMutation({
    mutationFn: ({ reference }) => completeRefund(selected.id, reference),
    onSuccess: () => {
      message.success('Đã xác nhận chuyển trả cho hội viên');
      setSelected(null);
      client.invalidateQueries({ queryKey: ['refunds'] });
    },
  });
  return (
    <>
      <QueryState query={query}>
        <Table
          rowKey="id"
          dataSource={query.data?.data}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: 600 }}
          columns={[
            { title: 'Hóa đơn', dataIndex: ['invoice', 'code'] },
            { title: 'Số tiền hoàn', dataIndex: 'amount', render: (v) => formatCurrency(v) },
            { title: 'Lý do', dataIndex: 'reason' },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (v) => (v === 'PENDING' ? 'Chờ chuyển trả' : 'Đã chuyển trả'),
            },
            { title: 'Tham chiếu', dataIndex: 'reference' },
            {
              title: 'Thao tác',
              render: (_, row) =>
                row.status === 'PENDING' && (
                  <Button
                    onClick={() => {
                      save.reset();
                      form.resetFields();
                      setSelected(row);
                    }}
                  >
                    Xác nhận đã chuyển trả
                  </Button>
                ),
            },
          ]}
        />
      </QueryState>
      <Modal
        open={Boolean(selected)}
        title="Xác nhận đã chuyển trả"
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
            label="Mã tham chiếu"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={191} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
