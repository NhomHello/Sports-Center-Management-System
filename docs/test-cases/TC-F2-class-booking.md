# TC-F2 · Lớp học, đăng ký toàn lớp và lịch

Bản kiểm tra hiện tại: `sprint-2/fe-khoi`, giữ code đã tích hợp từ `sprint-2/integration`.
Dữ liệu test có prefix `TEST_`, tạo role riêng và tự dọn. Test hồi quy và migration chạy trên database tạm;
UI dùng server riêng ở 3100/5180 và fixture trong DB local. Không dùng dữ liệu hội viên thật để tranh chỗ hoặc đổi quyền.

## Ca tự động

| ID | Mục tiêu / kết quả mong đợi | Bằng chứng |
| --- | --- | --- |
| TC-F2-C01 | Tạo lớp và các buổi UTC; chỉ trả họ tên/ID HLV | `tests/sprint2-class.test.js` |
| TC-F2-C02 | Chặn trùng phòng/HLV 409; buổi liền nhau được tạo | Cùng suite |
| TC-F2-C03 | Chặn ngừng phòng/bộ môn hoặc khoá HLV còn lớp tương lai | Cùng suite |
| TC-F2-C04 | Đổi lịch giữ phiên bản cũ; drain lại chỉ một thông báo | Cùng suite |
| TC-F2-C05 | Sửa lịch giữ nguyên buổi đã diễn ra, snapshot và timestamp | Cùng suite |
| TC-F2-C06 | Huỷ lớp/booking tương lai; giữ buổi cũ; huỷ lại không gửi trùng | Cùng suite |
| TC-F2-B01 | Hai hội viên tranh một chỗ: một 201, một 422; đúng một BOOKED | `tests/sprint2-booking.test.js` |
| TC-F2-B02 | Đăng ký trùng 409; membership hết hạn 422 | Cùng suite |
| TC-F2-B03 | Ngoài cửa sổ đăng ký 422; không tạo booking | Cùng suite |
| TC-F2-B04 | Cùng hội viên đăng ký đồng thời hai lớp trùng giờ: một thành công | Cùng suite |
| TC-F2-B05 | Đăng ký/huỷ hộ đúng actor; member gọi API hộ bị 403; huỷ lại giữ actor cũ | Cùng suite |
| TC-F2-B06 | Huỷ quá hạn 422, giữ BOOKED cả khi quản lý huỷ hộ | Cùng suite |
| TC-F2-B07 | Gói hết hạn giữa kỳ vẫn thấy lịch cũ; dữ liệu lịch thuộc đúng user | Cùng suite |
| TC-F2-B08 | HLV chỉ thấy lớp/roster phân công; roster không có passwordHash | Cùng suite |
| TC-F2-B09 | Đổi lịch gây xung đột thật tạo ngoại lệ huỷ trước buổi xung đột | Cùng suite |
| TC-F2-R01 | Lỗi audit khi tạo lớp rollback cả lớp/buổi | `tests/sprint2-resilience.test.js` |
| TC-F2-R02 | 16 endpoint quản lý/roster/lịch bị chặn với member; thiếu token 401 | Cùng suite |
| TC-F2-R03 | Lỗi audit khi đăng ký/huỷ rollback booking; retry thành công | Cùng suite |
| TC-F2-R04 | Gửi lỗi giữ outbox; thử lại hoàn tất đúng một notification | Cùng suite |
| TC-F2-R05 | Nhân viên đọc lớp đóng của hội viên; giả memberId/HLV ngoài phân công 403 | Cùng suite |
| TC-F2-R06 | Filters/page không vượt phạm vi HLV; sửa sức chứa phòng sai bị chặn | Cùng suite |
| TC-F2-P01 | Đúng N giờ được huỷ; thiếu 1ms bị chặn | `src/modules/class/class-booking-policy.service.test.js` |
| TC-F2-P02 | Ngoại lệ hết hiệu lực tại/sau buổi xung đột | Cùng suite |
| TC-F2-P03 | Không huỷ booking không có/đã huỷ hoặc lớp hết buổi | Cùng suite |
| TC-F2-N01 | Đổi N từ 12 thành 3 giờ làm DTO canCancel đổi ngay | `tests/sprint2-policy-config.test.js` |
| TC-F2-N02 | Biên tuần UTC+7; Chủ nhật và query memberId bị từ chối | Cùng suite |
| TC-F2-U01 | Member đăng ký, xem lịch, huỷ từ lịch, bật lịch đã huỷ | `tests/e2e/sprint2.spec.mjs` |
| TC-F2-U02 | Lễ tân tìm email, chọn member, đăng ký/huỷ hộ; DB actor đúng | Cùng suite |
| TC-F2-U03 | HLV mở roster từ lịch; API lớp ngoài phân công 403 | Cùng suite |
| TC-F2-U04 | Quản lý tìm lớp, sửa, xem detail, tạo bộ môn | Cùng suite |
| TC-F2-V01 | Form tạo/huỷ lớp, sửa/ngừng phòng; DB/API phản ánh thao tác UI | `tests/e2e/sprint2-management.spec.mjs` |
| TC-F2-V02 | Lịch rỗng, loading, lỗi 503, bấm thử lại phục hồi | Cùng suite |
| TC-F2-V03 | Membership hết hạn hiển thị lý do và disable đăng ký | Cùng suite |
| TC-F2-X01 | Người khác giữ chỗ cuối; POST từ UI nhận 422 rồi tải lại 0/1 chỗ, disable đăng ký; DB đúng một booking | `tests/e2e/sprint2-khoi-excel.spec.mjs` |
| TC-F2-X02 | DatePicker ở Auckland vẫn truy vấn đúng tuần VN; chuyển ngày, huỷ và hiện lịch đã huỷ; gói hết hạn vẫn giữ booking cũ | Cùng suite |
| TC-F2-X03 | Manager huỷ lớp: lịch dạy tự tải lại, mở lịch đã huỷ vẫn có roster; hội viên mở chuông thấy thông báo, không tràn ngang | Cùng suite |
| TC-UI-S1-01 | Hồi quy tìm/sửa hội viên và tạo gói sau khi tách component Sprint 1 | `tests/e2e/sprint1-regression.spec.mjs` |
| TC-LOCAL-AUTH | Lễ tân, hai HLV và hội viên đăng nhập từ localhost/127.0.0.1 trên desktop/mobile; login và tải quyền thành công | `tests/e2e/local-login.spec.mjs` |

Đường dẫn BE trong bảng tính từ `core/be`; đường dẫn E2E tính từ repo. U/V/X và hồi quy Sprint 1 chạy
cả desktop 1366×900 và mobile 320×780. Mỗi ca kiểm tra không có lỗi JavaScript runtime và không tràn
chiều ngang trang. Bộ X chạy với timezone trình duyệt `Pacific/Auckland` và API/DB thật.

FE có **6 test thuần** trong `core/fe/src/utils/schedule.test.js`: wall time, biên tuần Việt Nam,
offset form, ngày DatePicker ở `Asia/Tokyo`/`Pacific/Auckland` vẫn là đúng thứ Hai Việt Nam,
và chuyển ngày/tuần qua biên tuần. Test mô phỏng ngày lựa chọn ở hai timezone bằng `dayjs.tz`;
E2E X02 kiểm tra DatePicker thật trong trình duyệt Auckland.

Phạm vi Excel và liên hệ X01–X03 với 9 task Khôi: [handover Excel](../handover/sprint-2-fe-khoi-excel.md).
Workbook chỉ được đọc; X-05 xác minh email nằm ở sheet Ngoài kế hoạch, không thuộc tổng 9 task.

## Migration và hồi quy

`npm run verify:sprint2` tạo hai database có tên riêng, deploy 8 migration trên DB mới, seed rồi chạy toàn bộ BE/FE tests. Với DB nâng cấp, script áp dụng 7 migration cũ, nạp dữ liệu gói/hóa đơn/thanh toán/đăng ký từng buổi/điểm danh/kế hoạch tập/kết quả, rồi áp dụng migration bổ sung. Script so sánh các bản ghi và FK cũ, kiểm tra snapshot phòng/HLV và FK mới; finally chỉ xoá hai DB tạm do chính script tạo.

## Chạy lại

```bash
npm run verify:sprint2
npx playwright install chromium
npm run test:e2e
npm run lint
npm run format:check
npm run build
git diff --check
```

MySQL phải chạy và tài khoản DATABASE_URL có quyền CREATE/DROP DATABASE cho lệnh verify. Nếu chỉ có quyền trong DB ứng dụng, chạy `npm test` và `npm run test:e2e`; phần migration dùng một DB kiểm thử riêng có quyền phù hợp. Playwright tự bật/tắt server riêng, không dùng cổng 3000/5173. Có thể đổi `E2E_API_PORT`/`E2E_FE_PORT`. Fixture UI cần registry permission/setting đã seed.

Kiểm tra riêng lỗi đăng nhập local bằng `npm run test:e2e -- tests/e2e/local-login.spec.mjs`.
Kiểm tra riêng các ca Excel bằng `npm run test:e2e -- tests/e2e/sprint2-khoi-excel.spec.mjs`.
Server E2E lấy danh sách CORS từ cấu hình BE rồi đổi cổng local sang cổng test; không tự thay danh sách
bằng origin của test runner. Cách này giữ khả năng phát hiện `.env` thiếu một trong hai địa chỉ demo.

Server E2E dùng ngưỡng riêng cho tổng request và đăng nhập để chạy liên tục các role trên cùng IP.
Các ngưỡng này nằm trong cấu hình Playwright, áp dụng cho server test cổng riêng.

## Kết quả kiểm tra ngày 08/10/2026

- `npm run verify:sprint2`: **142/142 đạt** (BE 87, FE 55); deploy mới và nâng cấp giữ 24 bảng lịch sử,
  36 FK cũ. Log: `.cache/sprint2-excel/verify.log`.
- Lint toàn repo, format:check, build FE và Prisma validate đạt sau sửa mobile.
- Các sửa FE được kiểm tra lại: ngày Việt Nam độc lập timezone trình duyệt; query lớp/lịch/roster/
  thông báo poll 30 giây và refetch khi focus; mutation `onSettled` tải lại dữ liệu cả khi lỗi;
  mở chuông refetch và popup mobile có nội dung đọc được, trong viewport, cuộn khi dài.
- Lượt UI đầy đủ **26/26 đạt (4.4 phút)**: 13 desktop và 13 mobile 320px,
  gồm X01–X03 đạt trên cả hai kích thước. Log: `.cache/sprint2-excel/e2e-final.log`.
- Kết luận đối chiếu Excel: **9/9 task Khôi Done trong code**, gồm RBAC và BR tương ứng.
  Workbook nguồn giữ nguyên trạng thái To Do; X-05 ngoài phạm vi Sprint 2 này.

Kết quả bàn giao cũ ở [bảng 18 chức năng](../handover/sprint-2-coverage.md); kết quả đối chiếu Excel mới
ở [handover Excel](../handover/sprint-2-fe-khoi-excel.md). HTML report/trace/ảnh UI được tạo trong
`playwright-report/`, `test-results/`; xem bằng `npx playwright show-report`.
