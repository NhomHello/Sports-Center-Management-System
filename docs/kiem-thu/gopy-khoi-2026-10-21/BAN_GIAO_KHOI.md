# Bàn giao FE Khôi theo góp ý giảng viên

Ngày: 21/10/2026. Nền: `origin/main` tại `df4cd18`.

## Phạm vi và nguồn ưu tiên

- Đã đọc hai file trong Downloads, bản tương ứng trong repo, hợp đồng GĐ2–4 và bản Word đề xuất v1.
- Áp dụng Q1–Q4 đã chốt trong thiết kế mới: bán cả khóa, có số dư, hủy/đổi lấy tiền từ API preview và bảo lưu tổng ngày. Những đề xuất đặt từng buổi, không dùng ví hoặc giới hạn số đợt trong Word v1 không được dùng để ghi đè thiết kế đã chốt.
- Chỉ thay đổi FE thuộc cột Khôi và test riêng. Không sửa BE, shared/schema/migration, hợp đồng, thẻ lớp, trang gói hoặc thẻ gói của Khải. Không đổi `main`, không push hoặc merge remote.
- Người dùng xác nhận GY-00 và BE GĐ3–4 chưa có ở nhánh/local khác. Do đó chưa đánh dấu hoàn thành nghiệm thu toàn hệ thống.

## Trạng thái từng task

| Task | Đã có trong code | Điều kiện còn thiếu để nghiệm thu |
|---|---|---|
| GY-31 | `ExcuseButton`, xác nhận không phát sinh tiền, deadline theo buổi, tag Xin nghỉ, gắn vào lịch của mình | BE báo nghỉ, metadata deadline trong lịch, HLV mở Điểm danh thấy EXCUSED đúng nhãn |
| GY-34 | Khe `MembershipActions`, `EnrollmentActions`, `ApplyCreditButton`; preview hủy/đổi, lý do, REFUND/CREDIT, số dư/lịch sử, mở hóa đơn thu thêm | GY-00 gắn các khe và `CreditPanel`; BE cancellation/credit/purchase-change; cập nhật QR và tiền mặt theo hóa đơn mới |
| GY-41 | Tải chi tiết kỳ; ngân sách ngày; chặn quá hạn mức/minDays; trạng thái và lịch sử; kết thúc sớm | BE GY-40 và trạng thái FROZEN thật, job tự mở, nguồn minDays live |
| GY-36 | 15 ca UI desktop với API mô phỏng, không dùng DB thật; 6 ảnh đã kiểm tra | E2E đúng đề bài với API/DB, HLV, mua gói, webhook và seed demo thật đang Blocked |
| GY-53 | Workbook 35 ca riêng của Khôi: 28 Pass unit/UI và 7 Blocked live | Review cùng Khải rồi đưa các dòng đã thống nhất vào workbook chung, không ghi đè case của người khác |

## API và props để tích hợp

Tất cả số tiền hiển thị lấy nguyên từ API preview. FE không áp dụng công thức còn lại, phí hay hoàn tiền. `POST apply-credit` gửi `{}` để BE chọn mức tối đa. Thành công làm mới gói, hội viên, hóa đơn, lịch, roster, số dư và thông báo qua query cache.

Các khe đã có component để chủ GY-00/host gắn theo hợp đồng:

```jsx
<MembershipActions membership={period} />
<EnrollmentActions item={gymClass} memberId={selectedMemberId} />
<ApplyCreditButton invoice={invoice} />
<CreditPanel />
<CreditPanel memberId={selectedMemberId} />
<FreezeControls membership={period} own policy={{ minDays: liveMinDays }} />
```

`CreditPanel` gắn vào hồ sơ và chi tiết hội viên bởi chủ file host. `own` của `FreezeControls` dùng khi chính hội viên thao tác; không truyền `own` khi nhân viên thực hiện hộ.

Hai điểm metadata cần phối hợp, chưa tự sửa hợp đồng:

1. `ExcuseButton` nhận `session.excuseDeadline` (ISO UTC của đúng buổi), tùy chọn `canExcuse`/`excuseReason`; nhận `attendanceStatus` hoặc `attendance.status` để hiện Xin nghỉ sau reload. Không dùng `gymClass.cancelDeadline` vì đó là hạn hủy toàn lớp theo buổi gần nhất. Nếu thiếu deadline, FE không tự dùng 12 giờ cố định.
2. GET chi tiết kỳ cần trả `freezeDaysUsed`, `freezeDaysLeft`, `freezes[]`. Số ngày tối thiểu lấy từ `policy.minDays` do caller nạp từ cấu hình live hoặc `freezeMinDays` do BE bổ sung sau khi nhóm thống nhất. Nếu thiếu, form không gửi yêu cầu. Không lấy default seed để giả làm cấu hình hiện hành, không tự gọi thêm một API ngoài hợp đồng.

`AttendanceTable.jsx` hiện chỉ có PRESENT/ABSENT. Cần chủ file phối hợp thêm nhãn/lựa chọn EXCUSED và giữ giá trị API; không sửa file này vì ngoài cột Khôi. Chưa thể nghiệm thu tiêu chí HLV nhìn thấy Xin nghỉ.

## Kiểm tra đã thực hiện

- `npm run lint`: Pass trên shared, BE và FE.
- `npm test -w @scms/fe`: 20 file, 117 test Pass; trong đó 13 test mới của phần Khôi.
- `npm run build -w @scms/fe`: Pass. Cảnh báo bundle lớn hiện có không chặn build.
- `npx playwright test --config tests/e2e/gopy-gy36.config.mjs`: 15/15 Pass ở desktop 1440×1000. API được mô phỏng trong test, không phải API/DB thật.
- Prettier của file thay đổi, `git diff --check` và kiểm tra phạm vi file.
- Workbook đã tính lại, đối chiếu 28/7/35 và kiểm tra ảnh render; không có lỗi công thức trong vùng kiểm tra.

Chạy lại bộ kiểm thử UI hợp đồng bằng lệnh Playwright ở trên. Test tự mở Vite trên cổng 5191, không cần BE/DB và không thay cấu hình FE đang dùng.

Không chạy `npm run db:demo` trên database cá nhân hiện có: script này xóa dữ liệu, và nền GY-00/BE mới cũng chưa sẵn sàng. Sau khi có BE, dùng database test riêng với seed demo phù hợp rồi thực hiện bảy ca live trong workbook. Chưa có bằng chứng DB, webhook, job hoặc phân quyền API mới đã chạy đạt.

## Nhánh và commit local

Các nhánh xếp chồng tuần tự để giữ toàn bộ phần việc trong nhánh cuối, chưa phải PR độc lập sẵn merge:

1. `feature/gopy-gy31-bao-nghi-fe`: `0f403f4`.
2. `feature/gopy-gy34-huy-so-du-doi-fe`: `a17e155`.
3. `feature/gopy-gy41-bao-luu-fe`: `4cc3838`.
4. `feature/gopy-gy36-e2e-gd3-4`: `2514b0f`.
5. `chore/gopy-gy53-test-case`: nhánh bàn giao cuối, gồm cả bốn bước trước và test case/bằng chứng.

Khi GY-00 và BE tương ứng được merge: fetch, rebase theo hợp đồng, giải quyết các khe do GY-00 tạo trùng đường dẫn với component đã chuẩn bị, kiểm tra lại props/DTO rồi chạy live E2E. Không merge FE vào main trước các phụ thuộc BE.

## File bằng chứng

- `SWP391_TestCase_GopY_Khoi.xlsx`: hai sheet Ban giao và TC-KHOI; ID liên kết code test.
- `ket-qua-kiem-thu.json`: kết quả tổng hợp, nêu rõ mock và live Blocked.
- `anh-kiem-thu/`: giao diện API mô phỏng, gồm preview hủy/đổi và trạng thái sau thao tác.

Ghi chú: tính đúng 720.000 đồng hoàn từ 18/6 buổi, ghi sổ DB, chống chi trùng, cập nhật QR/tiền mặt và xử lý webhook thực tế thuộc BE/host tương ứng. Bộ UI này chỉ kiểm tra FE sử dụng đúng kết quả API, không thay thế các kiểm thử nghiệp vụ đó.
