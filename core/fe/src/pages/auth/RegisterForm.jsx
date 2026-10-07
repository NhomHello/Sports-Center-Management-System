/* eslint-disable max-lines-per-function -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { Button, Form, Input, Typography } from 'antd';
import { Link } from 'react-router';
import { ROUTES, VALIDATION } from '@/constants';

/** Trường nhập tài khoản và kiểm tra dữ liệu trước khi gửi API đăng ký. */
export function RegisterForm({ form, mutation }) {
  return (
    <Form form={form} layout="vertical" onFinish={mutation.mutate}>
      <Form.Item
        name="fullName"
        label="Họ tên"
        rules={[
          { required: true, message: 'Nhập họ tên' },
          {
            min: VALIDATION.NAME_MIN_LENGTH,
            max: VALIDATION.NAME_MAX_LENGTH,
            message: 'Họ tên không hợp lệ',
          },
        ]}
      >
        <Input autoComplete="name" />
      </Form.Item>
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
      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[
          {
            required: true,
            min: VALIDATION.PASSWORD_MIN_LENGTH,
            message: `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
          },
          { max: VALIDATION.PASSWORD_MAX_LENGTH, message: 'Mật khẩu vượt quá độ dài cho phép' },
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Nhập lại mật khẩu"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Nhập lại mật khẩu' },
          ({ getFieldValue }) => ({
            validator: (_rule, value) =>
              !value || getFieldValue('password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('Mật khẩu không khớp')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
          Đăng ký
        </Button>
      </Form.Item>
      <Typography.Paragraph className="scms-login-register">
        Đã có tài khoản? <Link to={ROUTES.LOGIN}>Đăng nhập</Link>
      </Typography.Paragraph>
    </Form>
  );
}
