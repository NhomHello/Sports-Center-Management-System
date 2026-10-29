import { cloneElement } from 'react';
import { Alert, Descriptions, Form, Modal, Radio } from 'antd';
import { formatCurrency } from '@/utils/format';
import { SETTLEMENT_OPTIONS, validChangePreview } from './CancelPurchasePolicy';

function ChangePreview({ data }) {
  return (
    <Descriptions bordered column={1} size="small">
      <Descriptions.Item label="Giá trị còn lại">
        {formatCurrency(data.remainingValue)}
      </Descriptions.Item>
      <Descriptions.Item label="Giá sản phẩm mới">
        {formatCurrency(data.newPrice)}
      </Descriptions.Item>
      <Descriptions.Item label={data.difference > 0 ? 'Cần thanh toán thêm' : 'Phần trả lại'}>
        {formatCurrency(Math.abs(data.difference))}
      </Descriptions.Item>
    </Descriptions>
  );
}

function ChangeSettlementForm({ form, data, ready, pending, onSubmit }) {
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={pending || !ready}
      onFinish={(values) => {
        if (ready) onSubmit(data.difference < 0 ? values : {});
      }}
    >
      {ready && data.difference < 0 && (
        <Form.Item
          name="settlement"
          label="Cách nhận phần trả lại"
          rules={[{ required: true, message: 'Chọn cách nhận phần trả lại' }]}
        >
          <Radio.Group options={SETTLEMENT_OPTIONS} />
        </Form.Item>
      )}
    </Form>
  );
}

/** Chỉ cho xác nhận khi preview của đúng đích đã tải xong, kể cả đổi liên tiếp. */
export function ChangePurchaseModal({ kind, query, mutation, onSubmit, onClose, children }) {
  const [form] = Form.useForm();
  const data = query.data?.data;
  const ready = validChangePreview(data) && !query.isFetching && !query.isError;
  return (
    <Modal
      open
      title={kind === 'membership' ? 'Đổi gói tự tập' : 'Đổi lớp'}
      okText="Xác nhận đổi"
      cancelText="Đóng"
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !ready }}
      onOk={() => form.submit()}
      closable={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      {cloneElement(children, { disabled: mutation.isPending })}
      {query.isFetching && <Alert type="info" title="Đang tải chênh lệch…" />}
      {query.isError && <Alert showIcon type="error" title={query.error.message} />}
      {ready && <ChangePreview data={data} />}
      {mutation.isError && <Alert showIcon type="error" title={mutation.error.message} />}
      <ChangeSettlementForm
        form={form}
        data={data}
        ready={ready}
        pending={mutation.isPending}
        onSubmit={onSubmit}
      />
      <Alert
        type="info"
        showIcon
        title="Không thu phí đổi. Nếu cần thu thêm, đăng ký hiện tại được giữ đến khi hóa đơn chênh lệch được thanh toán đủ."
      />
    </Modal>
  );
}
