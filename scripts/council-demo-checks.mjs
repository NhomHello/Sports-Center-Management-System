import assert from 'node:assert/strict';
import { workflow1, workflow2, workflow3, workflow4 } from './council-check-workflows.mjs';
import { checkExceptions } from './council-check-exceptions.mjs';

/** Exercise the narrated workflows and exceptions on an isolated database. */
export async function checkCouncilDemo({ manifest: m, env, prisma, request }) {
  const results = [];
  const tokens = {};
  for (const [key, account] of Object.entries(m.accounts)) {
    const login = await request('POST', '/auth/login', {
      email: account.email,
      password: key === 'manager' ? env.SEED_ADMIN_PASSWORD : env.SEED_MOCK_PASSWORD,
    });
    assert.equal(login.status, 200, `Login ${key}`);
    tokens[key] = login.body.data.accessToken;
  }
  const send = async (method, path, body, actor, status = 200) => {
    const result = await request(method, path, body, tokens[actor]);
    assert.equal(result.status, status, `${method} ${path}: ${result.body.message || ''}`);
    return result.body.data;
  };
  const context = { m, env, prisma, request, tokens, send, results };
  for (const verify of [workflow1, workflow2, workflow3, workflow4, checkExceptions])
    await verify(context);
  const { invoice } = context;
  return {
    passed: true,
    checks: results,
    invoiceCode: invoice.code,
    amount: invoice.amount,
    scope: 'Isolated HTTP rehearsal; payment callback simulated; no actual bank transfer',
  };
}
