import { Button, Descriptions, Popconfirm, Space, Tag } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { USER_STATUS_META } from '@/constants';

const EmailVerificationStatus = ({ member, canVerify, onVerify, verifying }) => {
  if (!member.email) return '--';
  if (member.emailVerifiedAt) {
    return (
      <Space>
        {member.email}
        <Tag color="green">Đã xác minh</Tag>
      </Space>
    );
  }
  return (
    <Space wrap>
      {member.email}
      <Tag color="orange">Chưa xác minh</Tag>
      {canVerify && (
        <Popconfirm
          title="Xác minh email thủ công?"
          description={
            <div style={{ maxWidth: 320 }}>
              Chỉ xác nhận sau khi đã đối chiếu danh tính hội viên (trực tiếp hoặc qua Zalo,
              Facebook). Thao tác được ghi nhật ký.
            </div>
          }
          okText="Xác minh"
          cancelText="Huỷ"
          onConfirm={onVerify}
        >
          <Button size="small" type="primary" loading={verifying}>
            Xác minh email
          </Button>
        </Popconfirm>
      )}
    </Space>
  );
};

/** Thông tin cơ bản của hội viên (chế độ xem), kèm trạng thái và thao tác xác minh email. */
export const MemberInfoView = ({ member, canVerify, onVerify, verifying }) => (
  <Descriptions column={1} bordered>
    <Descriptions.Item label="Mã hội viên">{member.id}</Descriptions.Item>
    <Descriptions.Item label="Họ và tên">{member.fullName}</Descriptions.Item>
    <Descriptions.Item label="Email">
      <EmailVerificationStatus
        member={member}
        canVerify={canVerify}
        onVerify={onVerify}
        verifying={verifying}
      />
    </Descriptions.Item>
    <Descriptions.Item label="Số điện thoại">{member.phone}</Descriptions.Item>
    <Descriptions.Item label="Trạng thái tài khoản">
      <StatusTag value={member.status || 'ACTIVE'} meta={USER_STATUS_META} />
    </Descriptions.Item>
  </Descriptions>
);
