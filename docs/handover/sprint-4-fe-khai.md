# Sprint 4 – Khải – Tổng kết khóa và đánh giá

Nhánh `sprint-4/fe-khai` đã tích hợp `origin/main` tại `28a0209` và nhánh hồ sơ của Khôi tại `c1a3ce4` (bao gồm API/nền dữ liệu Bảo bàn giao). Các commit mới của Khải dùng cả author và committer `khainguyense190020 <joppyminecraft2005@gmail.com>`, không thêm đồng tác giả. Lịch sử của các thành viên khác được giữ nguyên.

Nguồn phân công: 7 task có người làm **Khải** trong `docs/ke-hoach/SWP391_TaskSheet_Sprint4.xlsx`, phạm vi chốt 26/10/2026. Không triển khai AI/kế hoạch tập luyện đã hủy trong kế hoạch.

## Nơi review

| Task | Kết quả |
| --- | --- |
| S4-13 | `/course-summaries` lọc/tìm/phân trang theo quyền; `/classes/:id/summary` hiển thị chuyên cần server tính, gợi ý, kết quả, tiến bộ, nhận xét và khóa tiếp. Chỉ HLV tác giả sửa bản nháp; chọn khác gợi ý cần nhận xét. |
| S4-15 | Công bố cần đủ kết quả; cảnh báo chưa điểm danh phải được xác nhận. Sau công bố khóa sửa. Người có quyền mở lại nhập lý do; công bố lại tăng revision, thông báo và email qua outbox có sẵn. Bản công bố giữ snapshot chuyên cần; chỉ khi mở lại mới phản ánh điểm danh sửa sau đó. |
| S4-17 | Hồ sơ → **Khóa học đã hoàn thành**: chỉ kết quả chính chủ đã công bố; mở chi tiết nhận xét/gợi ý/mã tra cứu và tải phiếu PDF. Bản nháp/mở lại không được API trả cho hội viên. |
| S4-19 | Hội viên tạo/sửa đánh giá khóa và HLV 1–5 sao trong cửa sổ do server trả. `/course-ratings`: HLV thấy tên viết tắt và nhận xét đã kiểm duyệt; quản lý chọn HLV, thấy danh tính và ẩn/hiện nhận xét kèm lý do, không thay đổi điểm. Hồ sơ công khai của Khôi được làm mới khi đánh giá/kiểm duyệt. |
| S4-21 | Báo cáo → **Tổng kết khóa** lọc ngày kết thúc/bộ môn/HLV, có tình trạng chưa nộp/quá hạn, chuyên cần, % đạt, điểm khóa/HLV và Excel. `course_summary.view_all` độc lập với `report.view`; tab không có quyền không gọi API. Form nháp chưa áp dụng không đổi dữ liệu hay file xuất. |
| S4-29 | E2E tổng kết, công bố/mở lại, PDF, đánh giá/hết hạn, ẩn danh/kiểm duyệt, quyền báo cáo riêng và bộ lọc xuất file; doanh thu đủ nhóm ngày/tuần/tháng/quý/năm, so sánh và CSV/Excel/PDF. Có trạng thái lỗi/thử lại. |
| S4-31 | Bổ sung 15 test case `TC-S4-KHAI-*` trong sheet `TC-S4`, giữ nguyên test case Bảo/Khôi. |

## Code và hợp đồng bổ sung

- FE: `core/fe/src/pages/courses/`, `services/course.service.js`, `constants/courses.js`.
- Báo cáo tài chính cũ được giữ trong `FinancialReportsPanel`, ghép tab theo permission ở `ReportsPage`.
- `DownloadButton` dùng trạng thái tải được điều khiển trực tiếp để hỗ trợ xuất nhiều tệp liên tiếp.
- Không tạo migration mới; dùng migration Sprint 4 đã bàn giao.

| Method | URL | Phạm vi |
| --- | --- | --- |
| GET | `/course-summaries?q=&status=&page=&pageSize=` | `course_summary.manage_assigned` chỉ tác giả; `course_summary.view_all` xem toàn bộ, phân trang sau khi lọc |
| GET | `/classes/:id/ratings/me` | `course_rating.write_own`; chỉ người có item tổng kết của lớp. Trả `rating, canRate, deadlineAt, reason`; vẫn đọc được đánh giá cũ khi hết hạn |
| GET | `/course-ratings/coaches` | `course_rating.moderate`; danh sách HLV đã nhận đánh giá để kiểm duyệt |
| GET | `/reports/course-summaries/filters` | `course_summary.view_all`; danh mục bộ môn/HLV từ tổng kết, không cần quyền danh mục hoặc tài chính |

Các endpoint ghi vẫn dùng API Bảo tại `docs/huong-dan/api-sprint4.md`. GET tổng kết đã công bố trả chuyên cần từ snapshot, cùng nguồn với kết quả cá nhân, PDF và báo cáo.

## Chạy kiểm thử

Môi trường kiểm thử dùng database riêng `scms_sprint4_khai`, API `3300`, FE `5380`. Không thay đổi `.env` hoặc reset DB gốc `scms`; fixture có tiền tố riêng và được dọn sau test. Seed demo và seed Sprint 4 đã được chạy trên DB riêng trước kiểm thử. Chạy BE và E2E lần lượt vì một số fixture cũ có cleanup rộng.

Với `DATABASE_URL` trỏ tới database kiểm thử đã chuẩn bị:

```bash
npm run db:generate
npm run db:deploy -w @scms/be
npm run db:demo
npm run db:seed:sprint4
npm run lint
npm run build
npm test
E2E_API_PORT=3300 E2E_FE_PORT=5380 npx playwright test --project=desktop
```

Ảnh/trace/HTML nằm ở `test-results/` và `playwright-report/`, không commit ảnh sinh tự động. Các task chuyển **Review** để leader review trước khi đánh dấu Done.

## Kết quả

- `npm run lint`, `npm run build`: pass.
- Backend: 238 test pass (gồm 6 test API mới của Khải).
- Frontend: 160 test pass (gồm 2 ca giới hạn bảo lưu live).
- E2E desktop: đã xác nhận đủ 86 ca pass. Lần toàn bộ có 65 pass; các ca cũ lệch nhãn/bố cục được cập nhật, 16 ca pass trong lần chạy lại đầu và 5 ca còn lại pass trong lần cuối (gồm 2 ca serial ban đầu chưa chạy).
- 7 ca E2E Sprint 4 mới của Khải pass; kiểm tra xuất liên tiếp đủ day/week/month/quarter/year và CSV/XLSX/PDF.
- Hồi quy giữ quy định mới: buổi đã kết thúc cần quản lý mở hạn sửa trước khi điểm danh, khung giờ phải được chọn khi tạo lớp, lớp đủ chỗ chuyển sang danh sách chờ.
- Phát hiện và sửa phần tích hợp cũ: giữ ngân sách/ngưỡng bảo lưu từ API, suy ra khung giờ khi danh mục form tải về bất đồng bộ; cập nhật harness sang DTO hiện tại. Ảnh kiểm thử chuyển sang test-results để không ghi đè ảnh bàn giao cũ.

Chi tiết máy đọc được: `docs/kiem-thu/sprint4-khai/ket-qua-kiem-thu.json`.
