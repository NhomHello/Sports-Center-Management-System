import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({ sendMail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../src/common/mail/mailer.js', () => mail);

const { prisma } = await import('../src/config/db.js');
const { env } = await import('../src/config/env.js');
const { api, apiPath, bearer, loginAs, loginAsAdmin } = await import('./helpers/api.js');
const { PASSWORD, createEmailKit, stamp, uniqueEmail } = await import('./helpers/email-flows.js');

const kit = createEmailKit(mail);
const patchMe = (token, body) => api.patch(apiPath('/members/me')).set(bearer(token)).send(body);
const manualVerify = (id, token) =>
  api.post(apiPath(`/users/${id}/email-verification`)).set(bearer(token));
let tempRole;

beforeAll(async () => {
  tempRole = await prisma.role.create({ data: { code: `TEST_FLOW_${stamp}`, name: 'Role email' } });
});
beforeEach(() => mail.sendMail.mockClear());
afterAll(async () => {
  await kit.cleanup();
  await prisma.role.deleteMany({ where: { id: tempRole.id } });
});

describe('đổi email chỉ có hiệu lực sau khi xác nhận ở email mới', () => {
  it('email cũ giữ nguyên, hiện pendingEmail, xác nhận xong mới đổi', async () => {
    const { id, email } = await kit.registerVerified('change');
    const token = (await kit.login(email)).body.data.accessToken;
    const newEmail = uniqueEmail('changed');
    const res = await patchMe(token, { email: newEmail });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.pendingEmail).toBe(newEmail);
    expect(mail.sendMail.mock.calls.at(-1)[0].to).toBe(newEmail);
    expect((await kit.login(email)).status).toBe(200);

    expect((await kit.verify(await kit.tokenFor(newEmail))).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(user.email).toBe(newEmail);
    expect(user.emailVerifiedAt).not.toBeNull();
    expect((await kit.login(newEmail)).status).toBe(200);
    expect((await kit.login(email)).status).toBe(401);
  });

  it('điền lại email hiện tại sẽ huỷ yêu cầu đổi đang chờ', async () => {
    const { email } = await kit.registerVerified('cancel');
    const token = (await kit.login(email)).body.data.accessToken;
    await patchMe(token, { email: uniqueEmail('cancelnew') });
    expect((await patchMe(token, { email })).body.data.pendingEmail).toBeNull();
  });

  it('email mới bị người khác chiếm trước khi xác nhận => 409, email không đổi', async () => {
    const { id, email } = await kit.registerVerified('race');
    const token = (await kit.login(email)).body.data.accessToken;
    const target = uniqueEmail('racetarget');
    await patchMe(token, { email: target });
    const changeToken = await kit.tokenFor(target);
    const taker = await prisma.user.create({
      data: { email: target, fullName: 'Chiếm email', passwordHash: 'x', roleId: tempRole.id },
    });
    kit.createdIds.push(taker.id);
    expect((await kit.verify(changeToken)).status).toBe(409);
    expect((await prisma.user.findUniqueOrThrow({ where: { id } })).email).toBe(email);
  });
});

describe('xác minh email thủ công và liên hệ hỗ trợ', () => {
  it('quản lý xác minh hộ => đăng nhập được, có audit; hội viên thường không có quyền', async () => {
    const { id, email } = await kit.register('manual');
    const plain = await kit.registerVerified('plainmember');
    const plainToken = (await kit.login(plain.email)).body.data.accessToken;
    expect((await manualVerify(id, plainToken)).status).toBe(403);
    expect((await kit.login(email)).status).toBe(403);
    expect((await manualVerify(id, await loginAsAdmin())).status).toBe(200);
    expect((await kit.login(email)).status).toBe(200);
    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'User', entityId: String(id), action: 'UPDATE' },
      orderBy: { id: 'desc' },
    });
    expect(audit.meta.manualEmailVerification).toBe(true);
  });

  it('lễ tân (được cấp quyền verify_email) xác minh hộ hội viên', async () => {
    const { id, email } = await kit.register('reception');
    const receptionist = await loginAs('letan@scms.local', env.SEED_MOCK_PASSWORD);
    expect((await manualVerify(id, receptionist)).status).toBe(200);
    expect((await kit.login(email)).status).toBe(200);
  });

  it('tài khoản không có email => 422', async () => {
    const user = await prisma.user.create({
      data: {
        phone: `08${String(stamp).slice(-8)}`,
        fullName: 'Không email',
        passwordHash: 'x',
        roleId: tempRole.id,
      },
    });
    kit.createdIds.push(user.id);
    expect((await manualVerify(user.id, await loginAsAdmin())).status).toBe(422);
  });

  it('API liên hệ hỗ trợ công khai, không cần đăng nhập', async () => {
    const res = await api.get(apiPath('/auth/support-contacts'));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('centerName');
    expect(res.body.data).toHaveProperty('zaloUrl');
    expect(res.body.data).toHaveProperty('facebookUrl');
  });

  it('nhân viên tạo tài khoản thì email coi như đã xác minh', async () => {
    const email = uniqueEmail('staffcreated');
    const res = await api
      .post(apiPath('/users'))
      .set(bearer(await loginAsAdmin()))
      .send({ email, password: PASSWORD, fullName: 'Nhân viên mới', roleId: tempRole.id });
    expect(res.status).toBe(201);
    kit.createdIds.push(res.body.data.id);
    expect((await kit.login(email)).status).toBe(200);
  });
});
