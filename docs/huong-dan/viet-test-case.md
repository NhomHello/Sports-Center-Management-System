# Ghi nhận kiểm thử và nghiệm thu

`SWP391_TestCase.xlsx` là danh mục tình huống đối chiếu chức năng. Kết quả thực chạy bổ sung ngày 06/11 nằm trong `docs/kiem-thu/ket-qua-bo-sung-2026-11-06.json` cùng các log riêng. Mỗi ca gồm use case, điều kiện/tình huống, kết quả mong đợi và file test liên quan. Trạng thái danh mục phản ánh việc đối chiếu từng ca, tách với kết quả chạy toàn bộ BE/FE. Các ca bổ sung TC-21–24 chỉ được ghi Passed khi bằng chứng chạy và hash mã nguồn còn khớp; các ca khác chưa được nghiệm thu riêng theo danh mục. Sinh Word/PDF không tự tạo kết quả Passed.

Các lệnh có trong dự án:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Test backend cần MySQL và môi trường kiểm thử thích hợp. Playwright cần browser được cài và cấu hình trong `playwright.config.mjs`; xem file thực tế trước khi đổi cổng/DB. Chỉ chạy kiểm thử làm thay dữ liệu trên cơ sở dữ liệu thử nghiệm.

Khi ghi kết quả, lưu commit, ngày giờ, phiên bản môi trường, lệnh và exit code/log; phân biệt BE, FE và từng file E2E. Giao dịch mô phỏng không được mô tả là đã chuyển khoản/hoàn tiền thật. Một file test có tên phù hợp chưa tự chứng minh mọi ngoại lệ của use case đã có assertion.

Các nhóm cần kiểm tra: mua giữa khóa, tranh chỗ/bấm lặp, FIFO, chuyển thiếu/thừa/lặp/trễ, thu quầy sát hạn, hủy và mã hoàn, xin nghỉ/điểm danh/nhận xét, phạm vi hồ sơ, tổng kết và báo cáo.
