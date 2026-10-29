import './profiles.css';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, List, Rate, Space, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { PROFILE_KEYS } from '@/constants/profile';
import { PUBLIC_CONTACT_LINKS } from '@/config/env';
import { ROUTES } from '@/constants';
import { getCoach } from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { CoachAvatar } from './CoachAvatar';

function CoachContact({ contact }) {
  if (!contact)
    return <Typography.Paragraph>HLV chưa chia sẻ thông tin liên hệ.</Typography.Paragraph>;
  return (
    <Space wrap>
      {contact.email && <Button href={`mailto:${contact.email}`}>Gửi email</Button>}
      {contact.phone && <Button href={`tel:${contact.phone}`}>Gọi điện</Button>}
      {contact.zalo && (
        <Button
          href={`${PUBLIC_CONTACT_LINKS.ZALO_BASE}${contact.zalo.replace(/^0/u, '84')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Liên hệ Zalo
        </Button>
      )}
    </Space>
  );
}
function CoachInformation({ coach }) {
  return (
    <Space vertical className="scms-full-width">
      <Card>
        <CoachAvatar id={coach.id} profile={coach} size={96} />
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {coach.bio || 'Chưa có giới thiệu.'}
        </Typography.Paragraph>
        <Descriptions
          items={[
            { key: 'years', label: 'Kinh nghiệm', children: `${coach.experienceYears} năm` },
            {
              key: 'certificates',
              label: 'Chứng chỉ',
              children: coach.certifications.join(', ') || 'Chưa cập nhật',
            },
          ]}
        />
        <Space wrap>
          {coach.subjects.map((s) => (
            <Tag key={s.id}>{s.name}</Tag>
          ))}
        </Space>
        <CoachContact contact={coach.contact} />
      </Card>
      <Card title="Lớp đang mở">
        <List
          dataSource={coach.classes}
          locale={{ emptyText: 'Chưa có lớp đang mở' }}
          renderItem={(item) => (
            <List.Item>
              <Link to={`${ROUTES.SCHEDULE}?tab=open&class=${item.id}`}>
                {item.name} · {item.subject.name}
              </Link>
            </List.Item>
          )}
        />
      </Card>
      <Card title={`Đánh giá HLV · ${coach.ratingCount} lượt`}>
        <Rate allowHalf disabled value={coach.averageRating || 0} />
        <List
          dataSource={coach.ratings}
          locale={{ emptyText: 'Chưa có đánh giá' }}
          renderItem={(rating) => (
            <List.Item>
              <Space vertical>
                <strong>{rating.memberName}</strong>
                <Rate disabled value={rating.coachStars} />
                <span>
                  {rating.hidden ? 'Nhận xét đã được ẩn' : rating.comment || 'Không có nhận xét'}
                </span>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
/** Hồ sơ HLV công khai; khóa tài khoản thì endpoint trả 404 và có nút thử lại. */
export default function CoachDetailPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: [...PROFILE_KEYS.COACHES, 'detail', id],
    queryFn: () => getCoach(id),
    retry: false,
  });
  return (
    <div className="scms-profile-page">
      <PageHeader title={query.data?.data.fullName || 'Hồ sơ huấn luyện viên'} />
      <QueryState query={query}>
        {query.data && <CoachInformation coach={query.data.data} />}
      </QueryState>
    </div>
  );
}
