import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Form } from 'antd';
import { PROFILE_KEYS } from '@/constants/profile';
import * as service from '@/services/profile.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { CoachProfileForm } from './CoachProfileForm';

/** Hồ sơ HLV tự cập nhật, đồng bộ danh mục công khai và ảnh sau khi lưu. */
export function CoachProfilePanel() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [form] = Form.useForm();
  const query = useQuery({ queryKey: PROFILE_KEYS.OWN_COACH, queryFn: service.getOwnCoachProfile });
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: PROFILE_KEYS.OWN_COACH }),
      client.invalidateQueries({ queryKey: PROFILE_KEYS.COACHES }),
      client.invalidateQueries({ queryKey: ['coach-avatar'] }),
    ]);
  const save = useMutation({
    mutationFn: (data) =>
      service.saveOwnCoachProfile({
        ...data,
        publicEmail: data.publicEmail?.trim() || null,
        publicPhone: data.publicPhone?.trim() || null,
        zalo: data.zalo?.trim() || null,
      }),
    onSuccess: () => {
      message.success('Đã lưu hồ sơ HLV');
      refresh();
    },
    onError: (error) => form.setFields(error.toFormFields()),
  });
  const upload = useMutation({
    mutationFn: service.uploadCoachAvatar,
    onSuccess: refresh,
    onError: (error) => message.error(error.message),
  });
  return (
    <QueryState query={query}>
      {query.data && (
        <CoachProfileForm
          profile={query.data.data}
          form={form}
          save={save}
          upload={{
            isPending: upload.isPending,
            send: (file) => upload.mutateAsync(file).catch(() => undefined),
            rejectSize: () => message.error('Ảnh tối đa 2 MB'),
          }}
        />
      )}
    </QueryState>
  );
}
