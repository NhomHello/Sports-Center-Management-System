# Tài liệu dự án

Bộ tài liệu bám theo chức năng hiện có trên `main`. Quy tắc cũ được giữ trong phần lịch sử thay đổi; phạm vi hiện hành không gồm AI hoặc kế hoạch tập luyện.

| Vị trí | Nội dung |
| --- | --- |
| [huong-dan/](huong-dan/) | Quy tắc code, cài đặt, API, phân quyền và demo |
| [yeu-cau/](yeu-cau/) | Đặc tả UC, Business Rules và sơ đồ Word; Prisma là nguồn mô hình dữ liệu vật lý |
| [ke-hoach/](ke-hoach/) | Task sheet Excel từng sprint và bảng phân chia UC |
| [handover/](handover/) | Bàn giao theo nhánh và bằng chứng tại thời điểm bàn giao |
| [kiem-thu/](kiem-thu/) | Test case Excel và bằng chứng kiểm thử |
| [Bộ báo cáo cuối kỳ](../outputs/bao-cao-cuoi-ky/) | Báo cáo Word/PDF, 5 slide PowerPoint/PDF, kịch bản 28 phút, bảng task–commit–timeline và ERD |

## Bộ nộp cuối kỳ

- [Báo cáo đồ án](../outputs/bao-cao-cuoi-ky/SWP391_BaoCaoDoAn_v1.docx): tính năng, swimlane, state chart, conceptual model, ERD và bảng Func | Rule.
- [Slide thuyết trình](../outputs/bao-cao-cuoi-ky/SWP391_ThuyetTrinh_v1.pptx): 5 slide, có ghi chú người trình bày; tổng nói và demo 28 phút.
- [Kịch bản và hướng dẫn](../outputs/bao-cao-cuoi-ky/SWP391_KichBanDemo_v1.docx): chuẩn bị máy, từng bước demo, kết quả mong đợi và phương án dự phòng.
- [Bằng chứng task và Git](../outputs/bao-cao-cuoi-ky/SWP391_TaskTraceability_v1.xlsx): phân công, trạng thái nguồn, ngày kế hoạch, author/committer date và liên kết commit.
- [ERD đầy đủ](../outputs/bao-cao-cuoi-ky/SWP391_ERD_DayDu_v1.pdf): toàn bộ model và FK thuộc phạm vi đang triển khai; ảnh SVG và nguồn sơ đồ ở `so-do/`.

## Phân công Sprint 4 hiện hành

Bảo nhận toàn bộ task Sprint 4 trước đây giao Nhanh, gồm nền dữ liệu, migration, tổng kết/đánh giá BE, báo cáo BE/FE, seed và tài liệu/demo. Khôi làm hồ sơ HLV/hội viên full-stack và kiểm thử hồ sơ. Khải làm FE tổng kết/đánh giá, báo cáo tổng kết và kiểm thử.

Nguồn phân công: [task sheet Sprint 4](ke-hoach/SWP391_TaskSheet_Sprint4.xlsx) và [bảng phân chia UC](ke-hoach/SWP391_UCP_Sprint_Role_Split.xlsx). Các mục AI/kế hoạch tập luyện cũ đã đánh dấu ngoài phạm vi; không tính là công việc còn phải làm của Sprint 4. Mục diễn tập trực tiếp vẫn cần cả nhóm thực hiện.

Ngày Bắt đầu/Hạn là kế hoạch; ngày Git mô tả lịch sử thực hiện. Trạng thái Review không tự đổi thành Done chỉ vì đã merge. Phân công được cập nhật theo quyết định nhóm, còn author/commit lịch sử giữ nguyên để đối chiếu.

## Quy tắc duy trì

Sửa nội dung tại nguồn hiện hành thay vì tạo thêm kế hoạch cạnh tranh. Báo cáo cuối kỳ là bản tổng hợp từ mã nguồn và các nguồn trên; có generator trong `scripts/reporting/`. Không ghi mật khẩu, token hoặc `.env` vào bộ nộp. Tên tài liệu dùng `SWP391_<Loại>_<Phiên bản>`.
