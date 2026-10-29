import { Alert, Button, Form, Input, InputNumber, Select, Space, Switch, Upload } from 'antd';
import { CoachAvatar } from './CoachAvatar';

/** Biểu mẫu dùng giới hạn giới thiệu/ảnh từ API, chuyên môn do quản lý khai báo. */
export function CoachProfileForm({ profile, form, save, upload }) {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={profile}
      onFinish={save.mutate}
      disabled={save.isPending}
    >
      <Space wrap>
        <CoachAvatar profile={profile} size={88} />
        <Upload
          accept="image/png,image/jpeg"
          showUploadList={false}
          beforeUpload={async (file) => {
            if (file.size > profile.avatarMaxBytes) {
              upload.rejectSize();
              return Upload.LIST_IGNORE;
            }
            await upload.send(file);
            return false;
          }}
        >
          <Button loading={upload.isPending}>Tải ảnh đại diện JPG/PNG (tối đa 2 MB)</Button>
        </Upload>
      </Space>
      <Alert
        type="info"
        title="Chuyên môn bộ môn do quản lý khai báo. Liên hệ công khai tách khỏi thông tin đăng nhập."
      />
      <Form.Item name="bio" label="Giới thiệu">
        <Input.TextArea rows={4} maxLength={profile.bioMaxLength} showCount />
      </Form.Item>
      <Form.Item name="experienceYears" label="Số năm kinh nghiệm" rules={[{ required: true }]}>
        <InputNumber min={0} precision={0} />
      </Form.Item>
      <Form.Item name="certifications" label="Chứng chỉ">
        <Select mode="tags" placeholder="Nhập chứng chỉ rồi nhấn Enter" />
      </Form.Item>
      <Form.Item name="publicEmail" label="Email liên hệ công khai" rules={[{ type: 'email' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="publicPhone" label="Số điện thoại công khai">
        <Input />
      </Form.Item>
      <Form.Item name="zalo" label="Số Zalo">
        <Input />
      </Form.Item>
      <Form.Item
        name="showContact"
        label="Hiện thông tin liên hệ cho hội viên"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      {save.isError && <Alert type="error" showIcon title={save.error.message} />}
      <Button type="primary" htmlType="submit" loading={save.isPending}>
        Lưu hồ sơ HLV
      </Button>
    </Form>
  );
}
