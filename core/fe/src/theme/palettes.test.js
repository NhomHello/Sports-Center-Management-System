import { describe, expect, it } from 'vitest';
import { PALETTES } from './palettes';

function luminance(hex) {
  const values = hex
    .slice(1)
    .match(/../g)
    .map((value) => parseInt(value, 16) / 255);
  const [r, g, b] = values.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
const contrast = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

describe('Tương phản palette ngữ nghĩa', () => {
  for (const mode of ['light', 'dark']) {
    it(`${mode}: chữ, chữ phụ, liên kết và nút đạt WCAG AA`, () => {
      const p = PALETTES[mode];
      for (const text of ['text', 'muted', 'subtle', 'blue', 'success', 'warning', 'danger']) {
        for (const surface of ['canvas', 'surface', 'surface-soft'])
          expect(
            contrast(p[text], p[surface]),
            `${mode}/${text}/${surface}`,
          ).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(p['on-accent'], p.action)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p['on-accent'], p['danger-action'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.purple, p['purple-soft'])).toBeGreaterThanOrEqual(4.5);
      for (const status of ['success', 'warning', 'danger'])
        expect(contrast(p[status], p[`${status}-soft`])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.blue, p['soft-blue'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p['focus-ring'], p.surface)).toBeGreaterThanOrEqual(3);
    });
  }
});
