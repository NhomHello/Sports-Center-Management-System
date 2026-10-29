import { useSearchParams } from 'react-router';
/** Link từ hồ sơ HLV mở lớp cụ thể; đóng drawer xoá query để không tự mở lại. */
export const useClassDetailLink = (detailId, setDetailId) => {
  const [params, setParams] = useSearchParams();
  const linkedId = Number(params.get('class')) || null;
  const closeDetail = () => {
    setDetailId(null);
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('class');
        return next;
      },
      { replace: true },
    );
  };
  return { displayedId: detailId || linkedId, closeDetail };
};
