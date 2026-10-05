/* eslint-disable max-lines -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusTag } from '@/components/common/StatusTag';
import { QUERY_KEYS, ROUTES, USER_STATUS_META, VALIDATION } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import * as memberService from '@/services/member.service';
import { SPACING } from '@/theme/theme';
import {
  getApiAvailabilityNotice,
  getApiOperationErrorMessage,
  shouldRetryApiQuery,
} from '@/utils/apiAvailability';
import { normalizeOwnProfilePayload } from '@/utils/account';
import { Link } from 'react-router';
import { ProfileMemberships } from './ProfileMemberships';

function ProfileSummary({ profile }) {
  return (
    <Card className="scms-profile-card" variant="borderless">
      <div className="scms-profile-card__identity">
        <Avatar size={88} className="scms-profile-card__avatar">
          {profile.fullName?.slice(0, 1)}
        </Avatar>
        <Typography.Title level={3}>{profile.fullName}</Typography.Title>
        <Space wrap>
          {profile.role?.name && <Tag color="blue">{profile.role.name}</Tag>}
          <StatusTag value={profile.status} meta={USER_STATUS_META} />
        </Space>
      </div>
      <div className="scms-profile-card__details">
        <div>
          <Typography.Text type="secondary">Email</Typography.Text>
          <Typography.Text strong>{profile.email || 'Chưa cập nhật'}</Typography.Text>
        </div>
        <div>
          <Typography.Text type="secondary">Số điện thoại</Typography.Text>
          <Typography.Text strong>{profile.phone || 'Chưa cập nhật'}</Typography.Text>
        </div>
      </div>
    </Card>
  );
}

function ProfileForm({ form, profile, mutation }) {
  return (
    <Card title="Thông tin cá nhân" className="scms-profile-form">
      {mutation.isError && (
        <Alert
          showIcon
          type="error"
          message={getApiOperationErrorMessage(mutation.error, 'cập nhật hồ sơ')}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={profile}
        onFinish={mutation.mutate}
        disabled={mutation.isPending}
      >
        <Row gutter={SPACING.MD}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: 'Nhập họ tên' },
                {
                  min: VALIDATION.NAME_MIN_LENGTH,
                  max: VALIDATION.NAME_MAX_LENGTH,
                  message: 'Họ tên không hợp lệ',
                },
              ]}
            >
              <Input maxLength={VALIDATION.NAME_MAX_LENGTH} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                {
                  validator: (_rule, value) =>
                    !value || VALIDATION.PHONE_PATTERN.test(value.trim())
                      ? Promise.resolve()
                      : Promise.reject(new Error('Số điện thoại không hợp lệ')),
                },
              ]}
            >
              <Input autoComplete="tel" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Lưu thay đổi
          </Button>
          <Button
            onClick={() => {
              form.setFieldsValue(profile);
              mutation.reset();
            }}
          >
            Hủy thay đổi
          </Button>
        </Space>
      </Form>
    </Card>
  );
}

function ProfileContent({ query }) {
  if (query.isPending) return <Card loading />;
  if (query.isError) {
    const notice = getApiAvailabilityNotice(query.error, 'Hồ sơ cá nhân');
    return (
      <Alert
        showIcon
        type={notice.type}
        message={notice.message}
        description={notice.description}
        action={notice.retryable && <Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  }
  const profile = query.data?.data;
  return profile ? (
    <ProfileSummary profile={profile} />
  ) : (
    <Empty description="Không tìm thấy hồ sơ tài khoản." />
  );
}

/** Xem và cập nhật hồ sơ, trạng thái tài khoản, membership của người đang đăng nhập. */
export default function ProfilePage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const queryKey = [...QUERY_KEYS.MEMBERS, 'me', user?.id];
  const profileQuery = useQuery({
    queryKey,
    queryFn: memberService.getOwnProfile,
    retry: shouldRetryApiQuery,
  });
  const profile = profileQuery.data?.data;
  const mutation = useMutation({
    mutationFn: (values) => memberService.updateOwnProfile(normalizeOwnProfilePayload(values)),
    onSuccess: ({ data, message: resultMessage }) => {
      queryClient.setQueryData(queryKey, { data });
      queryClient.setQueryData(
        QUERY_KEYS.ME,
        (current) =>
          current && {
            ...current,
            data: {
              ...current.data,
              user: {
                ...current.data.user,
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
              },
            },
          },
      );
      message.success(resultMessage || 'Cập nhật hồ sơ thành công');
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(getApiOperationErrorMessage(error, 'cập nhật hồ sơ'));
    },
  });

  useEffect(() => {
    if (profile) form.setFieldsValue(profile);
  }, [form, profile]);

  const hasProfile = Boolean(profile) && !profileQuery.isError;

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Thông tin tài khoản và gói tập hiện tại"
        extra={
          <Link to={ROUTES.CHANGE_PASSWORD}>
            <Button type="primary">Đổi mật khẩu</Button>
          </Link>
        }
      />
      <Row gutter={[SPACING.LG, SPACING.LG]}>
        <Col xs={24} lg={8}>
          <ProfileContent query={profileQuery} />
        </Col>
        <Col xs={24} lg={16}>
          <Space orientation="vertical" size={SPACING.LG} className="scms-full-width">
            {hasProfile && <ProfileForm form={form} profile={profile} mutation={mutation} />}
            {hasProfile && <ProfileMemberships profile={profile} />}
          </Space>
        </Col>
      </Row>
    </>
  );
}
