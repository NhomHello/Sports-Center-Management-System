// Chạy trước CSS/React: trang đang tải vẫn tôn trọng lựa chọn giao diện.
(function () {
  let mode = 'system';
  try {
    const saved = localStorage.getItem('scms-theme-preference');
    if (['light', 'dark', 'system'].indexOf(saved) !== -1) mode = saved;
  } catch {
    // Trình duyệt có thể từ chối lưu trữ; mặc định vẫn theo thiết bị.
  }
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = root.dataset.theme;
  root.style.setProperty('--scms-canvas', dark ? '#0b1220' : '#f6f8fc');
  root.style.setProperty('--scms-text', dark ? '#e6edf7' : '#17243b');
  root.style.setProperty('--scms-surface', dark ? '#111c2e' : '#ffffff');
})();
