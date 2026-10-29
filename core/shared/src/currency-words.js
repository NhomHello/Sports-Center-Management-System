const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const GROUP_BASE = 1000;
const HUNDRED = 100;
const TEN = 10;
const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readGroup(value, full) {
  const hundred = Math.floor(value / HUNDRED);
  const tens = Math.floor((value % HUNDRED) / TEN);
  const ones = value % TEN;
  const words = [];
  if (hundred || full) words.push(DIGITS[hundred], 'trăm');
  if (tens > 1) words.push(DIGITS[tens], 'mươi');
  if (tens === 1) words.push('mười');
  if (!tens && ones && (hundred || full)) words.push('lẻ');
  if (ones) words.push(readOnes(ones, tens));
  return words.join(' ');
}
function readOnes(ones, tens) {
  if (ones === 1 && tens > 1) return 'mốt';
  if (ones === 5 && tens) return 'lăm';
  return DIGITS[ones];
}
/** Số nguyên VND thành chữ để dùng chung bản in trình duyệt và PDF. */
export const amountInWords = (amount) => {
  if (!Number.isSafeInteger(amount) || amount < 0) return '';
  if (!amount) return 'Không đồng';
  const groups = [];
  let value = amount;
  while (value > 0) {
    groups.push(value % GROUP_BASE);
    value = Math.floor(value / GROUP_BASE);
  }
  const words = groups
    .map((group, index) =>
      group ? `${readGroup(group, index < groups.length - 1)} ${UNITS[index]}`.trim() : '',
    )
    .reverse()
    .filter(Boolean)
    .join(' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng`;
};
