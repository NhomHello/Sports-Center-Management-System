# Sprint 4 – Hồ sơ HLV và hội viên – Khôi

Nhánh `sprint-4/fe-khoi` dùng nền `sprint-4/be-bao` tại `90ee6b5`. Khôi triển khai S4-01…S4-10 và S4-30, bổ sung phần hồ sơ của S4-31. Bảo giữ migration, tổng kết/đánh giá và báo cáo; Khải giữ UI tổng kết/đánh giá. Tất cả task của Khôi chuyển `Review`, chưa tự đánh dấu nhóm đã duyệt.

## Hành vi và nơi review

| Task | Kết quả |
| --- | --- |
| S4-01/02 | Tab Hồ sơ HLV theo permission: ảnh JPG/PNG tối đa 2 MB, giới thiệu theo cấu hình, kinh nghiệm, chứng chỉ và liên hệ công khai; liên hệ tách khỏi email đăng nhập. Tải ảnh giữ nội dung form đang sửa. |
| S4-03…06 | Trang Huấn luyện viên lọc tên/bộ môn; chỉ tài khoản hoạt động, có quyền dạy và chuyên môn. Chi tiết có lớp mở, đánh giá ẩn danh, liên hệ khi bật chia sẻ. Tên HLV trong thẻ/chi tiết lớp dẫn tới hồ sơ; từ hồ sơ mở đúng lớp để đăng ký. |
| S4-07/08 | Hồ sơ tập luyện cá nhân có ngày sinh, giới tính, chiều cao/cân nặng, mục tiêu, trình độ, sức khoẻ, liên hệ khẩn cấp và công tắc chia sẻ. Nhân viên sửa hộ trong Chi tiết hội viên, có audit. |
| S4-09/10 | Học viên của tôi và drawer từ roster/điểm danh: chỉ học viên thuộc các buổi thực dạy; học viên cũ chỉ trong `COACH_MEMBER_VIEW_DAYS`. Chỉ chuyên cần/tổng kết thuộc lớp HLV đó. Không có invoice, số dư hay gói tự tập. Khi tắt chia sẻ, API loại bỏ toàn bộ `trainingProfile`. |
| S4-30/31 | 8 test BE mới và 8 lượt E2E hồ sơ desktop/mobile; 11 dòng test case trong sheet `TC-S4`, ID `TC-S4-KHOI-*`. Giữ nguyên các test case Bảo đã ghi. |

## API

| Method | URL | Quyền |
| --- | --- | --- |
| GET / PUT | `/me/coach-profile` | `coach_profile.update_own` |
| GET / PUT | `/me/coach-profile/avatar` | `coach_profile.update_own`; PUT body binary và Content-Type image/png hoặc image/jpeg |
| GET / PUT | `/me/member-profile` | `member_profile.read_own` / `member_profile.update_own` |
| GET / PUT | `/members/:id/profile` | `member.read` / `member.update` |
| GET | `/coaches?q=&subjectId=&page=&pageSize=` | `coach_profile.read` |
| GET | `/coaches/subjects` | `coach_profile.read`; không cần quyền quản trị danh mục |
| GET | `/coaches/:id`, `/coaches/:id/avatar` | `coach_profile.read`; HLV ngừng hoạt động trả 404 |
| GET | `/coach/members?q=&page=&pageSize=` | `member_profile.view_assigned` |
| GET | `/coach/members/:id` | `member_profile.view_assigned`; ngoài phân công trả 403 |

- Module BE: `core/be/src/modules/profile/`; UI: `core/fe/src/pages/profiles/`.
- Dùng schema/migration và registry quyền/cấu hình Bảo đã bàn giao; không tạo migration riêng.
- Danh mục HLV không tải blob ảnh; ảnh được tải riêng bằng JWT, không đặt token trên URL.
- Các API hồ sơ có DTO theo allowlist; audit chỉ lưu tên trường thay đổi, không sao chép ghi chú sức khoẻ hoặc blob.
- Hồ sơ HLV công khai luôn dùng tên viết tắt cho đánh giá, kể cả khi người xem có quyền quản lý.
- Quyền truy cập học viên xét thời điểm đăng ký/huỷ, buổi thực sự được phân công dạy và hạn sau buổi cuối; không cấp quyền chỉ vì từng đứng tên lớp.
- Ngày sinh là ngày lịch, không bị dịch theo múi giờ trình duyệt.

## Kiểm tra và chạy lại

```bash
npm ci
npm run db:generate
npm run db:deploy -w @scms/be
npm run db:seed
npm run lint
npm run build
npm test
E2E_API_PORT=3200 E2E_FE_PORT=5280 npx playwright test tests/e2e/sprint4-profiles.spec.mjs tests/e2e/sprint4-reports.spec.mjs tests/e2e/local-login.spec.mjs tests/e2e/sprint1-regression.spec.mjs
```

Môi trường bàn giao dùng DB riêng `scms_sprint4_khoi`; không reset DB gốc. Chạy BE test và E2E lần lượt vì một số fixture cũ dọn theo tiền tố `TEST_` chung.

- `npm run lint`, `npm run build`: pass.
- `npm test`: 232 test BE và 158 test FE pass.
- E2E hồ sơ: 8/8 pass trên desktop 1366×900 và mobile 320×780.
- E2E tổng hợp: 16/16 pass, gồm hồ sơ, báo cáo Sprint 4, đăng nhập hai origin và hồi quy hội viên/gói tập. Bài hồi quy tạo gói đã chọn khung giờ/khu vực bắt buộc theo form hiện tại.
- Ảnh/trace/HTML nằm trong `test-results/` và `playwright-report/` sau lệnh E2E; không commit ảnh riêng.
- Build giữ cảnh báo bundle lớn từ thư viện chung; không chặn build.

Các commit mới dùng Khôi cho cả author và committer. Lịch sử gốc của Bảo/main được giữ đúng tác giả.
