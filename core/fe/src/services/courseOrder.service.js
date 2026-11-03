import { http } from './http';

/**
 * Giá và số buổi do server quyết định; hỗ trợ cả payload đầy đủ và memberId đơn giản.
 */
export const createCourseOrder = (classId, payloadOrMemberId) => {
  const payload =
    typeof payloadOrMemberId === 'string' || typeof payloadOrMemberId === 'number'
      ? payloadOrMemberId
        ? { memberId: payloadOrMemberId }
        : {}
      : (payloadOrMemberId ?? {});
  return http.post(`/classes/${classId}/orders`, { joinWaitlistWhenFull: true, ...payload });
};
