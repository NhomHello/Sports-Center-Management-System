import { ERROR_CODES, SETTING_KEYS } from '@scms/shared';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../src/common/mail/mailer.js', () => mail);

const { prisma } = await import('../src/config/db.js');
const { api, apiPath } = await import('./helpers/api.js');

const PASSWORD = 'Verify@12345';
const createdIds = [];
const uniqueEmail = (label) => `test_verify_${label}_${Date.now()}@scms.test`;

/** Đợi mail nền (register không await) rồi lấy token từ link trong nội dung mail. */
const lastToken = async () => {
  await vi.waitFor(() => expect(mail.sendMail).toHaveBeenCalled());
  const { text } = mail.sendMail.mock.calls.at(-1)[0];
  return text.match(/token=([a-f0-9]{64})/)[1];
};

const register = async (label) => {
  const email = uniqueEmail(label);
  const res = await api
    .post(apiPath('/auth/register'))
    .send({ email, password: PASSWORD, fullName: 'Người Xác Minh' });
  expect(res.status).toBe(201);
  createdIds.push(res.body.data.id);
  return { id: res.body.data.id, email };
};

beforeEach(() => mail.sendMail.mockClear());
afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
});

describe('Xác minh email', () => {
  it('đăng ký gửi một mail chứa link, tài khoản chưa xác minh', async () => {
    const { id, email } = await register('send');
    const token = await lastToken();
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    expect(mail.sendMail.mock.calls[0][0].to).toBe(email);
    const user = await prisma.user.findUnique({ where: { id } });
    expect(user.emailVerifiedAt).toBeNull();
    // chỉ lưu hash, không lưu token thô
    expect(
      await prisma.emailVerificationToken.count({ where: { userId: id, tokenHash: token } }),
    ).toBe(0);
  });

  it('xác minh đúng token => verified, dùng lại token => 400', async () => {
    const { id } = await register('confirm');
    const token = await lastToken();
    const ok = await api.post(apiPath('/auth/email-verifications/confirm')).send({ token });
    expect(ok.status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id } })).emailVerifiedAt).not.toBeNull();

    const reused = await api.post(apiPath('/auth/email-verifications/confirm')).send({ token });
    expect(reused.status).toBe(400);
    expect(reused.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
  });

  it('token sai định dạng => 400; token hợp lệ về dạng nhưng không tồn tại => 400', async () => {
    const bad = await api.post(apiPath('/auth/email-verifications/confirm')).send({ token: 'abc' });
    expect(bad.status).toBe(400);
    const unknown = await api
      .post(apiPath('/auth/email-verifications/confirm'))
      .send({ token: 'a'.repeat(64) });
    expect(unknown.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
  });

  it('token hết hạn => 400 và tài khoản vẫn chưa xác minh', async () => {
    const { id } = await register('expired');
    const token = await lastToken();
    await prisma.emailVerificationToken.updateMany({
      where: { userId: id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await api.post(apiPath('/auth/email-verifications/confirm')).send({ token });
    expect(res.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
    expect((await prisma.user.findUnique({ where: { id } })).emailVerifiedAt).toBeNull();
  });

  it('gửi lại: email không tồn tại vẫn 202 và không gửi mail', async () => {
    const res = await api
      .post(apiPath('/auth/email-verifications'))
      .send({ email: uniqueEmail('ghost') });
    expect(res.status).toBe(202);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it('gửi lại trong thời gian chờ không gửi mail thứ hai; hết chờ thì token cũ bị thu hồi', async () => {
    const { id, email } = await register('resend');
    const oldToken = await lastToken();
    mail.sendMail.mockClear();
    await api.post(apiPath('/auth/email-verifications')).send({ email });
    expect(mail.sendMail).not.toHaveBeenCalled();

    await prisma.emailVerificationToken.updateMany({
      where: { userId: id },
      data: { createdAt: new Date(Date.now() - 3_600_000) },
    });
    await api.post(apiPath('/auth/email-verifications')).send({ email });
    expect(mail.sendMail).toHaveBeenCalledTimes(1);
    const old = await api
      .post(apiPath('/auth/email-verifications/confirm'))
      .send({ token: oldToken });
    expect(old.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
  });

  it('có định nghĩa setting cho hạn link và thời gian chờ', () => {
    expect(SETTING_KEYS.EMAIL_VERIFICATION_TTL_MINUTES).toBeDefined();
    expect(SETTING_KEYS.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS).toBeDefined();
  });
});
