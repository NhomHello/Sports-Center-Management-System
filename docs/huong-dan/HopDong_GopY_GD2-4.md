# Hợp đồng chung GĐ2–4 (sửa theo góp ý giảng viên)

> File này là **nguồn sự thật duy nhất** cho 4 người (và AI của từng người). Thiết kế nghiệp vụ:
> `docs/yeu-cau/ThietKe_SuaTheoGopY_GiangVien.md`. Kế hoạch: `docs/ke-hoach/KeHoach_SuaTheoGopY_GiangVien.md`.
> Muốn đổi bất cứ điều gì trong file này → báo Nhanh, Nhanh sửa file + thông báo nhóm. **Không tự ý lệch.**

## 1. Chủ sở hữu file (để gộp không xung đột)

Mỗi file chỉ một người sửa. Cần thay đổi file của người khác → nhắn chủ file. AI của bạn **không được** sửa file ngoài
cột của bạn (trừ test của chính bạn).

| Khu vực | Nhanh | Bảo | Khải | Khôi |
|---|---|---|---|---|
| `core/be/prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed/**` | ✅ | | | |
| `core/shared/src/**` (quyền, cấu hình) | ✅ | | | |
| `core/be/src/routes.js` | ✅ (đăng ký sẵn mọi route mới ở GY-00) | | | |
| BE `modules/membership-plan/**`, `membership/membership-invoice.service.js`, `membership/membership.service.js` | ✅ | | | |
| BE `modules/course-order/**` (mới), `class/class-enrollment.service.js`, `class/class-booking-policy.service.js`, `class/class-member-eligibility.service.js` | ✅ | | | |
| BE `payment/payment-apply.service.js`, `payment/invoice-expiry.job.js`, `payment/invoice.service.js` | ✅ | | | |
| BE `attendance/attendance.service.js` (check-in) | ✅ | | | |
| BE `modules/cancellation/**`, `modules/credit/**`, `modules/purchase-change/**` (mới) | | ✅ | | |
| BE `attendance/attendance-excuse.service.js` (mới), `membership/membership-freeze.service.js`, `membership/freeze-resume.job.js` (mới) | | ✅ | | |
| BE `modules/report/**` | | ✅ | | |
| FE `pages/membership/**` **trừ** các file của Khôi bên phải | | | ✅ | |
| FE `pages/schedule/ClassCard.jsx`, `ClassBookingActions.jsx`, `BookingControls.jsx`, `CourseOrder*.jsx` (mới) | | | ✅ | |
| FE `pages/members/CheckIn*.jsx`, `services/membershipPlan.service.js`, `services/courseOrder.service.js` (mới) | | | ✅ | |
| FE `pages/membership/MembershipActions.jsx`, `FreezeControls.jsx`, `Cancel*.jsx`, `Change*.jsx` (mới) | | | | ✅ |
| FE `pages/schedule/EnrollmentActions.jsx` (mới), `ExcuseButton.jsx` (mới), `ScheduleEventCard.jsx` | | | | ✅ |
| FE `pages/payments/ApplyCreditButton.jsx` (mới), `pages/member/CreditPanel.jsx` (mới), `services/credit.service.js`, `services/purchase.service.js` (mới) | | | | ✅ |
| Test BE `tests/gopy-<mã việc>-*.test.js`, E2E `tests/e2e/gopy-<mã việc>-*.spec.mjs` | của ai người đó viết | | | |

**"Khe" do GY-00 tạo sẵn** (để FE của Khải và Khôi không đụng file nhau):
- `CurrentMembershipCard.jsx` (Khải) render `<MembershipActions membership={...} />` (file của Khôi, ban đầu trả `null`).
- `ClassBookingActions.jsx` (Khải) render `<EnrollmentActions item={...} memberId={...} />` (file của Khôi, ban đầu `null`).
- `OnlinePaymentPanel.jsx`, `InvoiceCashModal.jsx` render `<ApplyCreditButton invoice={...} />` (file của Khôi, ban đầu `null`).
- BE `payment-apply.service.js` (Nhanh) gọi `onAdjustmentPaid(tx, invoice)` từ `modules/purchase-change/purchase-change.service.js` (file của Bảo, ban đầu là hàm rỗng).

## 2. Schema (GY-00 tạo, mọi người code theo)

```prisma
enum InvoiceKind      { MEMBERSHIP COURSE ADJUSTMENT }          // mới
enum MembershipStatus { ACTIVE EXPIRED FROZEN CANCELLED }      // thêm FROZEN, CANCELLED
enum EnrollmentStatus { BOOKED CANCELLED PENDING_PAYMENT }     // thêm PENDING_PAYMENT
enum AttendanceStatus { PRESENT ABSENT EXCUSED }               // thêm EXCUSED
enum PaymentProvider  { COUNTER MANUAL SEPAY SIMULATOR CREDIT } // thêm CREDIT
enum SettlementMode   { REFUND CREDIT NONE }                    // mới
enum PurchaseChangeKind   { CANCEL_PLAN CANCEL_COURSE CHANGE_PLAN CHANGE_CLASS } // mới
enum PurchaseChangeStatus { PENDING_PAYMENT DONE CANCELLED }   // mới
enum CreditReason     { CANCELLATION CHANGE PAYMENT ADJUSTMENT } // mới

model MembershipPlan {           // = GÓI TỰ TẬP
  // ...giữ nguyên + 
  frames    PlanFrame[]          // khung giờ được vào
  areas     PlanRoomType[]       // loại phòng là khu tự tập được vào
}
model PlanFrame    { planId Int; frameId Int;    @@id([planId, frameId]) }      // plan_frames
model PlanRoomType { planId Int; roomTypeId Int; @@id([planId, roomTypeId]) }   // plan_room_types

model Membership {               // = MỘT KỲ GÓI, gắn đúng 1 hóa đơn
  // ...giữ nguyên +
  invoiceId   Int?      @unique  // hóa đơn tạo ra kỳ này (null với dữ liệu cũ trước migration nếu không tìm được)
  cancelledAt DateTime?
  // activeUserId CHỈ đặt cho kỳ đang hiệu lực (startDate ≤ now < endDate, không bảo lưu);
  // kỳ mua trước (nối tiếp) có status ACTIVE, activeUserId = null, startDate ở tương lai.
}

model GymClass        { /* + */ price Int @default(0) }        // học phí cả khóa (VND)

model Invoice {
  // planId      → Int? (null với hóa đơn khóa học)
  kind          InvoiceKind @default(MEMBERSHIP)
  classId       Int?        // hóa đơn khóa học
  sessionCount  Int?        // số buổi mua (khóa học)
  totalSessions Int?        // tổng buổi của lớp lúc mua
  changeId      Int?        // hóa đơn ADJUSTMENT thuộc lần đổi nào
}

model ClassEnrollment {
  // + 
  invoiceId     Int?       // hóa đơn khóa học đã trả (hoặc đang chờ)
  holdExpiresAt DateTime?  // PENDING_PAYMENT giữ chỗ đến lúc này (= invoice.expiresAt)
}

model Attendance { /* status thêm EXCUSED */ excusedAt DateTime? }

model User { /* + */ creditBalance Int @default(0) }           // số dư hiện tại (cache của sổ)

model CreditTransaction {        // credit_transactions — SỔ SỐ DƯ, chỉ thêm
  id Int @id; userId Int; amount Int /* + vào, − ra */; balanceAfter Int
  reason CreditReason; invoiceId Int?; changeId Int?; note String?; actorId Int; createdAt DateTime
}

model PurchaseChange {           // purchase_changes — LỊCH SỬ HỦY / ĐỔI
  id Int @id; kind PurchaseChangeKind; status PurchaseChangeStatus; userId Int; actorId Int
  fromInvoiceId Int; fromMembershipId Int?; fromEnrollmentId Int?
  toPlanId Int?; toClassId Int?
  paidAmount Int      // số đã trả của hóa đơn gốc
  remainingValue Int  // giá trị phần chưa dùng
  fee Int             // phí hủy (0 khi đổi)
  newPrice Int        // giá mới (đổi) hoặc 0 (hủy)
  difference Int      // newPrice − remainingValue (+ thu thêm, − trả lại)
  settlement SettlementMode
  adjustmentInvoiceId Int?; refundId Int?; creditTransactionId Int?
  createdAt DateTime; completedAt DateTime?
}
```

Cấu hình mới (`core/shared/src/settings*.js`): `CANCELLATION_FEE_PERCENT` = 10, `MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS` = 60.
Giữ `MEMBERSHIP_FREEZE_MIN_DAYS` = 7; `MEMBERSHIP_FREEZE_MAX_DAYS` / `MAX_TIMES` thôi dùng (không xóa khỏi DB).

**Quyền: không thêm quyền mới.** Hội viên tự làm: `membership.purchase` (mua/hủy/đổi gói), `class.enroll_self`
(mua khóa), `class.cancel_self` (báo nghỉ, hủy/đổi khóa), `payment.read_own` (số dư). Nhân viên làm hộ:
`membership.manage`, `class.enroll_for_member`, `payment.read_all`. Hoàn tiền vẫn cần `payment.refund`.

## 3. Công thức tiền (Bảo viết, Nhanh dùng lại — đặt ở `modules/cancellation/settlement.js`)

```
làm tròn(x)       = Math.round(x / 1000) * 1000   // làm tròn nghìn đồng
giá trị còn lại:
  gói tự tập      = làm tròn(paid × ngày_chưa_dùng / tổng_ngày_kỳ)     // ngày theo lịch VN, kỳ chưa bắt đầu = paid
  khóa học        = làm tròn(paid × buổi_chưa_diễn_ra / sessionCount)  // buổi SCHEDULED tương lai của lớp
phí hủy           = trước ngày bắt đầu ? 0 : làm tròn(remainingValue × CANCELLATION_FEE_PERCENT / 100)
hoàn khi hủy      = remainingValue − fee
đổi               : difference = newPrice − remainingValue   (không phí)
học phí giữa khóa = làm tròn(price × buổi_còn_lại / tổng_buổi)
```

Ví dụ phải có test: khóa 1.200.000 đ, 18 buổi, đã học 6 → còn 800.000, phí 80.000, hoàn 720.000.
Đổi sang khóa 1.500.000 đ (cùng số buổi còn lại = giá đầy đủ) → difference = +700.000.

## 4. API

Response chuẩn `{ success, data, message }`. Tiền là số nguyên VND. Thời gian ISO UTC.

### GĐ2 – Nhanh

| Method + path | Body / query | Trả về `data` |
|---|---|---|
| `GET /membership-plans` | như cũ | mỗi gói thêm `frames: [{id,name,startTime,endTime}]`, `areas: [{id,name}]` |
| `POST/PUT /membership-plans` | + `frameIds: number[]`, `roomTypeIds: number[]` (loại phòng `isSelfTrainingArea`) | gói |
| `GET /memberships/me/current` | | kỳ hiện tại `{ id, plan, startDate, endDate, status, invoiceId, frames, areas, nextPeriods: [...] }` |
| `GET /classes`, `GET /classes/:id` | | mỗi lớp thêm `price`, `totalSessions`, `remainingSessions`, `priceForRemaining`, `enrollment.status` có thể là `PENDING_PAYMENT` + `holdExpiresAt`, `enrollment.invoiceId` |
| `POST /classes/:id/orders` | `{ memberId? , channel?: 'ONLINE' \| 'COUNTER' }` (hội viên: ONLINE; lễ tân: COUNTER + memberId) | hóa đơn khóa học (như hóa đơn gói, `kind: 'COURSE'`, `classId`, `sessionCount`, `paymentInstruction`) ; enrollment `PENDING_PAYMENT` |
| `POST /check-ins` | như cũ | lỗi 422 mới: "Ngoài khung giờ của gói (…)", "Gói không cho vào khu vực …" |

Bỏ luật cũ "phải có gói tự tập mới đăng ký lớp". `POST /classes/:id/enrollments/me` (đăng ký miễn phí) **chỉ còn cho
lớp `price = 0`**; lớp có học phí → 422 "Lớp có học phí, hãy đăng ký khóa học".

### GĐ3 – Bảo

| Method + path | Body / query | Trả về `data` |
|---|---|---|
| `POST /classes/sessions/:id/excuse` | `{ memberId? }` | attendance `EXCUSED` — chỉ trước hạn `CLASS_CANCEL_MIN_HOURS_BEFORE` |
| `GET /memberships/:id/cancel-preview` | | `{ paidAmount, remainingValue, fee, refundAmount, beforeStart }` |
| `POST /memberships/:id/cancel` | `{ settlement: 'REFUND' \| 'CREDIT', reason }` | `PurchaseChange` |
| `GET /enrollments/:id/cancel-preview` · `POST /enrollments/:id/cancel` | như trên | như trên |
| `GET /me/credit` · `GET /members/:id/credit` | `?page&pageSize` | `{ balance, items: CreditTransaction[] }` |
| `POST /invoices/:id/apply-credit` | `{ amount? }` (mặc định dùng tối đa) | hóa đơn sau khi trừ (Payment `CREDIT` qua `applyTransfer`) |
| `GET /memberships/:id/change-preview?planId=` · `POST /memberships/:id/change` | `{ planId, settlement? }` | `{ remainingValue, newPrice, difference }` / `PurchaseChange` (+ `adjustmentInvoice` nếu thu thêm) |
| `GET /enrollments/:id/change-preview?classId=` · `POST /enrollments/:id/change` | `{ classId, settlement? }` | như trên |

### GĐ4 – Bảo

| Method + path | Body | Ghi chú |
|---|---|---|
| `POST /memberships/:id/freezes` | `{ from, to }` | kỳ chuyển `FROZEN` khi tới ngày bắt đầu; tổng ≤ 60 ngày/kỳ |
| `POST /memberships/:id/freezes/resume` | | về `ACTIVE`, cộng bù đúng ngày đã dừng |
| `GET /memberships/:id` | | thêm `freezeDaysUsed`, `freezeDaysLeft`, `freezes[]` |

## 5. Thứ tự gộp

1. `feature/gopy-gd1-lich-hoc` (GĐ1, đã code) — review GY-R1, GY-R2 → merge.
2. `feature/gopy-gy00-nen-du-lieu` (Nhanh) — schema, migration, cấu hình, route rỗng, "khe" FE/BE → merge **trước mọi PR khác**.
3. PR BE: GY-20 (Nhanh), GY-30/32/33/35/40 (Bảo) — merge khi review xong, không phụ thuộc nhau ngoài file hợp đồng.
4. PR FE: GY-21/22 (Khải), GY-31/34/41 (Khôi) — merge sau PR BE tương ứng.
5. GY-50…53 hoàn thiện.

Trước khi xin review: `git fetch && git rebase origin/main`, `npm run lint`, `npm test`, E2E liên quan, rồi
`npm run db:demo` và tự đi lại luồng trên giao diện.
