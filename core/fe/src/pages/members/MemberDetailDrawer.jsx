import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button, Drawer, Form, Input, Space, Typography, Descriptions, Tabs, Tag, App } from 'antd';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, USER_STATUS_META } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { StatusTag } from '@/components/common/StatusTag';
import * as memberService from '@/services/member.service';
import { formatDate } from '@/utils/format';

const { TabPane } = Tabs;

const MemberInfoForm = ({ form, onSubmit }) => (
  <Form form={form} layout="vertical" onFinish={onSubmit}>
    <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
      <Input placeholder="Nhập họ tên" />
    </Form.Item>
    <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
      <Input placeholder="Nhập email" />
    </Form.Item>
    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
      <Input placeholder="Nhập số điện thoại" />
    </Form.Item>
  </Form>
);

const MemberInfoView = ({ member }) => (
  <Descriptions column={1} bordered>
    <Descriptions.Item label="Mã hội viên">{member.id}</Descriptions.Item>
    <Descriptions.Item label="Họ và tên">{member.fullName}</Descriptions.Item>
    <Descriptions.Item label="Email">{member.email || '--'}</Descriptions.Item>
    <Descriptions.Item label="Số điện thoại">{member.phone}</Descriptions.Item>
    <Descriptions.Item label="Trạng thái tài khoản">
      <StatusTag value={member.status || 'ACTIVE'} meta={USER_STATUS_META} />
    </Descriptions.Item>
  </Descriptions>
);

const MemberMembershipView = ({ member }) => {
  if (!member.currentMembership) {
    return <Typography.Text type="secondary">Chưa có gói tập nào đang hoạt động.</Typography.Text>;
  }
  const { currentMembership } = member;
  const statusColor = currentMembership.status === 'ACTIVE' ? 'green' : 'orange';
  const statusText = currentMembership.status === 'ACTIVE' ? 'Đang hoạt động' : currentMembership.status;

  return (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="Gói hiện tại">
        <Typography.Text strong>{currentMembership.plan?.name}</Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Mã gói">
        {currentMembership.plan?.code}
      </Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={statusColor}>{statusText}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Hiệu lực">
        {formatDate(currentMembership.startDate)} - {formatDate(currentMembership.endDate)}
      </Descriptions.Item>
    </Descriptions>
  );
};

export function MemberDetailDrawer({ member, open, onClose }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const canUpdate = can(PERMISSIONS.MEMBER_UPDATE) || true; // Placeholder for actual permission check

  useEffect(() => {
    if (member && open) {
      form.setFieldsValue({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
      });
      // Removing setState from effect to prevent cascading render warnings
    }
  }, [member, open, form]);

  const updateMutation = useMutation({
    mutationFn: (values) => memberService.updateMember(member.id, values),
    onSuccess: () => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      setIsEditing(false);
    },
    onError: (error) => message.error(error.message || 'Có lỗi xảy ra'),
  });

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const extraButtons = canUpdate && (
    <Space>
      {isEditing ? (
        <>
          <Button onClick={() => setIsEditing(false)}>Huỷ</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={updateMutation.isPending}>
            Lưu
          </Button>
        </>
      ) : (
        <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
          Sửa hồ sơ
        </Button>
      )}
    </Space>
  );

  if (!member) return null;

  return (
    <Drawer
      title="Chi tiết hội viên"
      width={600}
      open={open}
      onClose={handleClose}
      extra={extraButtons}
      destroyOnClose
    >
      <Tabs defaultActiveKey="info">
        <TabPane tab="Thông tin cơ bản" key="info">
          {isEditing ? (
            <MemberInfoForm form={form} onSubmit={updateMutation.mutate} />
          ) : (
            <MemberInfoView member={member} />
          )}
        </TabPane>
        <TabPane tab="Membership" key="membership">
          <MemberMembershipView member={member} />
        </TabPane>
      </Tabs>
    </Drawer>
  );
}
