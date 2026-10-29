import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Form, Input, Modal, Rate } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { COURSE_KEYS, COURSE_LIMITS } from '@/constants/courses';
import { PROFILE_KEYS } from '@/constants/profile';
import { getOwnRating, saveRating } from '@/services/course.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from '@/pages/schedule/QueryState';

function RatingFields({ data, form, mutation }) {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={data.rating ?? {}}
      onFinish={mutation.mutate}
      disabled={!data.canRate || mutation.isPending}
    >
      <Alert
        type={data.canRate ? 'info' : 'warning'}
        showIcon
        title={data.canRate ? `Có thể sửa đến ${formatDateTime(data.deadlineAt)}` : data.reason}
      />
      <Form.Item
        name="courseStars"
        label="Điểm khóa học"
        rules={[{ required: true, message: 'Chọn điểm khóa học' }]}
      >
        <Rate allowClear={false} count={COURSE_LIMITS.MAX_PROGRESS} />
      </Form.Item>
      <Form.Item
        name="coachStars"
        label="Điểm HLV"
        rules={[{ required: true, message: 'Chọn điểm HLV' }]}
      >
        <Rate allowClear={false} count={COURSE_LIMITS.MAX_PROGRESS} />
      </Form.Item>
      <Form.Item name="comment" label="Nhận xét khóa học">
        <Input.TextArea maxLength={COURSE_LIMITS.TEXT_LENGTH} rows={3} />
      </Form.Item>
    </Form>
  );
}
/** S4-19: API xác định hạn và đánh giá hiện có; không tạo trùng bằng suy đoán phía client. */
export function CourseRatingModal({ item, onClose }) {
  const { message } = App.useApp();
  const { user } = useAuth();
  const client = useQueryClient();
  const [form] = Form.useForm();
  const classId = item.summary.classId;
  const query = useQuery({
    queryKey: [...COURSE_KEYS.RATINGS, 'own', user?.id, classId],
    queryFn: () => getOwnRating(classId),
    retry: false,
  });
  const data = query.data?.data;
  const mutation = useMutation({
    mutationFn: ({ courseStars, coachStars, comment = '' }) =>
      saveRating(classId, { courseStars, coachStars, comment }, Boolean(data.rating)),
    onSuccess: () => {
      message.success('Đã lưu đánh giá');
      [COURSE_KEYS.RATINGS, PROFILE_KEYS.COACHES, COURSE_KEYS.REPORT].forEach((queryKey) =>
        client.invalidateQueries({ queryKey }),
      );
      onClose();
    },
    onError: (error) => {
      message.error(error.message);
      query.refetch();
    },
  });
  return (
    <Modal
      open
      title={`Đánh giá · ${item.summary.gymClass.name}`}
      okText="Lưu đánh giá"
      cancelText="Đóng"
      onCancel={() => !mutation.isPending && onClose()}
      onOk={form.submit}
      confirmLoading={mutation.isPending}
      okButtonProps={{ disabled: !data?.canRate }}
    >
      <QueryState query={query}>
        {data && <RatingFields data={data} form={form} mutation={mutation} />}
      </QueryState>
    </Modal>
  );
}
