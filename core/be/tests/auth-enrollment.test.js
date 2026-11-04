import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../src/common/mail/mailer.js', () => mail);

const { prisma } = await import('../src/config/db.js');
const { createGopyFixture, cleanupGopyFixture, createPaidClass, buyCourseCash } =
  await import('./helpers/gopy.js');
const { api, apiPath } = await import('./helpers/api.js');
let f;
let course;
let member;
let token;

const expectNoBooking = async () => {
  expect(await prisma.classEnrollment.count({ where: { memberId: member.id } })).toBe(0);
  expect(await prisma.classWaitlist.count({ where: { memberId: member.id } })).toBe(0);
  expect(await prisma.invoice.count({ where: { userId: member.id } })).toBe(0);
};

beforeAll(async () => {
  f = await createGopyFixture();
  course = await createPaidClass(f);
  await buyCourseCash(f, course.id, f.member.id);
});
afterAll(async () => cleanupGopyFixture(f));

describe('Tài khoản mới phải tự chọn khóa học', () => {
  it('TC-AUTH-ENROLL-01: đăng ký, xác minh và đăng nhập không tạo booking/hóa đơn', async () => {
    const email = `${f.prefix}_registered@scms.test`;
    const registered = await api.post(apiPath('/auth/register')).send({
      email,
      password: f.password,
      fullName: 'Học viên mới chưa chọn khóa',
    });
    expect(registered.status).toBe(201);
    member = registered.body.data;
    f.userIds.push(member.id);
    await expectNoBooking();
    await vi.waitFor(() => expect(mail.sendMail).toHaveBeenCalled());
    const verification = mail.sendMail.mock.calls.at(-1)[0].text.match(/token=([a-f0-9]{64})/)[1];
    const verified = await api.post(apiPath('/auth/email-verifications/confirm')).send({
      token: verification,
    });
    expect(verified.status).toBe(200);
    const loggedIn = await api.post(apiPath('/auth/login')).send({ email, password: f.password });
    expect(loggedIn.status).toBe(200);
    token = loggedIn.body.data.accessToken;
    await expectNoBooking();
  });

  it('TC-AUTH-ENROLL-02: xem lớp có người khác đăng ký vẫn chưa phải lớp của mình', async () => {
    const listed = await f.call('get', '/classes?scope=open', undefined, token);
    expect(listed.status).toBe(200);
    const card = listed.body.data.find((item) => item.id === course.id);
    expect(card).toMatchObject({ enrolledCount: 1, enrollment: null, canEnroll: true });
    const detail = await f.call('get', `/classes/${course.id}`, undefined, token);
    expect(detail.status).toBe(200);
    expect(detail.body.data.enrollment).toBeNull();
    const profile = await f.call('get', '/members/me', undefined, token);
    expect(profile.body.data.activeCourseCount).toBe(0);
    const monday = new Date(`${course.startsOn}T00:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const schedule = await f.call(
      'get',
      `/schedule/me?weekStart=${monday.toISOString().slice(0, 10)}`,
      undefined,
      token,
    );
    expect(schedule.status).toBe(200);
    expect(schedule.body.data).toEqual([]);
    await expectNoBooking();
  });

  it('TC-AUTH-ENROLL-03: chỉ yêu cầu mua khóa rõ ràng mới tạo giữ chỗ chờ thanh toán', async () => {
    const ordered = await f.call('post', `/classes/${course.id}/orders`, {}, token);
    expect(ordered.status).toBe(201);
    const enrollment = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: course.id, memberId: member.id } },
    });
    expect(enrollment.status).toBe('PENDING_PAYMENT');
    expect(enrollment.enrolledBy).toBe(member.id);
    expect(enrollment.invoiceId).toBe(ordered.body.data.id);
  });
});
