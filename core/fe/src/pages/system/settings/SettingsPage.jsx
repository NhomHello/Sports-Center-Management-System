/* eslint-disable max-lines-per-function -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { PERMISSIONS, SETTING_GROUPS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Empty, Form, Row, Space, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoading } from '@/components/common/PageLoading';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as settingService from '@/services/setting.service';
import { SPACING } from '@/theme/theme';
import {
  getApiAvailabilityNotice,
  getApiOperationErrorMessage,
  shouldRetryApiQuery,
} from '@/utils/apiAvailability';
import { SettingField } from './SettingField';
import { getSettingFormValues, getChangedSettingPayload } from '@/utils/settings';

const COL_SPAN = { xs: 24, lg: 12 };
const GROUP_LABELS = Object.freeze({
  [SETTING_GROUPS.CENTER]: 'Thông tin trung tâm',
  [SETTING_GROUPS.MEMBERSHIP]: 'Hội viên',
  [SETTING_GROUPS.CLASS]: 'Lớp học',
  [SETTING_GROUPS.PAYMENT]: 'Thanh toán',
});

/** Trang cau hinh he thong: moi so nghiep vu chinh o day, khong sua code. */
export default function SettingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const canUpdate = can(PERMISSIONS.SETTING_UPDATE);

  const settingsQuery = useQuery({
    queryKey: QUERY_KEYS.SETTINGS,
    queryFn: settingService.listSettings,
    retry: shouldRetryApiQuery,
  });
  const groups = useMemo(() => settingsQuery.data?.data ?? [], [settingsQuery.data]);

  useEffect(() => {
    // Chua co data thi Form chua render (dang PageLoading) -> khong goi setFieldsValue
    if (groups.length === 0) return;
    form.setFieldsValue(getSettingFormValues(groups));
  }, [groups, form]);

  const saveMutation = useMutation({
    mutationFn: (values) => settingService.updateSettings(getChangedSettingPayload(values, groups)),
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTINGS });
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(getApiOperationErrorMessage(error, 'lưu cấu hình'));
    },
  });

  if (settingsQuery.isPending) return <PageLoading />;
  if (settingsQuery.isError) {
    const notice = getApiAvailabilityNotice(settingsQuery.error, 'Cấu hình hệ thống');
    return (
      <>
        <PageHeader title="Cấu hình hệ thống" />
        <Alert
          showIcon
          type={notice.type}
          message={notice.message}
          description={notice.description}
          action={
            notice.retryable && (
              <Button type="link" onClick={() => settingsQuery.refetch()}>
                Thử lại
              </Button>
            )
          }
        />
      </>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={saveMutation.mutate}
      disabled={!canUpdate || saveMutation.isPending}
      onValuesChange={(_changed, values) =>
        setHasChanges(getChangedSettingPayload(values, groups).length > 0)
      }
    >
      <PageHeader
        title="Cấu hình hệ thống"
        subtitle="Số ngày nhắc gia hạn, giờ huỷ lớp, thời gian chờ thanh toán..."
        extra={
          canUpdate ? (
            <Space>
              <Button
                disabled={!hasChanges}
                onClick={() => {
                  form.setFieldsValue(getSettingFormValues(groups));
                  setHasChanges(false);
                  saveMutation.reset();
                }}
              >
                Hủy thay đổi
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!hasChanges}
                loading={saveMutation.isPending}
              >
                Lưu thay đổi
              </Button>
            </Space>
          ) : (
            <Tag>Chỉ xem</Tag>
          )
        }
      />
      {saveMutation.isError && (
        <Alert
          showIcon
          type="error"
          message={getApiOperationErrorMessage(saveMutation.error, 'lưu cấu hình')}
        />
      )}
      <Row gutter={[SPACING.MD, SPACING.MD]}>
        {groups.map((group) => (
          <Col key={group.group} {...COL_SPAN}>
            <Card title={GROUP_LABELS[group.group] ?? group.group} size="small">
              {group.items.map((setting) => (
                <SettingField key={setting.key} setting={setting} />
              ))}
            </Card>
          </Col>
        ))}
      </Row>
      {groups.length === 0 && <Empty description="API chưa trả về cấu hình nào." />}
    </Form>
  );
}
