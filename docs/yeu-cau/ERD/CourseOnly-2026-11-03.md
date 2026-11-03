# Khóa học và nhận xét theo buổi – 03/11/2026

Bổ sung cho ERD Sprint 4. Các bảng gói tự tập vẫn tồn tại chỉ để bảo toàn FK/hóa đơn lịch sử;
API bán gói đã ngừng. Không chuyển hoặc sửa giá của invoice lịch sử khi cập nhật khóa học.

```mermaid
erDiagram
    GymClass ||--o{ ClassSession : schedules
    GymClass ||--o{ ClassEnrollment : enrollments
    GymClass ||--o{ ClassWaitlist : fifo_queue
    GymClass ||--o{ Invoice : COURSE
    Invoice ||--o{ Payment : sepay_cash_credit
    Invoice o|--o{ ClassEnrollment : holds_until_paid
    ClassSession ||--o{ SessionFeedback : per_student
    User ||--o{ SessionFeedback : member
    User ||--o{ SessionFeedback : author
    SessionFeedback {
        int id PK
        int session_id FK "unique(session_id, member_id)"
        int member_id FK
        int author_id FK
        int rating "nullable 1..5"
        string note "max 2000"
        int version "optimistic locking"
        datetime created_at
        datetime updated_at
    }
    ClassSession {
        int id PK
        int class_id FK
        string description "max 2000, nullable"
    }
```

- `GymClass.description` mô tả khóa; `price` là giá trọn khóa. Invoice snapshot `sessionCount/totalSessions/amount` tính tại thời điểm giữ chỗ.
- Thanh toán đủ biến `PENDING_PAYMENT` thành `BOOKED` trong cùng transaction. Cả online/tại quầy dùng hạn giữ chỗ, không giữ vô hạn.
- Hết chỗ có thể vào `WAITING`, được mời thành `OFFERED`; chuyển từ offer sang giữ chỗ được tuần tự hoá với mọi phép ghi sức chứa.
- `SessionFeedback` không có quan hệ ghi đè attendance; lưu nhận xét không tạo trạng thái điểm danh. Ghi chú của người khác không được đưa vào DTO lớp public.
- Version + audit bảo vệ ghi đè đồng thời và truy vết người sửa. Ghi chú cá nhân được trả theo JWT, không theo memberId client gửi.
