import { UsergroupAddOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { QUERY_KEYS } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import { usePermission } from '@/hooks/usePermission';
import * as memberService from '@/services/member.service';
import { MemberFormModal } from './MemberFormModal';
import { MemberMembershipModal } from './MemberMembershipModal';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { MembersListPanel } from './MembersListPanel';
import { getMemberColumns } from './MemberColumns';
import './members.css';

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
              style={{
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(22,119,255,0.3)',
              }}
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
    </div>
  );
}
