import { useState } from 'react';
import { Popconfirm, Select } from 'antd';
/** Chọn vai trò chưa ghi ngay; yêu cầu xác nhận giá trị mới. */
export function RoleChangeSelect({ user, options, onChange }) {
  const [pending, setPending] = useState(null);
  return (
    <Popconfirm
      open={pending !== null}
      title="Xác nhận đổi vai trò?"
      description="Quyền truy cập của tài khoản sẽ thay đổi."
      okText="Đổi vai trò"
      cancelText="Huỷ"
      onConfirm={() => {
        onChange(user, pending);
        setPending(null);
      }}
      onCancel={() => setPending(null)}
    >
      <Select
        size="small"
        style={{ width: 180 }}
        value={pending ?? user.role.id}
        options={options}
        onChange={(id) => {
          if (id !== user.role.id) setPending(id);
        }}
      />
    </Popconfirm>
  );
}
