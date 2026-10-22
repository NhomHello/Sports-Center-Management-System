/** BR-1.12: giữ quyền đăng ký, chỉ cảnh báo các buổi sau ngày hết hạn. */
export const membershipWarning = (membership, sessions) => {
  const affectedSessionCount = membership
    ? sessions.filter((s) => s.startAt >= membership.endDate).length
    : 0;
  return {
    membershipExpiresBeforeClassEnd: affectedSessionCount > 0,
    affectedSessionCount,
    membershipEndDate: membership?.endDate ?? null,
  };
};
