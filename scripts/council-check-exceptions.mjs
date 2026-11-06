import assert from 'node:assert/strict';

/** Verify each prepared negative case without changing the main demonstration data. */
export async function checkExceptions(context) {
  const { m, send, results, request, payload, env, prisma, invoice, transferred, b } = context;
  const near = m.courses.NEAR.sessions[0];
  await send(
    'POST',
    `/classes/sessions/${near.id}/reschedule-preview`,
    {
      startAt: new Date(+new Date(near.startAt) + 3600000).toISOString(),
      endAt: new Date(+new Date(near.endAt) + 3600000).toISOString(),
    },
    'manager',
    422,
  );
  results.push('EX1: insufficient reschedule notice rejected');
  for (const key of ['MEMBER_CONFLICT', 'COACH_CONFLICT', 'ROOM_CONFLICT']) {
    const target = m.courses[key].sessions[0];
    await send(
      'POST',
      `/classes/sessions/${m.courses.R.sessions[0].id}/reschedule-preview`,
      { startAt: target.startAt, endAt: target.endAt },
      'manager',
      409,
    );
    results.push(`EX1 reserve: ${key} rejected independently`);
  }
  for (const key of ['FULL', 'OTHER'])
    await send(
      'GET',
      `/enrollments/${transferred.id}/change-preview?classId=${m.courses[key].id}`,
      undefined,
      'member',
      422,
    );
  const repeated = await request('POST', '/payments/sepay/webhook', payload, null, {
    Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
  });
  assert.equal(repeated.body.data.status, 'DUPLICATE');
  assert.equal(await prisma.payment.count({ where: { invoiceId: invoice.id } }), 1);
  results.push('EX2: full/wrong-subject targets blocked; repeated webhook does not add payment');
  await send(
    'PUT',
    `/classes/sessions/${b.sessions[2].id}/attendance`,
    { entries: [{ memberId: m.accounts.member.id, status: 'PRESENT' }] },
    'coach',
    422,
  );
  results.push('EX3: future attendance rejected');
  await send('POST', `/classes/${m.courses.C_BAD.id}/summary/publish`, {}, 'otherCoach', 422);
  assert.equal(
    (await prisma.courseSummary.findUniqueOrThrow({ where: { classId: m.courses.C_BAD.id } }))
      .status,
    'DRAFT',
  );
  results.push('EX4: incomplete C_BAD stays DRAFT');
}
