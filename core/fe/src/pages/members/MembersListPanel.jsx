import { SearchOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons';
import { Card, Col, Input, Row, Table, Typography, Statistic } from 'antd';

export function MembersListPanel({ membersQuery, table, columns }) {
  return (
    <>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: '24px 32px' }}>
            <Statistic
              title={<Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#8c8c8c' }}>TỔNG HỘI VIÊN</Typography.Text>}
              value={membersQuery.data?.meta?.total ?? 0}
              prefix={<div style={{ width: 48, height: 48, borderRadius: '12px', background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}><TeamOutlined style={{ fontSize: 24, color: '#fff' }} /></div>}
              valueStyle={{ color: '#1f1f1f', fontSize: 36, fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={16}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }} bodyStyle={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography.Title level={5} style={{ margin: '0 0 16px 0', color: '#262626' }}>Tra cứu hội viên</Typography.Title>
            <Input.Search
              allowClear
              size="large"
              placeholder="Nhập tên, số điện thoại hoặc email để tìm kiếm..."
              onSearch={(value) => table.setFilters({ search: value || undefined })}
              style={{ maxWidth: 1000 }}
              prefix={<SearchOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <IdcardOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>Danh sách hồ sơ</Typography.Title>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={membersQuery.data?.data ?? []}
          loading={membersQuery.isPending}
          pagination={{ ...table.paginationProps(membersQuery.data?.meta), showSizeChanger: true, style: { padding: '0 32px', marginBottom: 24 } }}
          onChange={table.onTableChange}
          scroll={{ x: 900 }}
          className="scms-member-table"
        />
      </Card>
    </>
  );
}
