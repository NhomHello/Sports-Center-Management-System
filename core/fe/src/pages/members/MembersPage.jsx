import { EditOutlined, EyeOutlined, ShoppingCartOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, Space, Typography, Tooltip, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { StatusTag } from '@/components/common/StatusTag';
import { MEMBERSHIP_STATUS_META, QUERY_KEYS } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import { usePermission } from '@/hooks/usePermission';
import * as memberService from '@/services/member.service';
import { formatDate } from '@/utils/format';
import { MemberFormModal } from './MemberFormModal';
import { MemberMembershipModal } from './MemberMembershipModal';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { MembersListPanel } from './MembersListPanel';

const MEMBER_COLUMNS = [
  {
    title: 'HỘI VIÊN',
    dataIndex: 'fullName',
    key: 'fullName',
    width: 300,
    render: (fullName, member) => (
      <Space size="middle">
        <Avatar size={44} style={{ backgroundColor: '#e6f4ff', color: '#1677ff', fontWeight: 700, fontSize: 16 }}>
          {fullName?.trim().slice(0, 1)?.toUpperCase() || 'H'}
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text strong style={{ color: '#1f1f1f', fontSize: 15 }}>{fullName}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>{member.email || 'Chưa cập nhật email'}</Typography.Text>
        </div>
      </Space>
    ),
  },
  { 
    title: 'LIÊN HỆ', 
    key: 'contact',
    render: (_, member) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Typography.Text style={{ fontWeight: 500 }}>{member.phone || '--'}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>ID: #{member.id}</Typography.Text>
      </div>
    )
  },
  {
    title: 'GÓI ĐANG TẬP',
    key: 'membership',
    render: (_, member) => {
      const planName = member.currentMembership?.plan?.name;
      return planName ? (
        <Tag color="blue" style={{ borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 500, border: 'none', background: '#e6f4ff', color: '#1677ff' }}>
          {planName}
        </Tag>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>Chưa đăng ký</Typography.Text>
      );
    }
  },
  {
    title: 'HIỆU LỰC',
    key: 'status',
    render: (_, member) => {
      const status = member.currentMembership?.status;
      return status ? (
        <Space orientation="vertical" size={2}>
          <StatusTag value={status} meta={MEMBERSHIP_STATUS_META} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tới: {formatDate(member.currentMembership?.endDate)}
          </Typography.Text>
        </Space>
      ) : (
        <Typography.Text type="secondary">--</Typography.Text>
      );
    },
  },
];

const getMemberColumns = (canManage, canUpdate, onPurchase, onViewDetail) => [
  ...MEMBER_COLUMNS,
  {
    title: '',
    key: 'actions',
    align: 'right',
    render: (_, member) => (
      <Space size="middle">
        <Tooltip title={canUpdate ? 'Xem và sửa hồ sơ' : 'Xem hồ sơ'}>
          <Button 
            shape="circle" 
            icon={canUpdate ? <EditOutlined /> : <EyeOutlined />}
            aria-label={`${canUpdate ? 'Xem và sửa' : 'Xem'} hồ sơ ${member.fullName}`}
            onClick={() => onViewDetail(member)}
            style={{ color: '#595959', background: '#f5f5f5', border: 'none' }}
          />
        </Tooltip>
        {canManage && (
          <Button 
            type="primary"
            icon={<ShoppingCartOutlined />} 
            onClick={() => onPurchase(member)}
            style={{ borderRadius: 6, fontWeight: 500, boxShadow: '0 2px 8px rgba(22,119,255,0.25)' }}
          >
            Mua gói
          </Button>
        )}
      </Space>
    ),
  },
];

/** Trang CRM hội viên: Giao diện hiện đại, ấn tượng với tông màu xanh đặc trưng. */
export default function MembersPage() {
  const { can } = usePermission();
  const table = useTableQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPurchaseMember, setSelectedPurchaseMember] = useState(undefined);
  const [selectedDetailMember, setSelectedDetailMember] = useState(undefined);
  
  const membersQuery = useQuery({
    queryKey: [...QUERY_KEYS.MEMBERS, table.params],
    queryFn: () => memberService.listMembers(table.params),
  });
  
  const canManageMembership = can(PERMISSIONS.MEMBERSHIP_MANAGE);
  const canUpdateMember = can(PERMISSIONS.MEMBER_UPDATE);
  const columns = useMemo(
    () =>
      getMemberColumns(
        canManageMembership,
        canUpdateMember,
        setSelectedPurchaseMember,
        setSelectedDetailMember,
      ),
    [canManageMembership, canUpdateMember],
  );

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <PageHeader
        title="Quản Lý Hội Viên"
        subtitle="Hệ thống lưu trữ hồ sơ và quản lý trạng thái tập luyện của khách hàng."
        extra={
          <PermissionGate permission={PERMISSIONS.MEMBER_CREATE}>
            <Button 
              type="primary" 
              size="large"
              icon={<UsergroupAddOutlined />} 
              onClick={() => setCreateOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}
            >
              Thêm hội viên
            </Button>
          </PermissionGate>
        }
      />
      
      <div style={{ marginTop: 24 }}>
        <MembersListPanel membersQuery={membersQuery} table={table} columns={columns} />
      </div>

      <MemberFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <MemberMembershipModal
        member={selectedPurchaseMember}
        open={Boolean(selectedPurchaseMember)}
        onClose={() => setSelectedPurchaseMember(undefined)}
      />
      <MemberDetailDrawer 
        member={selectedDetailMember}
        open={Boolean(selectedDetailMember)}
        onClose={() => setSelectedDetailMember(undefined)}
        onUpdated={setSelectedDetailMember}
      />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scms-member-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          color: #595959;
          font-weight: 700;
          font-size: 13px;
          padding: 16px 32px;
        }
        .scms-member-table .ant-table-tbody > tr > td {
          padding: 20px 32px;
          border-bottom: 1px solid #f0f0f0;
        }
        .scms-member-table .ant-table-tbody > tr:hover > td {
          background: #fcfcfc;
        }
      `}</style>
    </div>
  );
}
