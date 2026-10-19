import { IdcardOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Row, Table, Typography, Select, Alert } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';

export function MembersListPanel({ membersQuery, table, columns, onView }) {
  const total = membersQuery.data?.meta?.total ?? 0;
  return (
    <>
      <Row gutter={[20, 20]} className="scms-member-overview">
        <Col xs={24} md={8}>
          <Card className="scms-member-overview__metric">
            <span className="scms-member-overview__icon">
              <TeamOutlined />
            </span>
            <span>
              <Typography.Text type="secondary">Tổng hồ sơ hội viên</Typography.Text>
              <Typography.Title level={3}>{total}</Typography.Title>
            </span>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card className="scms-member-overview__hint">
            <span className="scms-member-overview__hint-mark">
              <SearchOutlined />
            </span>
            <span>
              <Typography.Text strong>Tra cứu nhanh và chính xác</Typography.Text>
              <Typography.Text type="secondary">
                Tìm theo họ tên, email hoặc số điện thoại đã chuẩn hóa.
              </Typography.Text>
            </span>
          </Card>
        </Col>
      </Row>

      <Card className="scms-data-card">
        <div className="scms-data-card__toolbar">
          <span>
            <Typography.Title level={4}>
              <IdcardOutlined /> Danh sách hồ sơ
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản lý thông tin và gói tập của hội viên
            </Typography.Text>
          </span>
          <SearchInput
            allowClear
            placeholder="Tìm theo tên, SĐT hoặc email"
            onSearch={(value) => table.setFilters({ search: value.trim() || undefined })}
          />
        </div>
        <Select
          className="scms-member-filter"
          aria-label="Lọc trạng thái gói"
          placeholder="Tất cả hội viên"
          allowClear
          options={[
            { value: 'ACTIVE', label: 'Đang hoạt động' },
            { value: 'EXPIRING', label: 'Sắp hết hạn' },
            { value: 'NO_PLAN', label: 'Chưa có gói' },
            { value: 'UNVERIFIED', label: 'Chưa xác minh email' },
            { value: 'FROZEN', label: 'Đang bảo lưu' },
          ]}
          onChange={(membershipFilter) => table.setFilters({ membershipFilter })}
        />
        {membersQuery.isError && <Alert type="error" title={membersQuery.error.message} />}
        <Table
          rowKey="id"
          onRow={(member) => ({ onClick: () => onView(member), style: { cursor: 'pointer' } })}
          columns={columns}
          dataSource={membersQuery.data?.data ?? []}
          loading={membersQuery.isPending}
          pagination={{ ...table.paginationProps(membersQuery.data?.meta), showSizeChanger: true }}
          onChange={table.onTableChange}
          scroll={{ x: 900 }}
          className="scms-data-table scms-member-table"
        />
      </Card>
    </>
  );
}
