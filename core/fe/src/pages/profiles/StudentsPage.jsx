import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Table } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { PROFILE_KEYS } from '@/constants/profile';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listAssignedMembers } from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { StudentDetailDrawer } from './StudentDetailDrawer';
/** Danh sách chỉ có học viên thuộc phạm vi HLV hiện tại. */
export default function StudentsPage() {
  const [selected, setSelected] = useState(null);
  const table = useTableQuery();
  const query = useQuery({
    queryKey: [...PROFILE_KEYS.STUDENTS, 'list', table.params],
    queryFn: () => listAssignedMembers(table.params),
  });
  return (
    <>
      <PageHeader
        title="Học viên của tôi"
        subtitle="Hồ sơ và chuyên cần của học viên trong lớp bạn phụ trách"
      />
      <Input.Search
        allowClear
        placeholder="Tìm học viên"
        onSearch={(q) => table.setFilters({ q: q || undefined })}
      />
      <QueryState query={query}>
        <Table
          rowKey="id"
          dataSource={query.data?.data}
          loading={query.isFetching}
          scroll={{ x: 600 }}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          columns={[
            { title: 'Họ tên', dataIndex: 'fullName' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Điện thoại', dataIndex: 'phone' },
            {
              title: 'Thao tác',
              render: (_, member) => (
                <Button onClick={() => setSelected(member.id)}>Xem hồ sơ học viên</Button>
              ),
            },
          ]}
        />
      </QueryState>
      {selected && <StudentDetailDrawer memberId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
