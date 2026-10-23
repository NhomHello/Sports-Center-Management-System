import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Card, Empty, Form, Tag } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { freezeMembership, resumeMembership } from '@/services/sprint3.service';
import { QUERY_KEYS } from '@/constants';
import { FreezeRequest } from './FreezeRequest';
import { FreezeHistory } from './FreezeHistory';
import './membershipOverview.css';

function useFreezeMutation(membership) {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [form] = Form.useForm();
  const mutation = useMutation({
    mutationFn: ({ resume, dates }) =>
      resume
        ? resumeMembership(membership.id)
        : freezeMembership(membership.id, {
            from: dates[0].format('YYYY-MM-DD'),
            to: dates[1].format('YYYY-MM-DD'),
          }),
    onSuccess: () => {
      message.success('Đã cập nhật bảo lưu');
      form.resetFields();
      [QUERY_KEYS.MEMBERS, ['ownMembership'], ['profile'], ['freeze-current']].forEach((queryKey) =>
        client.invalidateQueries({ queryKey }),
      );
    },
  });
  return { form, mutation };
}

/** Dùng đúng dữ liệu kỳ gói của khai; không dựng ngân sách khi API chưa trả. */
export function FreezeControls({ membership, own = false }) {
  const { can } = usePermission();
  const { form, mutation } = useFreezeMutation(membership);
  if (!can(own ? PERMISSIONS.MEMBERSHIP_FREEZE_SELF : PERMISSIONS.MEMBERSHIP_FREEZE_ALL))
    return null;
  const freezes = membership?.freezes ?? [];
  const current = freezes.find((freeze) => !freeze.endedAt);
  return (
    <Card
      className="scms-freeze-card"
      title="Bảo lưu gói tập"
      role="region"
      aria-label="Quản lý bảo lưu"
      extra={
        current && <Tag color="warning">{membership.isFrozen ? 'Đang bảo lưu' : 'Đã đặt lịch'}</Tag>
      }
    >
      {membership ? (
        <div className="scms-freeze-content">
          <Alert
            type="info"
            showIcon
            title="Lưu ý trước khi bảo lưu"
            description="Hủy các đăng ký trùng khoảng bảo lưu trước khi gửi. Giới hạn ngày và số lượt do trung tâm cấu hình. Kết thúc sớm chỉ cộng số ngày thực dừng."
          />
          <div className="scms-freeze-grid">
            <section aria-label="Yêu cầu bảo lưu">
              <FreezeRequest form={form} mutation={mutation} current={current} />
              {mutation.isError && <Alert type="error" showIcon title={mutation.error.message} />}
            </section>
            <FreezeHistory freezes={freezes} />
          </div>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có gói tập để quản lý bảo lưu"
        />
      )}
    </Card>
  );
}
