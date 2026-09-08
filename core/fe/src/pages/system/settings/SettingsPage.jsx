import { PERMISSIONS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Col, Form, Row } from 'antd';
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoading } from '@/components/common/PageLoading';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as settingService from '@/services/setting.service';
import { SPACING } from '@/theme/theme';
import { SettingField } from './SettingField';

const COL_SPAN = { xs: 24, lg: 12 };

/** Chuyen string trong DB -> gia tri cho form theo type */
const fromDb = (setting) => {
  if (setting.type === 'NUMBER') return Number(setting.value);
  if (setting.type === 'BOOLEAN') return setting.value === 'true';
  return setting.value;
};

/** Form values -> payload { key, value: string } */
const toPayload = (values) =>
  Object.entries(values).map(([key, value]) => ({ key, value: String(value) }));

/** Trang cau hinh he thong: moi so nghiep vu chinh o day, khong sua code. */
export default function SettingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [form] = Form.useForm();
  const canUpdate = can(PERMISSIONS.SETTING_UPDATE);

  const settingsQuery = useQuery({
    queryKey: QUERY_KEYS.SETTINGS,
    queryFn: settingService.listSettings,
  });
  const groups = useMemo(() => settingsQuery.data?.data ?? [], [settingsQuery.data]);

  useEffect(() => {
    const initial = Object.fromEntries(
      groups.flatMap((g) => g.items.map((s) => [s.key, fromDb(s)])),
    );
    form.setFieldsValue(initial);
  }, [groups, form]);

  const saveMutation = useMutation({
    mutationFn: (values) => settingService.updateSettings(toPayload(values)),
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTINGS });
    },
    onError: (error) => message.error(error.message),
  });

  if (settingsQuery.isPending) return <PageLoading />;

  return (
    <Form form={form} layout="vertical" onFinish={saveMutation.mutate} disabled={!canUpdate}>
      <PageHeader
        title="Cấu hình hệ thống"
        subtitle="Số ngày nhắc gia hạn, giờ huỷ lớp, thời gian chờ thanh toán..."
        extra={
          canUpdate && (
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              Lưu thay đổi
            </Button>
          )
        }
      />
      <Row gutter={[SPACING.MD, SPACING.MD]}>
        {groups.map((group) => (
          <Col key={group.group} {...COL_SPAN}>
            <Card title={group.group} size="small">
              {group.items.map((setting) => (
                <SettingField key={setting.key} setting={setting} />
              ))}
            </Card>
          </Col>
        ))}
      </Row>
    </Form>
  );
}
