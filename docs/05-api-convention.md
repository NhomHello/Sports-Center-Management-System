# 05 · Chuẩn API

Base URL: `${API_URL}` = `http://localhost:3000/api/v1` (đổi bằng `.env`, không hardcode).
Xác thực: header `Authorization: Bearer <accessToken>` (lấy từ `POST /auth/login`).

## Response thành công (luôn cùng khuôn)

```json
{ "success": true, "message": "OK", "data": { … } }
{ "success": true, "message": "OK", "data": [ … ], "meta": { "page": 1, "pageSize": 10, "total": 57, "totalPages": 6 } }
```
BE: `sendSuccess(res, { data, meta, message })`, `sendCreated(res, data)` (201), `sendNoContent(res)` (204, không body).
FE: `http.get()` trả thẳng body này (đã unwrap), dùng `res.data`, `res.meta`, `res.message`.

## Response lỗi

```json
{ "success": false, "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ",
  "details": [ { "field": "email", "message": "Email không hợp lệ" } ] }
```

| HTTP | code                    | Khi nào                                             | BE ném                          |
| ---- | ----------------------- | --------------------------------------------------- | ------------------------------- |
| 400  | VALIDATION_ERROR        | body/query/params sai schema, JSON hỏng             | `validate()` tự ném / `ApiError.badRequest` |
| 401  | UNAUTHORIZED            | thiếu/sai token                                     | `ApiError.unauthorized()`       |
| 401  | TOKEN_EXPIRED           | token hết hạn (FE tự logout)                        | tự động                         |
| 401  | INVALID_CREDENTIALS     | sai email/mật khẩu                                  | auth.service                    |
| 403  | FORBIDDEN               | không có permission                                 | `authorize()` tự ném            |
| 403  | ACCOUNT_INACTIVE        | tài khoản bị khoá                                   | tự động                         |
| 404  | NOT_FOUND               | không có record / route                             | `ApiError.notFound()`           |
| 409  | CONFLICT                | trùng unique (email, code)                          | Prisma P2002 tự map             |
| 422  | BUSINESS_RULE_VIOLATION | vi phạm nghiệp vụ (gói hết hạn, lớp đầy, trùng giờ) | `ApiError.businessRule('…')`    |
| 429  | –                       | quá rate limit                                      | tự động                         |
| 500  | INTERNAL_ERROR          | lỗi không lường (log đầy đủ, dev thấy `stack`)      | không ném tay                   |

FE xử lý theo `error.code` (từ `ERROR_CODES` của `@scms/shared`), hiển thị `error.message`, field lỗi qua `error.toFormFields()`.

## URL & method

| Việc                     | Method + URL                            | Ghi chú                                 |
| ------------------------ | --------------------------------------- | --------------------------------------- |
| Danh sách (phân trang)   | `GET /classes?page=1&pageSize=10&search=yoga&subjectId=2` | dùng `paginationQuerySchema.extend` |
| Chi tiết                 | `GET /classes/:id`                      |                                         |
| Tạo                      | `POST /classes` → 201                   |                                         |
| Sửa toàn bộ / một phần   | `PUT /classes/:id` / `PATCH /classes/:id/status` | PATCH cho hành động con         |
| Xoá                      | `DELETE /classes/:id` → 204             | xoá mềm thì `PATCH …/status`            |
| Hành động nghiệp vụ      | `POST /classes/:id/enrollments`, `DELETE /classes/:id/enrollments/me` | danh từ, không động từ trong URL |
| "Của tôi"                | `GET /memberships/me`, `GET /schedule/me` | lọc theo `req.user.id` trong service |
| Webhook bên ngoài        | `POST /webhooks/sepay`                  | không `authenticate`, xác thực chữ ký riêng |

- Tên tài nguyên: **số nhiều, kebab-case** (`/membership-plans`). ID là số nguyên.
- Query filter: camelCase (`subjectId`, `fromDate`). Ngày dạng ISO `YYYY-MM-DD`; thời điểm ISO 8601 có timezone.
- Tiền: số nguyên VND (không thập phân).

## Phân trang

Request `page` (từ 1), `pageSize` (mặc định 10, tối đa 100). Response `meta` như trên. BE: `toPrismaPage(query)` + `buildPageMeta`. FE: `useTableQuery()`.

## Validation (Zod 4)

- Mọi input đi qua `validate({ body, query, params })`; controller đọc `req.validated.*`, **không** đọc `req.body` trực tiếp.
- Message lỗi bằng tiếng Việt có dấu, nói rõ cần gì: `'Mật khẩu tối thiểu 8 ký tự'`.
- Giới hạn độ dài lấy từ `VALIDATION.*` trong constants, không viết số trong schema.

## Ví dụ nhanh

```bash
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@scms.local","password":"Admin@123"}'
curl http://localhost:3000/api/v1/roles -H "Authorization: Bearer <token>"
curl http://localhost:3000/api/v1/health
```

## Endpoint hiện có (khung)

| Module     | Endpoint                                                                   | Permission                     |
| ---------- | -------------------------------------------------------------------------- | ------------------------------ |
| health     | `GET /health`                                                              | –                              |
| auth       | `POST /auth/login`, `POST /auth/register`, `POST /auth/password-changes`, `GET /auth/me` | – / – / đăng nhập / đăng nhập |
| permission | `GET /permissions`                                                         | role.read                      |
| role       | `GET/POST /roles`, `GET/PUT/DELETE /roles/:id`, `PATCH /roles/:id/default` | role.read / create / update / delete |
| user       | `GET/POST /users`, `GET /users/:id`, `PATCH /users/:id/role`, `PATCH /users/:id/status` | user.read / create / assign_role / update |
| setting    | `GET /settings`, `PUT /settings`                                           | setting.read / update          |
| member     | `GET/PATCH /members/me`                                                    | đăng nhập                      |
| notification | `GET /notifications`, `PATCH /notifications/read`, `PATCH /notifications/:id/read` | đăng nhập              |
| payment    | `POST /payments/invoices/:invoiceId/cash`                                  | payment.record_cash            |
| invoice    | `GET /invoices/:id`, `GET /invoices/:id/receipt`                           | invoice.read_own/read_all hoặc invoice.export |

Các endpoint Flow 2 đã triển khai, DTO, phạm vi lớp/roster và mã lỗi được mô tả đầy đủ trong [Sprint 2 API](sprint-2-api.md). DELETE lớp/danh mục/đăng ký trả **200 kèm trạng thái sau thao tác**, vì đây là huỷ/ngừng hoạt động có giữ lịch sử.
