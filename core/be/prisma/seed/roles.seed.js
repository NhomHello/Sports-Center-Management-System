/**
 * Dinh nghia role ban dau. DAY LA NOI DUY NHAT trong code duoc phep viet ten role.
 * Sau khi seed, Center Manager tu tao/sua/xoa role va quyen tren UI - code khong can doi.
 *
 * - permissions: 'ALL' => luon duoc cap toan bo permission moi lan seed (role quan tri)
 * - permissions: [...]  => chi ap dung khi role duoc TAO MOI; role da co thi giu nguyen
 *                          quyen manager da chinh tren UI
 */
import { PERMISSIONS as P } from '@scms/shared';

export const SEED_ADMIN_ROLE_CODE = 'CENTER_MANAGER';

export const SEED_ROLES = [
  {
    code: 'CENTER_MANAGER',
    name: 'Quản lý trung tâm',
    description: 'Toàn quyền quản trị hệ thống',
    isSystem: true,
    isDefault: false,
    permissions: 'ALL',
  },
  {
    code: 'RECEPTIONIST',
    name: 'Lễ tân',
    description: 'Tiếp nhận tại quầy: đăng ký hộ, ghi nhận thanh toán, in hoá đơn',
    isSystem: true,
    isDefault: false,
    permissions: [
      P.DASHBOARD_VIEW,
      P.MEMBER_READ,
      P.MEMBER_CREATE,
      P.MEMBER_UPDATE,
      P.MEMBERSHIP_PLAN_READ,
      P.MEMBERSHIP_MANAGE,
      P.MEMBERSHIP_READ_ALL,
      P.SUBJECT_READ,
      P.ROOM_READ,
      P.CLASS_READ,
      P.CLASS_ENROLL_FOR_MEMBER,
      P.PAYMENT_RECORD_CASH,
      P.PAYMENT_READ_ALL,
      P.INVOICE_READ_ALL,
      P.INVOICE_EXPORT,
    ],
  },
  {
    code: 'COACH',
    name: 'Huấn luyện viên',
    description: 'Xem lịch dạy và danh sách học viên',
    isSystem: true,
    isDefault: false,
    permissions: [P.DASHBOARD_VIEW, P.SCHEDULE_VIEW_TEACHING, P.CLASS_READ, P.CLASS_VIEW_ROSTER],
  },
  {
    code: 'MEMBER',
    name: 'Hội viên',
    description: 'Tài khoản tự đăng ký online hoặc được lễ tân tạo',
    isSystem: true,
    isDefault: true,
    permissions: [
      P.DASHBOARD_VIEW,
      P.MEMBERSHIP_PLAN_READ,
      P.MEMBERSHIP_READ_OWN,
      P.MEMBERSHIP_PURCHASE,
      P.CLASS_READ,
      P.CLASS_ENROLL_SELF,
      P.CLASS_CANCEL_SELF,
      P.SCHEDULE_VIEW_OWN,
      P.PAYMENT_CHECKOUT,
      P.PAYMENT_READ_OWN,
      P.INVOICE_READ_OWN,
    ],
  },
];
