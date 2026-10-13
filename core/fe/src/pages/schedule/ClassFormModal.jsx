import { useQuery } from '@tanstack/react-query';
import { Alert, Form, Modal } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { classFormPayload, classFormValues } from '@/utils/schedule';
import { ClassIdentityFields } from './ClassIdentityFields';
import { ClassScheduleFields } from './ClassScheduleFields';

/** Container form cấu hình lớp; chỉ chọn tài nguyên đang hoạt động. */
export function ClassFormModal({ item, onClose }) {
  const [form] = Form.useForm();
  const options = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'class-options'],
    queryFn: async () => {
      const [subjects, rooms, coaches] = await Promise.all([
        service.listResources('subjects', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        service.listResources('rooms', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        service.listCoaches(),
      ]);
      return { subjects: subjects.data, rooms: rooms.data, coaches: coaches.data };
    },
  });
  const save = useScheduleMutation(
    (values) =>
      item
        ? service.updateClass(item.id, classFormPayload(values))
        : service.createClass(classFormPayload(values)),
    onClose,
  );
  return (
    <Modal
      open
      title={item ? 'Sửa lớp / đổi lịch' : 'Tạo lớp học'}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu lớp"
      cancelText="Huỷ"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: options.isPending || options.isError }}
      width={720}
    >
      {options.isError && <Alert type="error" title={options.error.message} />}
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ focus: true }}
        initialValues={classFormValues(item)}
        onFinish={save.mutate}
      >
        <ClassIdentityFields
          subjects={options.data?.subjects || []}
          rooms={options.data?.rooms || []}
          coaches={options.data?.coaches || []}
        />
        <ClassScheduleFields />
      </Form>
    </Modal>
  );
}
