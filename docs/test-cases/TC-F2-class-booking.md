# TC-F2 · Đặt lớp, lịch và quản lý lớp (phần BE Nhanh, US 38–46)

Test tích hợp chạy trên DB dev: `npm test -w @scms/be`. Mỗi suite tự tạo fixture có tiền tố `TEST_S2_` và dọn sau khi chạy.
Lớp/bộ môn/phòng do Bảo làm CRUD (US 29–37); suite này tạo dữ liệu trực tiếp bằng Prisma nên không phụ thuộc API của Bảo.

| Mã | US / UC | Kịch bản | Kết quả mong đợi | File |
| --- | --- | --- | --- | --- |
| B01 | 40 · CB-06 | Hội viên có gói đăng ký buổi của lớp mở | 201, BOOKED, ghi audit | sprint2-booking |
| B02 | 40 | Đăng ký lại cùng buổi | 409, không tạo thêm | sprint2-booking |
| B03 | 40 | Chưa có gói | 422 | sprint2-booking |
| B04 | 40 | Gói đã hết hạn | 422 | sprint2-booking |
| B05 | 40 | Lớp đóng / chưa tới / quá hạn đăng ký / buổi đã qua | 422 | sprint2-booking |
| B06 | 40 | Hai người giành chỗ cuối cùng một lúc | một 201, một 409 | sprint2-booking |
| B07 | 40 | Trùng giờ buổi khác / buổi sát giờ | 409 / 201 | sprint2-booking |
| B08 | 40 | Coach tự đăng ký; buổi không tồn tại | 403 / 404 | sprint2-booking |
| B09 | 41 · CB-07 | Huỷ khi còn ≥ 12 giờ, đăng ký lại | 200, dùng lại bản ghi | sprint2-booking |
| B10 | 41 | Huỷ khi còn < 12 giờ | 422, giữ đăng ký | sprint2-booking |
| B11 | 41 | Huỷ khi chưa đăng ký | 404 | sprint2-booking |
| B12 | 42 · CB-09 | Lễ tân đăng ký hộ; hội viên gọi route nhân viên; đăng ký trùng | 201 + enrolled_by; 403; 409 | sprint2-booking |
| B13 | 42 | Đăng ký hộ khi không gói / hết chỗ / hội viên không tồn tại | 422 / 409 / 404 | sprint2-booking |
| B14 | 43 · CB-10 | Huỷ hộ ghi cancelled_by; huỷ hộ sát giờ; hội viên huỷ hộ người khác | 200; 422; 403 | sprint2-booking |
| S01 | 44 · CB-16 | Lịch cá nhân chỉ của mình, kèm booking đã huỷ | 200 | sprint2-schedule |
| S02 | 44 | Lọc khoảng ngày VN; khoảng sai/quá 62 ngày | 200 / 400 | sprint2-schedule |
| S03 | 44 | Gói hết hạn giữa kỳ vẫn thấy booking | 200 | sprint2-schedule |
| S04 | 44 | Không đăng nhập / coach không có quyền | 401 / 403 | sprint2-schedule |
| T01 | 45 · CB-11 | Coach chỉ thấy buổi lớp mình + bookedCount | 200 | sprint2-schedule |
| T02 | 45 | Coach xem coach khác; quản lý xem | 403 / 200 | sprint2-schedule |
| T03 | 45 | Hội viên xem lịch dạy | 403 | sprint2-schedule |
| M01 | 38 · CB-17 | Quản lý lọc ngày/trạng thái/coach; coach chỉ lớp mình | 200 | sprint2-schedule |
| M02 | 38 | Coach lọc coach khác; hội viên/lễ tân; status sai | 403 / 403 / 400 | sprint2-schedule |
| M03 | 39 · CB-17 | Chi tiết lớp: buổi, hội viên, booking/cancel, người làm hộ | 200; coach không thấy email | sprint2-schedule |
| M04 | 39 | Lớp của coach khác / không tồn tại | 403 / 404 | sprint2-schedule |
| R01 | 46 · CB-12 | Roster buổi: chỉ tên + trạng thái | 200, không lộ email/SĐT | sprint2-schedule |
| R02 | 46 | Coach khác / hội viên / lễ tân / không tồn tại / quản lý | 403 / 404 / 200 | sprint2-schedule |
