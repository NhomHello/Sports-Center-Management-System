/**
 * Flow 3 - Hoa don & thanh toan (man hinh 14, 15, 16, 18).
 * status: PENDING | PAID | FAILED | REFUNDED. method: SEPAY | CASH | BANK_TRANSFER.
 */
export const invoices = [
  {
    id: 1,
    code: 'INV000001',
    memberId: 5,
    memberName: 'Phạm Hội Viên 1',
    planName: 'Gói 3 tháng',
    amount: 1350000,
    method: 'SEPAY',
    status: 'PAID',
    createdAt: '2026-08-01T08:12:00+07:00',
    paidAt: '2026-08-01T08:14:30+07:00',
  },
  {
    id: 2,
    code: 'INV000002',
    memberId: 6,
    memberName: 'Phạm Hội Viên 2',
    planName: 'Gói 1 tháng',
    amount: 500000,
    method: 'CASH',
    status: 'PAID',
    createdAt: '2026-08-15T17:30:00+07:00',
    paidAt: '2026-08-15T17:30:00+07:00',
  },
  {
    id: 3,
    code: 'INV000003',
    memberId: 7,
    memberName: 'Phạm Hội Viên 3',
    planName: 'Gói 1 tháng',
    amount: 500000,
    method: 'SEPAY',
    status: 'PENDING',
    createdAt: '2026-09-08T20:05:00+07:00',
    paidAt: null,
  },
  {
    id: 4,
    code: 'INV000004',
    memberId: 8,
    memberName: 'Phạm Hội Viên 4',
    planName: 'Gói 12 tháng',
    amount: 4800000,
    method: 'SEPAY',
    status: 'FAILED',
    createdAt: '2026-09-07T10:00:00+07:00',
    paidAt: null,
  },
  {
    id: 5,
    code: 'INV000005',
    memberId: 9,
    memberName: 'Phạm Hội Viên 5',
    planName: 'Gói 3 tháng',
    amount: 1350000,
    method: 'BANK_TRANSFER',
    status: 'REFUNDED',
    createdAt: '2026-08-20T09:00:00+07:00',
    paidAt: '2026-08-20T09:05:00+07:00',
  },
];

/** Man hinh 15: trang thai cho thanh toan SePay */
export const payments = [
  {
    invoiceCode: 'INV000003',
    amount: 500000,
    qrContent: 'SEPAY_QR_PLACEHOLDER',
    transferContent: 'INV000003',
    bankAccount: '0000000000',
    bankName: 'MB Bank',
    expiresAt: '2026-09-08T20:20:00+07:00',
    status: 'PENDING',
  },
];
