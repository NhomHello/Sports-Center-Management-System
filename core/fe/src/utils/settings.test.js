import { describe, expect, it } from 'vitest';
import { getSettingValidationError, SETTING_TYPES } from '@scms/shared';
import { getChangedSettingPayload, getSettingFormValues } from './settings';

describe('settings metadata and payload', () => {
  const groups = [
    {
      group: 'TEST',
      items: [
        { key: 'NUMBER', type: SETTING_TYPES.NUMBER, value: '0' },
        { key: 'ENABLED', type: SETTING_TYPES.BOOLEAN, value: 'true' },
        { key: 'OPTIONAL', type: SETTING_TYPES.STRING, value: '' },
        { key: 'READ_ONLY', type: SETTING_TYPES.STRING, value: 'keep', editable: false },
      ],
    },
  ];
  it('keeps numeric zero and boolean false; sends only changed permitted API keys', () => {
    expect(getSettingFormValues(groups)).toEqual({
      NUMBER: 0,
      ENABLED: true,
      OPTIONAL: '',
      READ_ONLY: 'keep',
    });
    expect(
      getChangedSettingPayload(
        { NUMBER: 0, ENABLED: false, OPTIONAL: '', READ_ONLY: 'modified', UNKNOWN: 5 },
        groups,
      ),
    ).toEqual([{ key: 'ENABLED', value: 'false' }]);
  });
  it.each([
    [{ type: SETTING_TYPES.NUMBER, minValue: 0 }, -1],
    [{ type: SETTING_TYPES.NUMBER, maxValue: 5 }, 6],
    [{ type: SETTING_TYPES.NUMBER }, Infinity],
    [{ type: SETTING_TYPES.NUMBER }, null],
    [{ type: SETTING_TYPES.NUMBER, integer: true }, 1.5],
    [{ type: SETTING_TYPES.JSON }, '{invalid}'],
    [{ type: SETTING_TYPES.BOOLEAN }, 'anything'],
    [{ type: SETTING_TYPES.STRING, maxLength: 3 }, 'long'],
  ])('rejects invalid value %s / %s before a request', (setting, value) => {
    expect(getSettingValidationError(setting, value)).toBeTypeOf('string');
  });
  it('accepts blank optional string, valid JSON and unspecified numeric domains', () => {
    expect(getSettingValidationError({ type: SETTING_TYPES.STRING }, '')).toBeNull();
    expect(getSettingValidationError({ type: SETTING_TYPES.JSON }, '{"enabled":false}')).toBeNull();
    expect(getSettingValidationError({ type: SETTING_TYPES.NUMBER }, -5)).toBeNull();
  });
});
