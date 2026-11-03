import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, App, Descriptions, Form, Modal, Select } from 'antd';
import { listMembers } from '@/services/member.service';
import { listClasses } from '@/services/schedule.service';
import { createCourseOrder } from '@/services/courseOrder.service';
import { formatCurrency } from '@/utils/format';
const OPTION_PAGE_SIZE = 100;
/** Bán khóa học tại quầy: server chốt giá trọn khóa theo số buổi còn lại và giữ chỗ có hạn. */
export function CounterInvoiceModal({ open, onClose, onCreated, initialMember }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [search, setSearch] = useState('');
  const memberId = Form.useWatch('memberId', form) ?? initialMember?.id;
  const classId = Form.useWatch('classId', form);
  const members = useQuery({
    queryKey: ['counter-course-members', search],
    queryFn: () => listMembers({ search }),
    enabled: open && !initialMember,
  });
  const courses = useQuery({
    queryKey: ['counter-course-options', memberId],
    queryFn: () =>
      listClasses({
        scope: 'open',
        paidOnly: true,
        pageSize: OPTION_PAGE_SIZE,
        ...(memberId && { memberId }),
      }),
    enabled: open,
  });
  const item = courses.data?.data.find((c) => c.id === classId);
  const save = useMutation({
    mutationFn: (values) =>
      createCourseOrder(values.classId, {
        memberId,
        channel: 'COUNTER',
        joinWaitlistWhenFull: true,
      }),
    onSuccess: ({ data, message: text }) => {
      form.resetFields();
      if (data.queued) {
        message.info(text);
        onClose();
      } else onCreated(data.id);
    },
  });
  return (
    <Modal
      open={open}
      title="Đăng ký khóa học tại quầy"
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Tạo hóa đơn / vào hàng chờ"
      cancelText="Đóng"
      confirmLoading={save.isPending}
      okButtonProps={{ disabled: !memberId || !item }}
    >
      <Alert
        type="info"
        showIcon
        title="Giá trọn khóa được chia theo số buổi còn lại. Khóa đầy sẽ vào hàng chờ, chưa tạo hóa đơn."
      />
      {[members, courses, save]
        .filter((q) => q.isError)
        .map((q) => (
          <Alert type="error" key={q.error.message} title={q.error.message} />
        ))}
      <Form
        form={form}
        layout="vertical"
        onFinish={save.mutate}
        initialValues={{ memberId: initialMember?.id }}
      >
        <MemberField initialMember={initialMember} members={members} setSearch={setSearch} />
        <Form.Item name="classId" label="Khóa học" rules={[{ required: true }]}>
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            options={(courses.data?.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            loading={courses.isFetching}
          />
        </Form.Item>
      </Form>
      <CoursePriceSummary item={item} />
    </Modal>
  );
}

function CoursePriceSummary({ item }) {
  if (!item) return null;
  return (
    <Descriptions
      bordered
      column={1}
      items={[
        { key: 'price', label: 'Giá trọn khóa', children: formatCurrency(item.price) },
        {
          key: 'sessions',
          label: 'Số buổi còn lại / tổng',
          children: `${item.remainingSessions}/${item.totalSessions}`,
        },
        { key: 'due', label: 'Học phí phải trả', children: formatCurrency(item.priceForRemaining) },
        { key: 'seats', label: 'Chỗ còn lại', children: item.seatsRemaining },
      ]}
    />
  );
}

function MemberField({ initialMember, members, setSearch }) {
  return (
    <Form.Item name="memberId" label="Hội viên" rules={[{ required: !initialMember }]}>
      <Select
        disabled={Boolean(initialMember)}
        showSearch={{ filterOption: false, onSearch: setSearch }}
        placeholder="Tìm hội viên"
        loading={members.isFetching}
        options={(initialMember ? [initialMember] : (members.data?.data ?? [])).map((m) => ({
          value: m.id,
          label: `${m.fullName} · ${m.phone || m.email || ''}`,
        }))}
      />
    </Form.Item>
  );
}
