# Đối chiếu công việc và Git

Task được giao, tác giả commit và trạng thái nghiệm thu là ba dữ liệu khác nhau. Task sheet ghi ID/UC/người/nhánh/ngày/trạng thái nguồn; workbook đối chiếu ghi riêng author date và committer date.

Khi thực hiện một task, tạo nhánh theo quy ước nhóm đang dùng, commit thay đổi thực tế và ghi ID task trong message nếu phù hợp. Trước khi yêu cầu review, kiểm tra diff và chạy kiểm tra liên quan. Không sửa lịch sử tác giả hoặc tạo commit giả để làm đẹp timeline.

Khi review, mở commit/diff, file triển khai và kết quả kiểm thử. Commit có ID chỉ chứng minh message nhắc task; commit chạm file chỉ chứng minh file đã thay đổi. Không tự đánh dấu Done vì đã merge và không dùng số commit làm tỷ lệ đóng góp.

`docs/ke-hoach/SWP391_DoiChieuTaskGit.xlsx` được tạo từ task sheet nguồn trong Git `10e050b` và lịch sử Git HEAD; các task đã loại khỏi phạm vi kinh doanh hiện hành được ghi rõ trong bảng phân chia UC, không tính thành chức năng đang bán.
