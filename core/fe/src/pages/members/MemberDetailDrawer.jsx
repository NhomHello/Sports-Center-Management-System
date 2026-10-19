import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, USER_STATUS_META } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { StatusTag } from '@/components/common/StatusTag';
import * as memberService from '@/services/member.service';
import { MemberFreezePanel } from './MemberFreezePanel';
import { BookingBlockPanel } from './BookingBlockPanel';
import { MemberInfoView } from './MemberInfoView';
import { useVerifyMemberEmail } from './useVerifyMemberEmail';
import { formatDate } from '@/utils/format';

const MemberInfoForm = ({ form, onSubmit }) => (
  <Form form={form} layout="vertical" onFinish={onSubmit}>
    <Form.Item
      name="fullName"
      label="Họ và tên"
      rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
    >
      <Input placeholder="Nhập họ tên" />
    </Form.Item>
    <Form.Item
      name="email"
      label="Email"
      rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
    >
      <Input placeholder="Nhập email" />
    </Form.Item>
    <Form.Item
      name="phone"
      label="Số điện thoại"
      rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
    >
      <Input placeholder="Nhập số điện thoại" />
    </Form.Item>
  </Form>
);

const MemberMembershipView = ({ member }) => {
  if (!member.currentMembership) {
    return <Typography.Text type="secondary">Chưa có gói tập nào đang hoạt động.</Typography.Text>;
  }
  const { currentMembership } = member;
  const { color: statusColor, label: statusText } = membershipStatusMeta(currentMembership);

  return (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="Gói hiện tại">
        <Typography.Text strong>{currentMembership.plan?.name}</Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Mã gói">{currentMembership.plan?.code}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={statusColor}>{statusText}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Hiệu lực">
        {formatDate(currentMembership.startDate)} - {formatDate(currentMembership.endDate)}
      </Descriptions.Item>
    </Descriptions>
  );
};

const MemberEditActions = ({ isEditing, setIsEditing, form, updateMutation }) => (
  <Space>
    {isEditing ? (
      <>
        <Button onClick={() => setIsEditing(false)}>Hủy</Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={updateMutation.isPending}
        >
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

function MembershipTab({ member, canFreeze }) {
  return (
    <>
      <MemberMembershipView member={member} />
      {canFreeze && <MemberFreezePanel memberId={member.id} />}
    </>
  );
}

/** Chi tiết và cập nhật hồ sơ hội viên theo permission. */
export function MemberDetailDrawer({ member, open, onClose, onUpdated }) {
  const { can } = usePermission();
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const canUpdate = can(PERMISSIONS.MEMBER_UPDATE);

  useEffect(() => {
    if (member && open && isEditing) {
      form.setFieldsValue({
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
      });
    }
  }, [member, open, isEditing, form]);

  const updateMutation = useMutation({
    mutationFn: (values) => memberService.updateMember(member.id, values),
    onSuccess: ({ data }) => {
      message.success('Cập nhật hồ sơ thành công');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      onUpdated?.({ ...member, ...data });
      setIsEditing(false);
    },
    onError: (error) => message.error(error.message || 'Có lỗi xảy ra'),
  });

  const verifyMutation = useVerifyMemberEmail({ member, onUpdated });

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const extraButtons = canUpdate && (
    <MemberEditActions
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      form={form}
      updateMutation={updateMutation}
    />
  );

  if (!member) return null;

  return (
    <Drawer
      title="Chi tiết hội viên"
      size={640}
      open={open}
      onClose={handleClose}
      extra={extraButtons}
      destroyOnHidden
    >
      <BookingBlockPanel member={member} onUpdated={onUpdated} />
      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: 'info',
            label: 'Thông tin cơ bản',
            children: isEditing ? (
              <MemberInfoForm form={form} onSubmit={updateMutation.mutate} />
            ) : (
              <MemberInfoView
                member={member}
                canVerify={can(PERMISSIONS.USER_VERIFY_EMAIL)}
                onVerify={verifyMutation.mutate}
                verifying={verifyMutation.isPending}
              />
            ),
          },
          {
            key: 'membership',
            label: 'Gói tập',
            children: (
              <MembershipTab member={member} canFreeze={can(PERMISSIONS.MEMBERSHIP_FREEZE_ALL)} />
            ),
          },
        ]}
      />
    </Drawer>
  );
}
const isFrozenNow = (membership, now = Date.now()) =>
  membership.isFrozen ??
  (membership.freezes ?? []).some(
    (f) => !f.endedAt && new Date(f.startAt) <= now && now < new Date(f.endAt),
  );

/** Nhãn tiếng Việt cho trạng thái gói (không hiện mã ACTIVE/EXPIRED). */
const membershipStatusMeta = (membership) => {
  if (isFrozenNow(membership)) return { color: 'blue', label: 'Đang bảo lưu' };
  if (membership.status === 'ACTIVE') return { color: 'green', label: 'Đang hoạt động' };
  return { color: 'orange', label: 'Đã hết hạn' };
};
