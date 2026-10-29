import { describe, expect, it } from 'vitest';
import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema,
} from '../src/modules/membership-plan/membership-plan.validation.js';

const base = {
  code: 'SELF_TRAIN',
  name: 'Self Training',
  durationDays: 30,
  price: 200000,
};

describe('GY-20: self-training membership plan validation', () => {
  it('accepts unique frame and self-training room type identifiers', () => {
    const result = createMembershipPlanSchema.body.safeParse({
      ...base,
      frameIds: [1, 2],
      roomTypeIds: [3],
    });
    expect(result.success).toBe(true);
  });

  it('rejects duplicate frame identifiers', () => {
    const result = createMembershipPlanSchema.body.safeParse({
      ...base,
      frameIds: [1, 1],
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate room type identifiers', () => {
    const result = updateMembershipPlanSchema.body.safeParse({
      roomTypeIds: [5, 5],
    });
    expect(result.success).toBe(false);
  });

  it('allows empty arrays to clear access during an update', () => {
    const result = updateMembershipPlanSchema.body.safeParse({
      frameIds: [],
      roomTypeIds: [],
    });
    expect(result.success).toBe(true);
  });
});
