import { useQuery } from '@tanstack/react-query';
import { Alert, Form, Modal } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as scheduleService from '@/services/schedule.service';
import { classFormPayload, classFormValues } from '@/utils/schedule';
import { ClassIdentityFields } from './ClassIdentityFields';
import { ClassScheduleFields } from './ClassScheduleFields';

/** Modal tạo lớp hoặc sửa toàn bộ cấu hình lớp hiện có. */
export function ClassFormModal({ item, onClose }) {
  const [form] = Form.useForm();
  const optionsQuery = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'class-options'],
    queryFn: async () => {
      const [subjects, rooms, coaches] = await Promise.all([
        scheduleService.listResources('subjects', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        scheduleService.listResources('rooms', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        scheduleService.listCoaches(),
      ]);
      return { subjects: subjects.data, rooms: rooms.data, coaches: coaches.data };
    },
  });
  const saveMutation = useScheduleMutation(
    (values) =>
      item
        ? scheduleService.updateClass(item.id, classFormPayload(values))
        : scheduleService.createClass(classFormPayload(values)),
    onClose,
    (error) => form.setFields(error.toFormFields()),
  );

  return (
    <Modal
      open
      title={item ? 'Sửa lớp / đổi lịch' : 'Tạo lớp học'}
      width={720}
      okText="Lưu lớp"
      cancelText="Huỷ"
      confirmLoading={saveMutation.isPending}
      okButtonProps={{ disabled: optionsQuery.isPending || optionsQuery.isError }}
      onOk={form.submit}
      onCancel={onClose}
      destroyOnHidden
    >
      {optionsQuery.isError && <Alert type="error" showIcon title={optionsQuery.error.message} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={classFormValues(item)}
        scrollToFirstError={{ focus: true }}
        onFinish={saveMutation.mutate}
      >
        <ClassIdentityFields
          subjects={optionsQuery.data?.subjects || []}
          rooms={optionsQuery.data?.rooms || []}
          coaches={optionsQuery.data?.coaches || []}
        />
        <ClassScheduleFields />
      </Form>
    </Modal>
  );
}
