import { describe, it, expect } from 'vitest';
import { amountInWords } from '@scms/shared';
describe('Receipt VND amount in words', () => {
  it('TC-S3-PDF-01: reads zero and special digit forms', () => {
    expect(amountInWords(0)).toBe('Không đồng');
    expect(amountInWords(15)).toBe('Mười lăm đồng');
    expect(amountInWords(21)).toBe('Hai mươi mốt đồng');
    expect(amountInWords(1005)).toBe('Một nghìn không trăm lẻ năm đồng');
    expect(amountInWords(300000)).toBe('Ba trăm nghìn đồng');
    expect(amountInWords(1000000000)).toBe('Một tỷ đồng');
  });
  it('TC-S3-PDF-02: rejects invalid monetary values', () => {
    expect(amountInWords(-1)).toBe('');
    expect(amountInWords(1.5)).toBe('');
    expect(amountInWords(NaN)).toBe('');
  });
});
