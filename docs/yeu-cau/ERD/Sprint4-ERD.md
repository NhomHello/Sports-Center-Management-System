# ERD bổ sung Sprint 4

Phần bổ sung cho ERD hiện có, theo migration `20261029073309_sprint4_profiles_summaries_ratings`.
Các bảng legacy được giữ nguyên. Chi tiết tên cột, chỉ mục và FK nằm trong `core/be/prisma/schema.prisma`.

```mermaid
erDiagram
  users ||--o| coach_profiles : public_profile
  users ||--o| member_profiles : training_profile
  users ||--o{ course_summaries : coach_author
  gym_classes ||--o| course_summaries : course_completion
  course_summaries ||--o{ course_summary_items : members_at_completion
  users ||--o{ course_summary_items : own_result
  gym_classes ||--o{ course_ratings : ratings
  users ||--o{ course_ratings : member_and_coach
  gym_classes ||--o{ class_events : durable_delivery
  course_summaries {
    int id PK
    int class_id FK,UK
    int coach_id FK
    enum status "DRAFT/PUBLISHED"
    datetime deadline_at
    datetime published_at
    int revision
    string reopened_reason
  }
  course_summary_items {
    int id PK
    int summary_id FK "unique(summary_id, member_id)"
    int member_id FK
    enum result "PASS/NOT_PASSED"
    int progress "1-5"
    string comment
    string next_course
    json attendance_snapshot
    string lookup_code UK
  }
  course_ratings {
    int id PK
    int class_id FK "unique(class_id, member_id)"
    int member_id FK
    int coach_id FK
    int course_stars "1-5"
    int coach_stars "1-5"
    string comment
    datetime hidden_at
    int hidden_by_id
    string hidden_reason
  }
```

- `GymClass.status` thêm `COMPLETED`. Job không tổng kết lớp CANCELLED hoặc lớp chỉ có buổi đã huỷ.
- Các dòng `course_summary_items` là tập hội viên BOOKED lúc khoá kết thúc. Service xác thực người đánh giá có item ở lớp tương ứng; quan hệ này là ràng buộc nghiệp vụ, không phải FK trực tiếp.
- Chuyên cần lấy từ bảng `attendance` hiện hành (PRESENT/ABSENT/EXCUSED), không dùng `attendances` legacy. Snapshot được chốt lúc công bố.
- `CourseSummary.coachId` cố định HLV chịu trách nhiệm lúc kết thúc, độc lập snapshot HLV từng buổi.
- `class_events.changes` chứa `type=COURSE_SUMMARY_PUBLISHED`, `summaryId`, `revision`, `emailDeliveredTo` (ID, không chứa email/điểm). Dùng outbox hiện có để gửi in-app và retry email từng người, không cần thêm migration cho hàng đợi.
- Hồ sơ HLV lưu ảnh JPG/PNG trong `avatar_data`/`avatar_mime`; thông tin liên hệ công khai tách tài khoản đăng nhập. Hồ sơ hội viên có `share_with_coach` kiểm soát chia sẻ mục tiêu/sức khoẻ. API phần hồ sơ do Khôi phụ trách.
