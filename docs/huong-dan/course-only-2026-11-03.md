# Chuyển sang bán khóa học – 03/11/2026

Phân công mới của Nhanh cho Bảo thay thế phạm vi bán gói tự tập trong các tài liệu Sprint 1–4 trước ngày này.
Đã pull main tới `66af2b2` trước khi thực hiện trên `sprint-4/be-bao`.

## Sản phẩm và học phí

- Chỉ bán khóa học theo lịch của khóa. Quản lý nhập **giá trọn khóa**.
- Đăng ký giữa khóa: giá trọn khóa × số buổi chưa diễn ra / tổng buổi không hủy, giữ cách làm tròn tiền của hợp đồng hiện có. Hóa đơn chụp giá và số buổi; thay giá khóa sau đó không sửa hóa đơn cũ.
- SePay giữ endpoint, API key, nội dung chuyển khoản/mã hóa đơn, QR, chống trùng transaction ID, chuyển thiếu/thừa, chuyển bù, đối soát và hoàn tiền. COURSE đủ tiền mới chuyển giữ chỗ thành BOOKED.
- Danh mục/mua/gia hạn/bảo lưu gói không còn trong UI. Mọi `/membership-plans/*` và `/memberships/*` trả 410 với người đã xác thực. Các bảng/giao dịch cũ được giữ vì hóa đơn, thanh toán và hoàn tiền có tham chiếu tới chúng; không DROP hoặc sửa tiền lịch sử.
- Hồ sơ, CRM, dashboard, thu tiền tại quầy, đối soát và báo cáo dùng khóa học. Cấu hình gói cũ được ẩn khỏi trang cài đặt. Không sinh thông báo nhắc mua/gia hạn gói mới.

## Đăng ký đồng thời và hàng chờ

`POST /classes/:id/orders` tiếp tục nhận `memberId?`, `channel?`, thêm `joinWaitlistWhenFull?: boolean`.
FE gửi true. Server mặc định false để không tự thay đổi hành vi các client cũ chưa nâng cấp.

- Có chỗ: trả 201 với hóa đơn COURSE/PENDING và giữ chỗ, chưa có đăng ký chính thức.
- Hết chỗ và đủ điều kiện chờ: trả 201 với `{ queued: true, classId, waitlist }`, **không tạo hóa đơn**. FE hiện thông báo hàng chờ, không điều hướng sang invoice undefined.
- Bấm lại cùng khóa/người/kênh: tái sử dụng invoice đang PENDING. Không có hai giữ chỗ hoặc hai queue entry cho cùng hội viên/khóa.
- BOOKED + PENDING_PAYMENT + OFFERED còn hạn được tính trong sức chứa; mọi thay đổi dùng transaction khóa chung. Người vào chờ trước được mời trước (`joinedAt`, tie-break bằng ID).
- Thứ tự khóa thống nhất `schedule → case/invoice` trong checkout, webhook, đối soát và nhả chỗ. Xung đột transaction rollback được retry có giới hạn; không retry lỗi nghiệp vụ.
- Cả tại quầy và online đều có hạn giữ chỗ theo hạn invoice; không giữ vô hạn tại quầy. Job hết hạn nhả chỗ và chuyển lượt cho người chờ kế tiếp. Chuyển thiếu gia hạn invoice thì hạn giữ chỗ đi theo.
- Trước khi xác nhận thanh toán, kiểm tra lại giữ chỗ, trạng thái khóa và sức chứa. Tiền tới sau khi chỗ đã mất không phục hồi đăng ký, không giành chỗ của người kế tiếp; đưa vào đối soát.
- Đăng ký hộ phải có quyền riêng; audit ghi nhân viên thực hiện, không giả thành học viên được chọn.

## Mô tả và nhận xét từng buổi

Mô tả khóa tiếp tục dùng `GymClass.description`, hiển thị ở thẻ và chi tiết khóa.
Migration `20261103044229_course_session_descriptions_and_feedback` chỉ thêm mô tả buổi và bảng nhận xét; không xóa dữ liệu cũ.

| API | Quyền và dữ liệu |
| --- | --- |
| `PATCH /classes/sessions/:id/description` | `{ description }` tối đa 2000 ký tự; quản lý có class.update hoặc HLV dạy chính buổi đó |
| `GET /classes/sessions/:id/feedback` | HLV phụ trách/attendance.manage; danh sách học viên đủ quyền học và nhận xét hiện có |
| `PUT /classes/sessions/:id/feedback/:memberId` | `{ rating: 1..5 hoặc null, note, expectedVersion }`; ít nhất điểm hoặc ghi chú; tối đa 2000 ký tự |
| `GET /attendance/feedback/me` | Chỉ người trong JWT; phân trang, classId tùy chọn; không nhận memberId |

Nhận xét tách khỏi attendance: HLV có thể ghi trong/sau buổi, không tự tạo trạng thái vắng/có mặt, không làm suy yếu khóa sửa điểm danh sau giờ kết thúc.
Buổi tương lai hoặc bị hủy không ghi nhận xét. Học viên phải đã BOOKED tại thời điểm buổi bắt đầu hoặc có kết quả điểm danh lịch sử; PENDING_PAYMENT không đủ điều kiện.

`SessionFeedback` unique `(sessionId, memberId)`, lưu author, điểm, note, version, timestamps. Client gửi version đã mở (0 khi chưa có); dữ liệu đổi trong lúc form mở trả 409, tránh ghi đè âm thầm. Audit lưu trước/sau và người sửa.
HLV khác bị 403. Học viên chỉ thấy ghi chú của chính mình trong Lịch sử điểm danh; không thể đổi query để đọc người khác.

## Chạy và nghiệm thu

1. `npm run db:deploy -w @scms/be`
2. `npm run db:generate`
3. `npm run db:seed`
4. Dữ liệu demo không reset: `npm run db:seed:sprint4`. Có khóa đang nhận đăng ký với nội dung từng buổi; seed mới không sinh gói hoặc hóa đơn MEMBERSHIP.
5. `npm run lint`, `npm test`, `npm run build`.
6. E2E: `E2E_API_PORT=3118 E2E_FE_PORT=5198 npm exec -- playwright test tests/e2e/course-only.spec.mjs --project=desktop`.

Kiểm tra race: 6 request cùng người → 1 invoice; 16 người tranh 2 chỗ → 2 giữ chỗ và 14 hàng chờ; webhook lặp → 1 payment; hết hạn FIFO; tiền trễ không chiếm lại chỗ; giữ chỗ tại quầy có hạn.
Các test mua/gia hạn/bảo lưu gói đã ngừng được thay bằng contract 410 và test khóa học. Kiểm thử thanh toán lịch sử vẫn dựng invoice gói cũ qua fixture nội bộ để giữ bảo vệ đối soát/hoàn tiền lịch sử, không mở lại API bán gói.
