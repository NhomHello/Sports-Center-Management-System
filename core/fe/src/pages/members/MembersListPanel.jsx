import { IdcardOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Card, Col, Row, Table, Typography } from 'antd';
import { SearchInput } from '@/components/common/SearchInput';

export function MembersListPanel({ membersQuery, table, columns }) {
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
            placeholder="Tên, số điện thoại hoặc email"
            onSearch={(value) => table.setFilters({ search: value.trim() || undefined })}
          />
        </div>
        <Table
          rowKey="id"
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
