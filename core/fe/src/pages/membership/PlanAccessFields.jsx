import { useQuery } from '@tanstack/react-query';
import { Form, Select } from 'antd';
import { listFrames, listRoomTypes } from '@/services/schedule.service';

/** GY-21: chọn khung giờ và khu tự tập của gói; để trống = không giới hạn mục đó. */
export function PlanAccessFields() {
  const frames = useQuery({ queryKey: ['operating-frames'], queryFn: listFrames });
  const types = useQuery({ queryKey: ['room-types'], queryFn: listRoomTypes });
  const frameOptions = (frames.data?.data ?? [])
    .filter((frame) => frame.isActive)
    .map((frame) => ({
      value: frame.id,
      label: `${frame.name} ${frame.startTime}–${frame.endTime}`,
    }));
  const areaOptions = (types.data?.data ?? [])
    .filter((type) => type.isActive && type.isSelfTrainingArea)
    .map((type) => ({ value: type.id, label: type.name }));
  return (
    <>
      <Form.Item
        name="frameIds"
        label="Khung giờ được vào"
        extra="Để trống nếu gói vào được mọi khung giờ hoạt động."
      >
        <Select mode="multiple" allowClear options={frameOptions} loading={frames.isPending} />
      </Form.Item>
      <Form.Item
        name="roomTypeIds"
        label="Khu tự tập được vào"
        extra="Chỉ hiện loại phòng đánh dấu là khu tự tập. Để trống = mọi khu tự tập."
      >
        <Select mode="multiple" allowClear options={areaOptions} loading={types.isPending} />
      </Form.Item>
    </>
  );
}
