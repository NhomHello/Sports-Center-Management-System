import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Form, Modal, Select } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { listResources, setCoachSubjects } from '@/services/schedule.service';

/** Góp ý GV: khai báo chuyên môn — chỉ phân công HLV dạy đúng bộ môn mình có chuyên môn. */
export function CoachSubjectsModal({ coach, onClose }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const client = useQueryClient();
  const subjects = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'subjects', 'active'],
    queryFn: () =>
      listResources('subjects', { pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE, isActive: 'true' }),
  });
  const save = useMutation({
    mutationFn: ({ subjectIds }) => setCoachSubjects(coach.id, subjectIds),
    onSuccess: (res) => {
      message.success(res.message);
      client.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      onClose();
    },
  });
  return (
    <Modal
      open
      centered
      title={`Chuyên môn của ${coach.fullName}`}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={save.isPending}
    >
      {save.isError && <Alert showIcon type="error" title={save.error.message} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{ subjectIds: coach.subjects.map((s) => s.id) }}
        onFinish={save.mutate}
      >
        <Form.Item
          name="subjectIds"
          label="Bộ môn được phân công dạy"
          extra="Không bỏ được bộ môn HLV đang dạy lớp còn buổi; hãy đổi HLV lớp đó trước."
        >
          <Select
            mode="multiple"
            loading={subjects.isPending}
            options={(subjects.data?.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
