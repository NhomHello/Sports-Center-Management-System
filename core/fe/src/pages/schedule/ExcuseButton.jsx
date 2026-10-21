import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Modal, Tag, Typography } from 'antd';
import { PERMISSIONS as P } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { excuseSession } from '@/services/purchase.service';
import { formatDateTime } from '@/utils/format';

const CLOCK_TICK_MS = 1000;
const isExcused = (session) =>
  session.attendanceStatus === 'EXCUSED' || session.attendance?.status === 'EXCUSED';
function excuseNotice(session, now) {
  if (session.status !== 'SCHEDULED' || new Date(session.startAt).getTime() <= now) return '';
  const deadline = new Date(session.excuseDeadline).getTime();
  if (!Number.isFinite(deadline)) return 'Chưa có hạn báo nghỉ từ hệ thống.';
  if (now > deadline) return 'Đã quá hạn báo nghỉ';
  if (session.canExcuse === false) return session.excuseReason || 'Không thể báo nghỉ buổi này';
  return null;
}

function ExcuseConfirmation({ open, close, mutation, deadline }) {
  return (
    <Modal
      open={open}
      title="Báo nghỉ buổi học"
      okText="Xác nhận báo nghỉ"
      cancelText="Đóng"
      confirmLoading={mutation.isPending}
      onOk={() => mutation.mutate()}
      onCancel={() => {
        if (!mutation.isPending) close();
      }}
    >
      <Typography.Paragraph>
        Buổi này được ghi Xin nghỉ, không tính vắng và không phát sinh hoàn tiền. Đăng ký cả khóa
        vẫn được giữ.
      </Typography.Paragraph>
      <Typography.Paragraph>Hạn báo nghỉ: {formatDateTime(deadline)}</Typography.Paragraph>
      {mutation.isError && <Alert showIcon type="error" title={mutation.error.message} />}
    </Modal>
  );
}

/** GY-31: deadline do BE/caller cung cấp, không dùng hạn hủy toàn lớp cho từng buổi. */
export function ExcuseButton({ session, memberId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [excused, setExcused] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const { user } = useAuth();
  const { can } = usePermission();
  const { message } = App.useApp();
  const client = useQueryClient();
  const actingForOther = Boolean(memberId && memberId !== user?.id);
  const allowed = can(actingForOther ? P.CLASS_ENROLL_FOR_MEMBER : P.CLASS_CANCEL_SELF);
  const mutation = useMutation({
    mutationFn: () => excuseSession(session.id, actingForOther ? memberId : undefined),
    onSuccess: async () => {
      setExcused(true);
      setOpen(false);
      message.success('Đã báo nghỉ buổi học');
      await Promise.all(
        [QUERY_KEYS.SCHEDULE, QUERY_KEYS.NOTIFICATIONS].map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      );
      onSuccess?.();
    },
  });
  if (!allowed) return null;
  if (excused || isExcused(session)) return <Tag color="blue">Xin nghỉ</Tag>;
  const notice = excuseNotice(session, now);
  if (notice !== null)
    return notice ? <Typography.Text type="secondary">{notice}</Typography.Text> : null;
  const deadline = session.excuseDeadline;
  return (
    <>
      <Button
        onClick={() => {
          mutation.reset();
          setOpen(true);
        }}
      >
        Báo nghỉ
      </Button>
      <ExcuseConfirmation
        open={open}
        close={() => setOpen(false)}
        mutation={mutation}
        deadline={deadline}
      />
    </>
  );
}
