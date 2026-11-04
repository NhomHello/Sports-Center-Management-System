import { useEffect, useState } from 'react';

const TICK_MS = 1000;
/** Đồng hồ UI chỉ khóa thao tác sớm; server quyết định thời điểm chốt dưới khóa database. */
export const usePaymentDeadline = (invoice) => {
  const [now, setNow] = useState(Date.now);
  const deadline = invoice?.paymentDeadline ?? invoice?.expiresAt;
  useEffect(() => {
    if (!deadline) return undefined;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);
  return {
    now,
    expired: invoice?.kind === 'COURSE' && new Date(deadline).getTime() <= now,
  };
};
