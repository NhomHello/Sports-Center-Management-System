import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Form, Select } from 'antd';
import { listPlanFrames, listPlanAreas } from '@/services/membershipPlan.service';

/** Chỉ chọn loại phòng được đánh dấu là khu tự tập. */
export function PlanAccessFields() {
  const frames = useQuery({ queryKey: ['plan-frames'], queryFn: listPlanFrames });
  const areas = useQuery({ queryKey: ['plan-areas'], queryFn: listPlanAreas });
  const failed = frames.isError || areas.isError;
  return (
    <>
      {failed && (
        <Alert
          type="error"
          showIcon
          title="Chưa tải được khung giờ hoặc khu vực"
          description={frames.error?.message || areas.error?.message}
          action={
            <Button
              onClick={() => {
                frames.refetch();
                areas.refetch();
              }}
            >
              Thử lại
            </Button>
          }
        />
      )}
      <Form.Item
        name="frameIds"
        label="Khung giờ được vào"
        rules={[{ required: true, message: 'Chọn ít nhất một khung giờ' }]}
      >
        <Select
          mode="multiple"
          loading={frames.isPending}
          disabled={failed}
          options={(frames.data?.data ?? [])
            .filter((f) => f.isActive !== false)
            .map((f) => ({
              value: f.id,
              label: `${f.name} ${f.startTime}–${f.endTime}`,
            }))}
        />
      </Form.Item>
      <Form.Item
        name="roomTypeIds"
        label="Khu vực tự tập"
        rules={[{ required: true, message: 'Chọn ít nhất một khu vực tự tập' }]}
      >
        <Select
          mode="multiple"
          loading={areas.isPending}
          disabled={failed}
          options={(areas.data?.data ?? [])
            .filter((a) => a.isSelfTrainingArea && a.isActive !== false)
            .map((a) => ({ value: a.id, label: a.name }))}
        />
      </Form.Item>
    </>
  );
}
