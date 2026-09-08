# Test case

Mỗi flow có **một file tài liệu** `TC-<flow>-<ten>.md` (bảng dưới) và **test tự động** tương ứng ở `core/be/tests/*.test.js` (API) hoặc `core/fe/src/**/*.test.js` (logic thuần). ID trong file `.md` trùng với tên `it('TC-XXX-01: …')` trong code để đối chiếu.

## Mẫu bảng

| ID          | Mục tiêu                          | Tiền điều kiện                 | Bước thực hiện                          | Dữ liệu                      | Kết quả mong đợi                            | Tự động? | Trạng thái |
| ----------- | --------------------------------- | ------------------------------ | --------------------------------------- | ---------------------------- | ------------------------------------------- | -------- | ---------- |
| TC-F1-01    | Đăng ký tài khoản thành công       | Email chưa tồn tại             | POST /auth/register                     | email mới, pass ≥ 8          | 201, user có role mặc định                  | ✅ auth.test | Pass    |

Quy ước ID: `TC-<khu vực>-<số>`; khu vực = `AUTH`, `RBAC`, `ROLE`, `USER`, `SET` (setting), `F1`, `F2`, `F3`, `UI`.
Trạng thái: `Pass` / `Fail` / `Blocked` / `Chưa chạy`. Cập nhật khi review PR.

## Nguyên tắc viết test case

1. Mỗi **business rule** trong kế hoạch = ít nhất 1 test case dương + 1 âm (ví dụ BR "không đăng ký khi lớp đầy": TC đăng ký lớp còn chỗ → 201; TC lớp đầy → 422).
2. Luôn có test **không có quyền → 403** cho mỗi endpoint mới.
3. Test API dùng supertest + DB dev (docker). Dữ liệu tạo trong test có tiền tố `TEST_` và tự dọn trong `afterAll`.
4. Test FE chỉ cho logic thuần (utils, hooks không phụ thuộc DOM). UI test thủ công theo file `.md`, đính ảnh vào PR.
5. Không test thứ thư viện đã đảm bảo (antd render đúng, Prisma ghi được).

## Chạy

```bash
npm test                    # tất cả workspace
npm test -w @scms/be        # BE (cần MySQL đang chạy: npm run db:up)
npm test -w @scms/fe        # FE
npx vitest --project ... -t "TC-RBAC-02"   # một case (trong core/be)
```

## Danh sách file

| File                                     | Phạm vi                                       | Test tự động                    |
| ---------------------------------------- | --------------------------------------------- | ------------------------------- |
| [TC-AUTH-RBAC.md](TC-AUTH-RBAC.md)       | Đăng nhập, đăng ký, /me, phân quyền động, role CRUD | `tests/auth.test.js`, `tests/rbac.test.js`, `tests/role.test.js` |
| TC-F1-membership.md                      | (Flow 1 – Nhanh/Bảo viết)                     |                                 |
| TC-F2-class-booking.md                   | (Flow 2 – Bảo viết)                           |                                 |
| TC-F3-payment-report.md                  | (Flow 3 – Nhanh viết, gồm SePay webhook)      |                                 |
