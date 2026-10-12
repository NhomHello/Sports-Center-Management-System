# Sprint 1 – FE – Khải

- Nhánh: `sprint-1/fe-khai`
- Thời gian: 21/09 → 05/10
- Nguồn code: nhánh `khoi` (Khôi đã làm trước cho Flow 1–4)

## Function phụ trách

| # | US | Function | Trạng thái trên nhánh khoi | Ghi chú |
|---|---|---|---|---|
| 13 | UC-UM-03 | Xem gói đang bán và gói hiện tại | ✅ Khôi đã làm (BE+FE) | /membership-plans + /memberships/me |
| 14 | UC-UM-05 | Đăng ký hội viên tại quầy | ✅ Khôi đã làm (BE+FE) | POST /members + MemberFormModal |
| 15 | UC-UM-06 | Tìm kiếm hội viên | ✅ Khôi đã làm (BE+FE) | GET /members (tìm kiếm) + MembersPage |
| 16 | UC-UM-14 | Xem chi tiết hội viên | ✅ Khôi đã làm (BE+FE) | GET/PATCH /members/:id + MembersPage |
| 17 | UC-UM-19 | Nhân viên cập nhật hồ sơ hội viên | ✅ Khôi đã làm (BE+FE) | GET/PATCH /members/:id + MembersPage |
| 18 | UC-UM-07 | Mua / gia hạn hộ tại quầy | ✅ Khôi đã làm (BE+FE) | POST /memberships/orders + MemberMembershipModal |
| 19 | UC-UM-08 | Danh sách gói tập | ✅ Khôi đã làm (BE+FE) | module membership-plan + MembershipPlansPage |
| 20 | UC-UM-08 | Tạo / sửa gói tập | ✅ Khôi đã làm (BE+FE) | module membership-plan + MembershipPlansPage |
| 21 | UC-UM-08 | Ngừng bán / xoá gói | ✅ Khôi đã làm (BE+FE) | module membership-plan + MembershipPlansPage |

## Cách làm

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-1/fe-khai`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/fe/src/pages/members/MembersPage.jsx` |  |
| `core/fe/src/pages/members/MemberFormModal.jsx` |  |
| `core/fe/src/pages/members/MemberMembershipModal.jsx` |  |
| `core/fe/src/pages/membership/MembershipPlansPage.jsx` |  |
| `core/fe/src/pages/membership/MembershipPlanFormModal.jsx` |  |
| `core/fe/src/hooks/useMembershipPlans.js` |  |
| `core/fe/src/services/member.service.js` | Khôi dùng getOwn/updateOwn cho màn hồ sơ |
| `core/fe/src/services/membership.service.js` |  |
| `core/fe/src/services/membershipPlan.service.js` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/fe/src/router/routeRegistry.jsx` | Route members, membership-plans |
| `core/fe/src/constants/index.js` | QUERY_KEYS phần mình |
