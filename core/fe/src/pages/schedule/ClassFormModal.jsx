import { useQuery } from '@tanstack/react-query';
import { Alert, App, Form, Modal, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import * as service from '@/services/schedule.service';
import { classFormPayload, classFormValues } from '@/utils/schedule';
import { ClassIdentityFields } from './ClassIdentityFields';
import { ClassScheduleFields } from './ClassScheduleFields';

/** Danh mục cho form lớp: bộ môn, phòng (kèm loại phòng), HLV (kèm chuyên môn), khung giờ. */
const EMPTY_OPTIONS = { subjects: [], rooms: [], coaches: [], frames: [] };

const useClassOptions = () =>
  useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'class-options'],
    queryFn: async () => {
      const [subjects, rooms, coaches, frames] = await Promise.all([
        service.listResources('subjects', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        service.listResources('rooms', {
          pageSize: SCHEDULE_UI.OPTION_PAGE_SIZE,
          isActive: 'true',
        }),
        service.listCoaches(),
        service.listFrames(),
      ]);
      return {
        subjects: subjects.data,
        rooms: rooms.data,
        coaches: coaches.data,
        frames: frames.data,
      };
    },
  });

/**
 * Sửa lớp: gọi API xem trước (server kiểm tra khung giờ, phòng, HLV như khi lưu) rồi hỏi xác nhận
 * kèm số buổi bị đổi và học viên bị ảnh hưởng trước khi lưu thật (góp ý GV).
 */
function useUpdatePreview(item, save) {
  const { modal, message } = App.useApp();
  return async (values) => {
    try {
      const { data } = await service.previewClassUpdate(item.id, classFormPayload(values));
      const conflicts = data.conflicts.map((c) => `${c.fullName} (trùng "${c.className}")`);
      modal.confirm({
        title: 'Xác nhận thay đổi lịch lớp',
        width: 520,
        content: (
          <>
            <p>
              Huỷ {data.cancelled} buổi · thêm {data.added} buổi · đổi phòng/HLV/giờ {data.changed}{' '}
              buổi. {data.enrolledCount} học viên đang học sẽ nhận thông báo.
            </p>
            {conflicts.length > 0 && (
              <Alert
                type="warning"
                showIcon
                title={`${conflicts.length} học viên bị trùng lịch (được tự huỷ miễn phí)`}
                description={conflicts.join(', ')}
              />
            )}
          </>
        ),
        okText: 'Lưu thay đổi',
        cancelText: 'Xem lại',
        onOk: () => save.mutateAsync(values),
      });
    } catch (error) {
      message.error(error.message);
    }
  };
}

/** Container form cấu hình lớp; chỉ chọn tài nguyên đang hoạt động. */
export function ClassFormModal({ item, onClose }) {
  const [form] = Form.useForm();
  const options = useClassOptions();
  const save = useScheduleMutation(
    (values) =>
      item
        ? service.updateClass(item.id, classFormPayload(values))
        : service.createClass(classFormPayload(values)),
    onClose,
  );
  const confirmUpdate = useUpdatePreview(item, save);
  return (
    <Modal
      open
      centered
      title={item ? 'Sửa lớp / đổi lịch' : 'Tạo lớp học'}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu lớp"
      cancelText="Hủy"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: options.isPending || options.isError }}
      width={960}
      className="scms-class-form-modal"
    >
      {options.isError && <Alert type="error" title={options.error.message} />}
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ focus: true }}
        initialValues={classFormValues(item)}
        onFinish={item ? confirmUpdate : save.mutate}
      >
        <Typography.Paragraph type="secondary" className="scms-class-form-intro">
          Thiết lập thông tin, thời gian đăng ký và lịch học hằng tuần của lớp.
        </Typography.Paragraph>
        <div className="scms-class-form-grid">
          <section className="scms-class-form-section" aria-label="Thông tin lớp">
            <Typography.Title level={5}>Thông tin lớp</Typography.Title>
            <ClassIdentityFields {...EMPTY_OPTIONS} {...options.data} />
          </section>
          <section className="scms-class-form-section" aria-label="Lịch học">
            <Typography.Title level={5}>Lịch học</Typography.Title>
            <ClassScheduleFields frames={options.data?.frames} />
          </section>
        </div>
      </Form>
    </Modal>
  );
}
