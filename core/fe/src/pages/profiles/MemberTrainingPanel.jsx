import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form } from 'antd';
import dayjs from 'dayjs';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { PROFILE_KEYS } from '@/constants/profile';
import * as service from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { MemberTrainingFields } from './MemberTrainingFields';

/** Hồ sơ chính chủ và sửa hộ dùng cùng form/contract, quyền kiểm tra cả FE và BE. */
export function MemberTrainingPanel({ memberId }) {
  const { can } = usePermission();
  const { message } = App.useApp();
  const client = useQueryClient();
  const [form] = Form.useForm();
  const key = [...PROFILE_KEYS.OWN_MEMBER, memberId];
  const editable = can(memberId ? P.MEMBER_UPDATE : P.MEMBER_PROFILE_UPDATE_OWN);
  const query = useQuery({ queryKey: key, queryFn: () => service.getMemberProfile(memberId) });
  const save = useMutation({
    mutationFn: ({ birthDate, ...values }) =>
      service.saveMemberProfile(memberId, {
        ...values,
        birthDate: birthDate?.format('YYYY-MM-DD') ?? null,
        gender: values.gender ?? null,
        heightCm: values.heightCm ?? null,
        weightKg: values.weightKg ?? null,
        emergencyName: values.emergencyName?.trim() || null,
        emergencyPhone: values.emergencyPhone?.trim() || null,
      }),
    onSuccess: () => {
      message.success('Đã lưu hồ sơ tập luyện');
      client.invalidateQueries({ queryKey: key });
      client.invalidateQueries({ queryKey: PROFILE_KEYS.STUDENTS });
    },
    onError: (error) => form.setFields(error.toFormFields()),
  });
  const data = query.data?.data;
  return (
    <QueryState query={query}>
      {data && (
        <Form
          key={query.dataUpdatedAt}
          form={form}
          layout="vertical"
          initialValues={{ ...data, birthDate: data.birthDate ? dayjs(data.birthDate) : null }}
          onFinish={save.mutate}
          disabled={!editable || save.isPending}
        >
          <MemberTrainingFields />
          {save.isError && <Alert type="error" showIcon title={save.error.message} />}
          {editable && (
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              Lưu hồ sơ tập luyện
            </Button>
          )}
        </Form>
      )}
    </QueryState>
  );
}
