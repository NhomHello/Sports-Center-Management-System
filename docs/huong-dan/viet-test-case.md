# Viết test case và test tự động

Test case của mỗi flow ghi trong file Excel `SWP391_TestCase.xlsx` (mỗi flow một sheet: `TC-AUTH-RBAC`, `TC-F1`, `TC-F2`, `TC-F3`) và có **test tự động** tương ứng ở `core/be/tests/*.test.js` (API) hoặc `core/fe/src/**/*.test.js` (logic thuần). ID trong file Excel trùng với tên `it('TC-XXX-01: …')` trong code để đối chiếu.

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
4. Test FE bằng Vitest cho logic thuần; Playwright cho luồng UI gọi API/DB thật, loading/error và desktop (giảng viên chỉ yêu cầu desktop, không kiểm thử mobile). Báo cáo, ảnh/trace nằm trong `playwright-report/`, `test-results/`.
5. Không test thứ thư viện đã đảm bảo (antd render đúng, Prisma ghi được).

## Chạy

```bash
npm test                    # tất cả workspace
npm test -w @scms/be        # BE (cần MySQL đang chạy: npm run db:up)
npm test -w @scms/fe        # FE
npm run verify:sprint2     # toàn bộ test và migration trên DB tạm
npm run test:e2e           # bốn vai trò, chỉ desktop 1366×900
npx vitest --project ... -t "TC-RBAC-02"   # một case (trong core/be)
```
