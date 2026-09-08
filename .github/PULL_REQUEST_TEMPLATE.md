## Mô tả

<!-- Làm gì? Tại sao? Link task trên board. -->

Task: <!-- link -->

## Loại thay đổi

- [ ] feat (tính năng mới)
- [ ] fix (sửa lỗi)
- [ ] refactor / chore / docs

## Checklist (người tạo PR tự tick)

- [ ] `npm run lint` không lỗi, không file nào vượt 200 dòng
- [ ] Không hardcode: không URL/port/secret/số nghiệp vụ/tên role trong code
- [ ] Không so sánh tên role ở bất kỳ đâu, chỉ dùng `PERMISSIONS.*`
- [ ] Hàm export có JSDoc, logic khó có comment giải thích "tại sao"
- [ ] Đã tái sử dụng component/util có sẵn thay vì copy-paste
- [ ] Đã test tay luồng chính + đính kèm ảnh/GIF nếu là UI
- [ ] Thêm permission mới thì đã chạy `npm run db:seed` và cập nhật docs

## Ảnh / GIF (nếu có UI)
