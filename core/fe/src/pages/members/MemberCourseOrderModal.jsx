import { useState } from 'react';
import { CounterInvoiceModal } from '@/pages/payments/CounterInvoiceModal';
import { CourseOrderCashModal } from '@/pages/schedule/CourseOrderCashModal';
/** Chọn học viên sẵn từ CRM, không đi qua danh mục gói tự tập. */
export function MemberCourseOrderModal({ member, open, onClose }) {
  const [invoiceId, setInvoiceId] = useState(null);
  if (!member || !open) return null;
  if (invoiceId)
    return (
      <CourseOrderCashModal
        invoiceId={invoiceId}
        onClose={() => {
          setInvoiceId(null);
          onClose();
        }}
      />
    );
  return (
    <CounterInvoiceModal
      key={member.id}
      open
      initialMember={member}
      onClose={onClose}
      onCreated={setInvoiceId}
    />
  );
}
