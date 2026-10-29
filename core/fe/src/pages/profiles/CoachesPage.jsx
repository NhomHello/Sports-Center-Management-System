import './profiles.css';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Input, Pagination, Rate, Row, Select, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { PROFILE_KEYS } from '@/constants/profile';
import { ROUTES } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listCoaches, getCoachSubjects } from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { CoachAvatar } from './CoachAvatar';

/** Danh mục HLV theo tên/bộ môn; từng thẻ chỉ dùng DTO công khai. */
export default function CoachesPage() {
  const table = useTableQuery();
  const query = useQuery({
    queryKey: [...PROFILE_KEYS.COACHES, 'list', table.params],
    queryFn: () => listCoaches(table.params),
  });
  const subjects = useQuery({ queryKey: ['profile-subjects'], queryFn: getCoachSubjects });
  return (
    <div className="scms-profile-page">
      <PageHeader
        title="Huấn luyện viên"
        subtitle="Tìm HLV phù hợp với bộ môn và mục tiêu tập luyện"
      />
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên HLV"
          onSearch={(q) => table.setFilters({ q: q || undefined })}
        />
        <Select
          allowClear
          placeholder="Bộ môn"
          aria-label="Lọc bộ môn HLV"
          style={{ width: 220 }}
          options={(subjects.data?.data || []).map((s) => ({
            value: s.id,
            label: s.name,
          }))}
          onChange={(subjectId) => table.setFilters({ subjectId })}
        />
      </Space>
      <QueryState query={query} isEmpty={!query.data?.data.length}>
        <Row gutter={[16, 16]}>
          {(query.data?.data || []).map((coach) => (
            <Col xs={24} md={12} xl={8} key={coach.id}>
              <Card>
                <CoachAvatar id={coach.id} profile={coach} />
                <Typography.Title level={4}>
                  <Link to={ROUTES.COACH_DETAIL.replace(':id', coach.id)}>{coach.fullName}</Link>
                </Typography.Title>
                <p>{coach.subjects.map((s) => s.name).join(' · ')}</p>
                <p>{coach.openClassCount} lớp đang mở</p>
                <Rate disabled allowHalf value={coach.averageRating || 0} />{' '}
                <span>
                  {coach.ratingCount
                    ? `${coach.averageRating.toFixed(1)} (${coach.ratingCount} đánh giá)`
                    : 'Chưa có đánh giá'}
                </span>
              </Card>
            </Col>
          ))}
        </Row>
      </QueryState>
      <Pagination
        {...table.paginationProps(query.data?.meta)}
        onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
      />
    </div>
  );
}
