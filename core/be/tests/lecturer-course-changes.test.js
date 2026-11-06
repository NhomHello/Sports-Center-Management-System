import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  buyCourseCash,
  cleanupGopyFixture,
  createGopyFixture,
  createPaidClass,
} from './helpers/gopy.js';
import { sendConflictTransfer } from './helpers/course-conflict.js';
import { classPayload } from './helpers/sprint2.js';

const HOUR = 3600000;
let f;
let source;
let target;
let transactionId;
beforeEach(async () => {
  f = await createGopyFixture();
  source = await createPaidClass(f);
  target = await createPaidClass(f, {
    roomId: f.roomOther.id,
    coachId: f.coachOther.id,
    weeklySchedule: [
      { ...classPayload(f).weeklySchedule[0], startTime: '19:00', endTime: '20:00' },
    ],
  });
});
afterEach(async () => {
  if (transactionId) {
    await prisma.reconciliationCase.deleteMany({
      where: { webhookLog: { providerTransactionId: transactionId } },
    });
    await prisma.paymentWebhookLog.deleteMany({ where: { providerTransactionId: transactionId } });
    transactionId = undefined;
  }
  await cleanupGopyFixture(f);
});

describe('Lecturer course transfer and reschedule requirements', () => {
  it('expired adjustment payment cannot cancel the source or revive the target hold', async () => {
    const enrollment = await buyCourseCash(f, source.id, f.member.id);
    await prisma.gymClass.update({ where: { id: target.id }, data: { price: 1800000 } });
    const requested = await f.call(
      'post',
      `/enrollments/${enrollment.id}/change`,
      { classId: target.id },
      f.memberToken,
    );
    const invoice = await prisma.invoice.update({
      where: { id: requested.body.data.adjustmentInvoiceId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    transactionId = `expired-course-change-${Date.now()}`;
    const response = await sendConflictTransfer(transactionId, invoice);
    expect(response.body.data).toMatchObject({ status: 'NEEDS_REVIEW', reason: 'LATE' });
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
    expect(
      (await prisma.classEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status,
    ).toBe('BOOKED');
  });
  it('rejects a different subject in both preview and mutation', async () => {
    const enrollment = await buyCourseCash(f, source.id, f.member.id);
    const different = await prisma.subject.create({ data: { name: `${f.prefix} different` } });
    try {
      await prisma.gymClass.update({ where: { id: target.id }, data: { subjectId: different.id } });
      const preview = await f.call(
        'get',
        `/enrollments/${enrollment.id}/change-preview?classId=${target.id}`,
        undefined,
        f.memberToken,
      );
      const change = await f.call(
        'post',
        `/enrollments/${enrollment.id}/change`,
        { classId: target.id },
        f.memberToken,
      );
      expect(preview.status).toBe(422);
      expect(change.status).toBe(422);
      expect(change.body.message).toContain('cùng bộ môn');
      expect(
        await prisma.purchaseChange.count({ where: { fromEnrollmentId: enrollment.id } }),
      ).toBe(0);
    } finally {
      await prisma.gymClass.update({ where: { id: target.id }, data: { subjectId: f.subject.id } });
      await prisma.subject.delete({ where: { id: different.id } });
    }
  });
  it('rejects a full equivalent course without cancelling the source', async () => {
    const enrollment = await buyCourseCash(f, source.id, f.member.id);
    await prisma.gymClass.update({ where: { id: target.id }, data: { capacity: 1 } });
    await buyCourseCash(f, target.id, f.other.id);
    const res = await f.call(
      'post',
      `/enrollments/${enrollment.id}/change`,
      { classId: target.id },
      f.memberToken,
    );
    expect(res.status).toBe(422);
    expect((await prisma.classEnrollment.findUnique({ where: { id: enrollment.id } })).status).toBe(
      'BOOKED',
    );
  });
  it('blocks preview and write inside 48 hours and preserves the old session', async () => {
    const session = source.sessions[0];
    const startAt = new Date(Date.now() + 47 * HOUR);
    await prisma.classSession.update({
      where: { id: session.id },
      data: { startAt, endAt: new Date(+startAt + HOUR) },
    });
    const data = { startAt: session.startAt, endAt: session.endAt };
    expect(
      (await f.call('post', `/classes/sessions/${session.id}/reschedule-preview`, data)).status,
    ).toBe(422);
    expect((await f.call('patch', `/classes/sessions/${session.id}`, data)).status).toBe(422);
    expect((await prisma.classSession.findUnique({ where: { id: session.id } })).startAt).toEqual(
      startAt,
    );
    const payload = classPayload(f, {
      price: source.price,
      weeklySchedule: [
        { ...classPayload(f).weeklySchedule[0], startTime: '20:00', endTime: '21:00' },
      ],
    });
    expect((await f.call('post', `/classes/${source.id}/update-preview`, payload)).status).toBe(
      422,
    );
    expect((await f.call('put', `/classes/${source.id}`, payload)).status).toBe(422);
  });
  it('pending payment seats block conflicting single-session and bulk changes', async () => {
    await buyCourseCash(f, source.id, f.member.id);
    expect((await f.call('post', `/classes/${target.id}/orders`, {}, f.memberToken)).status).toBe(
      201,
    );
    const slot = { startAt: target.sessions[0].startAt, endAt: target.sessions[0].endAt };
    const path = `/classes/sessions/${source.sessions[0].id}`;
    expect((await f.call('post', `${path}/reschedule-preview`, slot)).status).toBe(409);
    expect((await f.call('patch', path, slot)).status).toBe(409);
    const payload = classPayload(f, { price: source.price, weeklySchedule: target.weeklySchedule });
    expect((await f.call('post', `/classes/${source.id}/update-preview`, payload)).status).toBe(
      409,
    );
    expect((await f.call('put', `/classes/${source.id}`, payload)).status).toBe(409);
    expect(
      (
        await prisma.classSession.findUnique({ where: { id: source.sessions[0].id } })
      ).startAt.toISOString(),
    ).toBe(source.sessions[0].startAt);
  });
  it('switches the whole enrollment only after the additional payment succeeds', async () => {
    const enrollment = await buyCourseCash(f, source.id, f.member.id);
    await prisma.gymClass.update({ where: { id: target.id }, data: { price: 1800000 } });
    const requested = await f.call(
      'post',
      `/enrollments/${enrollment.id}/change`,
      { classId: target.id },
      f.memberToken,
    );
    expect(requested.status).toBe(200);
    expect(requested.body.data.status).toBe('PENDING_PAYMENT');
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: requested.body.data.adjustmentInvoiceId },
    });
    expect(invoice.amount).toBe(600000);
    expect(
      (await prisma.classEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status,
    ).toBe('BOOKED');
    transactionId = `whole-course-${Date.now()}`;
    const response = await sendConflictTransfer(transactionId, invoice);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: 'PROCESSED', outcome: 'PAID' },
    });
    expect(
      (await prisma.purchaseChange.findUniqueOrThrow({ where: { id: requested.body.data.id } }))
        .status,
    ).toBe('DONE');
    expect(
      (await prisma.classEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status,
    ).toBe('CANCELLED');
    expect(
      (
        await prisma.classEnrollment.findUniqueOrThrow({
          where: { classId_memberId: { classId: target.id, memberId: f.member.id } },
        })
      ).status,
    ).toBe('BOOKED');
  });
});
