import { http } from './http';

/**
 * Giá và số buổi do server quyết định; hỗ trợ cả payload đầy đủ và memberId đơn giản.
 */
export const createCourseOrder = (classId, payloadOrMemberId) => {
  const payload =
    typeof payloadOrMemberId === 'string'
      ? payloadOrMemberId
        ? { memberId: payloadOrMemberId }
        : {}
      : (payloadOrMemberId ?? {});
  return http.post(`/classes/${classId}/orders`, payload);
};
