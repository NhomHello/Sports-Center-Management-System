import { ERROR_CODES } from '@scms/shared';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../src/common/mail/mailer.js', () => mail);

const { hashPassword } = await import('../src/common/utils/password.js');
const { prisma } = await import('../src/config/db.js');
const { api, apiPath, bearer } = await import('./helpers/api.js');
const { PASSWORD, createEmailKit, stamp, uniqueEmail } = await import('./helpers/email-flows.js');

const kit = createEmailKit(mail);
const NEW_PASSWORD = 'Moi@123456789';

beforeEach(() => mail.sendMail.mockClear());
afterAll(kit.cleanup);

describe('chặn đăng nhập khi chưa xác minh email', () => {
  it('đúng mật khẩu nhưng chưa xác minh => 403 EMAIL_NOT_VERIFIED, không cấp token', async () => {
    const { email } = await kit.register('gate');
    const res = await kit.login(email);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(ERROR_CODES.EMAIL_NOT_VERIFIED);
    expect(res.body.data?.accessToken).toBeUndefined();
    expect(res.body.details).toEqual({ email });
  });

  it('sai mật khẩu vẫn báo sai thông tin, không lộ tình trạng xác minh', async () => {
    const { email } = await kit.register('wrongpw');
    expect((await kit.login(email, 'Sai@12345678')).body.code).toBe(
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  });

  it('xác minh xong đăng nhập được', async () => {
    const { email } = await kit.register('after');
    expect((await kit.verify(await kit.tokenFor(email))).status).toBe(200);
    expect((await kit.login(email)).status).toBe(200);
  });

  it('tài khoản chỉ có số điện thoại (không email) không bị chặn', async () => {
    const phone = `09${String(stamp).slice(-8)}`;
    const role = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
    const user = await prisma.user.create({
      data: {
        phone,
        fullName: 'Chỉ có SĐT',
        roleId: role.id,
        passwordHash: await hashPassword(PASSWORD),
      },
    });
    kit.createdIds.push(user.id);
    expect((await kit.login(phone)).status).toBe(200);
  });
});

describe('quên mật khẩu', () => {
  const requestReset = (email) => api.post(apiPath('/auth/password-resets')).send({ email });
  const confirmReset = (token, password) =>
    api.post(apiPath('/auth/password-resets/confirm')).send({ token, password });

  it('email không tồn tại vẫn 202 và không gửi mail', async () => {
    const res = await requestReset(uniqueEmail('ghost'));
    expect(res.status).toBe(202);
    expect(mail.sendMail).not.toHaveBeenCalled();
  });

  it('đặt lại thành công: mật khẩu cũ hết hiệu lực, phiên cũ bị thu hồi, token dùng một lần', async () => {
    const { email } = await kit.registerVerified('reset');
    const oldSession = (await kit.login(email)).body.data.accessToken;
    await requestReset(email);
    const token = await kit.tokenFor(email);
    expect((await confirmReset(token, NEW_PASSWORD)).status).toBe(200);
    expect((await kit.login(email)).status).toBe(401);
    expect((await kit.login(email, NEW_PASSWORD)).status).toBe(200);
    expect((await api.get(apiPath('/auth/me')).set(bearer(oldSession))).status).toBe(401);
    const again = await confirmReset(token, 'Khac@123456789');
    expect(again.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
  });

  it('người chưa xác minh đặt lại qua email xong thì đăng nhập được ngay', async () => {
    const { email } = await kit.register('resetunverified');
    mail.sendMail.mockClear();
    expect((await requestReset(email)).status).toBe(202);
    const resetToken = await kit.tokenFor(email);
    expect((await confirmReset(resetToken, NEW_PASSWORD)).status).toBe(200);
    expect((await kit.login(email, NEW_PASSWORD)).status).toBe(200);
  });

  it('token xác minh email không dùng được để đặt lại mật khẩu', async () => {
    const { email } = await kit.register('crosspurpose');
    const res = await confirmReset(await kit.tokenFor(email), NEW_PASSWORD);
    expect(res.body.code).toBe(ERROR_CODES.VERIFICATION_TOKEN_INVALID);
  });
});
