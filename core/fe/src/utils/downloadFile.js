/** Tải Blob do server cung cấp và giải phóng URL tạm sau khi trình duyệt nhận liên kết. */
export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
