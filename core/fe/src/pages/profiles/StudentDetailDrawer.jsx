import { useQuery } from '@tanstack/react-query';
import { Alert, Descriptions, Drawer, Table, Typography } from 'antd';
import { PROFILE_KEYS, PROFILE_LEVELS, COURSE_RESULT_LABELS } from '@/constants/profile';
import { getAssignedMember } from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';

function TrainingDetails({ data }) {
  if (!data.sharingEnabled)
    return (
      <Alert showIcon type="info" title="Hội viên chưa chia sẻ mục tiêu và sức khoẻ với HLV." />
    );
  const p = data.trainingProfile;
  return (
    <Descriptions
      column={1}
      bordered
      items={[
        { key: 'goals', label: 'Mục tiêu', children: p.goals || 'Chưa cập nhật' },
        {
          key: 'level',
          label: 'Trình độ',
          children: PROFILE_LEVELS.find((l) => l.value === p.level)?.label,
        },
        {
          key: 'health',
          label: 'Sức khoẻ / chấn thương',
          children: p.healthNotes || 'Chưa cập nhật',
        },
        {
          key: 'measurements',
          label: 'Chiều cao / cân nặng',
          children: `${p.heightCm ?? '—'} cm / ${p.weightKg ?? '—'} kg`,
        },
        {
          key: 'emergency',
          label: 'Liên hệ khẩn cấp',
          children: `${p.emergencyName || '—'} · ${p.emergencyPhone || '—'}`,
        },
      ]}
    />
  );
}
function StudentInformation({ data }) {
  return (
    <>
      <Descriptions
        column={1}
        items={[
          { key: 'name', label: 'Họ tên', children: data.fullName },
          {
            key: 'contact',
            label: 'Liên hệ',
            children: `${data.email || '—'} · ${data.phone || '—'}`,
          },
        ]}
      />
      <TrainingDetails data={data} />
      <Typography.Title level={5}>Chuyên cần trong lớp phụ trách</Typography.Title>
      <Table
        rowKey="id"
        pagination={false}
        scroll={{ x: 500 }}
        dataSource={data.classes}
        columns={[
          { title: 'Lớp', dataIndex: 'name' },
          { title: 'Có mặt', dataIndex: ['attendance', 'present'] },
          { title: 'Vắng', dataIndex: ['attendance', 'absent'] },
          { title: 'Xin nghỉ', dataIndex: ['attendance', 'excused'] },
          { title: 'Chưa ghi', dataIndex: ['attendance', 'missing'] },
          { title: 'Chuyên cần', render: (_, row) => `${row.attendance.percent}%` },
        ]}
      />
      <Typography.Title level={5}>Tổng kết đã công bố</Typography.Title>
      <Table
        rowKey="id"
        dataSource={data.summaries}
        pagination={false}
        columns={[
          { title: 'Khoá', dataIndex: ['summary', 'gymClass', 'name'] },
          { title: 'Kết quả', dataIndex: 'result', render: (v) => COURSE_RESULT_LABELS[v] || '—' },
          { title: 'Tiến bộ', dataIndex: 'progress' },
          { title: 'Nhận xét', dataIndex: 'comment' },
          { title: 'Gợi ý khoá tiếp', dataIndex: 'nextCourse' },
        ]}
      />
    </>
  );
}
/** Dùng từ màn Học viên của tôi, roster và điểm danh; 403 không hiển thị dữ liệu cache của người khác. */
export function StudentDetailDrawer({ memberId, onClose }) {
  const query = useQuery({
    queryKey: [...PROFILE_KEYS.STUDENTS, 'detail', memberId],
    queryFn: () => getAssignedMember(memberId),
    retry: false,
  });
  return (
    <Drawer open title="Hồ sơ học viên" onClose={onClose} size="large">
      <QueryState query={query}>
        {query.data && <StudentInformation data={query.data.data} />}
      </QueryState>
    </Drawer>
  );
}
