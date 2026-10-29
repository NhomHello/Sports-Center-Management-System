const PERCENT = 100;
const MIN_PLANS_TO_COMPARE = 2;

/** Đơn giá mỗi ngày của gói (đồng). */
export const pricePerDay = (plan) => Math.round(plan.price / plan.durationDays);

/**
 * % tiết kiệm của từng gói so với gói ngắn nhất đang bán (mốc giá gốc), làm tròn;
 * chỉ trả về gói thực sự rẻ hơn mỗi ngày.
 * @param {Array<{id:number,price:number,durationDays:number,isActive?:boolean}>} plans
 * @returns {Map<number, number>} planId -> phần trăm
 */
export const computeSavings = (plans) => {
  const selling = plans.filter((plan) => plan.isActive !== false && plan.durationDays > 0);
  const savings = new Map();
  if (selling.length < MIN_PLANS_TO_COMPARE) return savings;
  const base = selling.reduce((a, b) => (b.durationDays < a.durationDays ? b : a));
  const basePerDay = base.price / base.durationDays;
  for (const plan of selling) {
    const percent = Math.round((1 - plan.price / plan.durationDays / basePerDay) * PERCENT);
    if (percent > 0) savings.set(plan.id, percent);
  }
  return savings;
};
