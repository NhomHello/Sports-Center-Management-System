import { Descriptions } from 'antd';
/** Giữ nguyên nhận xét và gợi ý của HLV, không suy ra kết quả từ mức chuyên cần. */
export function CourseResultDetails({ item }) {
  const attendance = item.attendanceSnapshot;
  return (
    <Descriptions
      bordered
      column={1}
      items={[
        { key: 'lookup', label: 'Mã tra cứu', children: item.lookupCode },
        {
          key: 'attendance',
          label: 'Điểm danh',
          children: `Có mặt ${attendance.present} · Vắng ${attendance.absent} · Xin nghỉ ${attendance.excused} · Chưa ghi ${attendance.missing}`,
        },
        { key: 'comment', label: 'Nhận xét của HLV', children: item.comment || 'Chưa có nhận xét' },
        {
          key: 'next',
          label: 'Gợi ý khóa tiếp theo',
          children: item.nextCourse || 'Chưa có gợi ý',
        },
      ]}
    />
  );
}
