import assert from 'node:assert/strict';
/** Verify workflow1 using actual HTTP requests. */
export async function workflow1(context) {
  const { m, send, results } = context;
  const created = await send('POST', '/classes', m.createAInWorkflow1.form, 'manager', 201);
  await send(
    'PUT',
    '/me/member-profile',
    { goals: 'Mục tiêu diễn tập vừa cập nhật', shareWithCoach: true },
    'member',
  );
  results.push('WF1: create A and update the same member profile');
  Object.assign(context, { created });
}

/** Verify workflow2 using actual HTTP requests. */
export async function workflow2(context) {
  const { m, send, results, created, request, env, prisma } = context;
  const invoice = await send('POST', `/classes/${created.id}/orders`, {}, 'member', 201);
  const detail = await send('GET', `/invoices/${invoice.id}`, undefined, 'member');
  assert.equal(detail.paymentInstruction.content, invoice.code);
  assert.ok(detail.paymentInstruction.qrUrl);
  const payload = {
    id: `council-check-${m.tag}`,
    transferType: 'in',
    transferAmount: invoice.amount,
    code: 'SEV123',
    content: invoice.code,
  };
  const webhook = await request('POST', '/payments/sepay/webhook', payload, null, {
    Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.body.data.outcome, 'PAID');
  assert.equal(
    (await send('GET', `/invoices/${invoice.id}`, undefined, 'reception')).status,
    'PAID',
  );
  const original = await prisma.classEnrollment.findFirstOrThrow({
    where: { invoiceId: invoice.id },
  });
  const change = await send(
    'POST',
    `/enrollments/${original.id}/change`,
    { classId: m.courses.A2.id, settlement: 'REFUND' },
    'member',
  );
  assert.equal(change.status, 'DONE');
  assert.equal(
    (await prisma.classEnrollment.findUniqueOrThrow({ where: { id: original.id } })).status,
    'CANCELLED',
  );
  const transferred = await prisma.classEnrollment.findFirstOrThrow({
    where: { classId: m.courses.A2.id, memberId: m.accounts.member.id },
  });
  assert.equal(transferred.status, 'BOOKED');
  results.push(
    'WF2: online QR, authenticated webhook, same receipt and whole-course transfer A to A2',
  );
  Object.assign(context, { invoice, payload, transferred });
}

/** Verify workflow3 using actual HTTP requests. */
export async function workflow3(context) {
  const { m, send, results } = context;
  const b = m.courses.B;
  await send(
    'PUT',
    `/classes/sessions/${b.sessions[1].id}/attendance`,
    { entries: [{ memberId: m.accounts.member.id, status: 'PRESENT' }] },
    'coach',
  );
  await send(
    'PUT',
    `/classes/sessions/${b.sessions[1].id}/feedback/${m.accounts.member.id}`,
    { expectedVersion: 0, rating: 5, note: 'Phản hồi diễn tập' },
    'coach',
  );
  await send('GET', `/attendance/feedback/me?classId=${b.id}`, undefined, 'member');
  results.push('WF3: authorized attendance and feedback visible to the same member');
  Object.assign(context, { b });
}

/** Verify workflow4 using actual HTTP requests. */
export async function workflow4(context) {
  const { m, send, results, prisma, request, tokens, created } = context;
  await send('POST', `/classes/${m.courses.C.id}/summary/publish`, {}, 'coach');
  const item = await prisma.courseSummaryItem.findFirstOrThrow({
    where: { summary: { classId: m.courses.C.id }, memberId: m.accounts.member.id },
  });
  const pdf = await request('GET', `/me/course-results/${item.id}/pdf`, undefined, tokens.member);
  assert.equal(pdf.status, 200);
  assert.match(pdf.mime, /pdf/);
  assert.ok(pdf.body.bytes > 0);
  await send(
    'POST',
    `/classes/${m.courses.C.id}/ratings`,
    { courseStars: 5, coachStars: 5, comment: 'Diễn tập' },
    'member',
    201,
  );
  await send(
    'GET',
    `/reports/revenue?from=${m.localDate}&to=${m.localDate}&classId=${created.id}&memberId=${m.accounts.member.id}`,
    undefined,
    'manager',
  );
  results.push('WF4: publish C, member PDF and rating, filtered A/M financial report');
}
