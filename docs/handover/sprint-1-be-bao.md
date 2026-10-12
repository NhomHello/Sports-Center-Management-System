# Sprint 1 – BE – Bảo

- Nhánh: `sprint-1/be-bao`
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

1. Chuyển sang nhánh: `git fetch` rồi `git switch sprint-1/be-bao`.
2. File **lấy toàn bộ**: `git checkout origin/khoi -- <đường dẫn>`.
3. File **lấy một phần**: xem bằng `git show origin/khoi:<đường dẫn>` và chỉ chép phần ghi ở cột "Phần cần lấy". File dùng chung (schema, routes, permissions…) nhiều người cùng sửa, nên merge theo thứ tự sprint để tránh conflict.
4. Đọc hiểu, đối chiếu Business Rule trong file Excel, sửa chỗ còn thiếu, chạy `npm run lint` và `npm test`.
5. Commit bằng tài khoản của mình. Commit nào dùng lại code của Khôi thì thêm dòng cuối: `Co-authored-by: kitter <longhuy0078@gmail.com>`.
6. Mở PR vào `main`, nhờ một thành viên khác review rồi mới merge.

## File lấy toàn bộ từ nhánh khoi

| File | Ghi chú |
|---|---|
| `core/be/prisma/seed/membership-plans.seed.js` |  |
| `core/be/src/modules/membership-plan/membership-plan.controller.js` |  |
| `core/be/src/modules/membership-plan/membership-plan.routes.js` |  |
| `core/be/src/modules/membership-plan/membership-plan.service.js` |  |
| `core/be/src/modules/membership-plan/membership-plan.validation.js` |  |
| `docs/test-cases/TC-F1-membership.md` |  |

## File lấy một phần

| File | Phần cần lấy |
|---|---|
| `core/be/prisma/schema.prisma` | Model MembershipPlan, Membership, hồ sơ hội viên |
| `core/be/prisma/seed/roles.seed.js` | Quyền member/membership/membership-plan |
| `core/shared/src/permissions.js` | MEMBER_*, MEMBERSHIP_*, MEMBERSHIP_PLAN_* |
| `core/be/src/routes.js` | Đăng ký /members, /membership-plans, /memberships |
| `core/be/src/modules/member/member.controller.js` | list, create, getById, updateMember |
| `core/be/src/modules/member/member.routes.js` | GET/POST /members, GET/PATCH /members/:id |
| `core/be/src/modules/member/member.service.js` | Tìm kiếm, tạo, xem, sửa hội viên |
| `core/be/src/modules/member/member.validation.js` | listMembersSchema, createMemberSchema, updateMemberSchema |
| `core/be/src/modules/membership/membership.controller.js` | listOwn, list, createOrder |
| `core/be/src/modules/membership/membership.routes.js` | GET /me, GET /, POST /orders (bỏ /me/orders) |
| `core/be/src/modules/membership/membership.service.js` | listForUser, list, createOrder, activatePaidInvoice |
| `core/be/src/modules/membership/membership.validation.js` | listMembershipsSchema, createCounterOrderSchema |
| `core/be/tests/flows.test.js` | Test hội viên / gói / mua tại quầy |
