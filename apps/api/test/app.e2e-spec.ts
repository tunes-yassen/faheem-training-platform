import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CryptoService } from '../src/common/crypto/crypto.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Faheem Platform API Security & Domain Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cryptoService: CryptoService;

  const tokenCache = new Map<string, { accessToken: string; user: any }>();

  const loginAs = async (identifier: string): Promise<{ accessToken: string; user: any }> => {
    const cached = tokenCache.get(identifier);
    if (cached) return cached;

    const reqRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ identifier })
      .expect(201);

    const code = reqRes.body.devOtp;
    expect(code).toBeDefined();

    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ identifier, code })
      .expect(201);

    const session = {
      accessToken: verifyRes.body.accessToken,
      user: verifyRes.body.user,
    };
    tokenCache.set(identifier, session);
    return session;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    cryptoService = app.get(CryptoService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Auth OTP: enforces max attempts & locks out brute-force guesses', async () => {
    const testEmail = `brute_${Date.now()}@faheem.sa`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ identifier: testEmail })
      .expect(201);

    // 4 wrong guesses -> 401
    for (let i = 0; i < 4; i++) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ identifier: testEmail, code: '000000' })
        .expect(401);
    }

    // 5th wrong guess -> 429 Too Many Requests (locked out)
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ identifier: testEmail, code: '000000' })
      .expect(429);
  });

  it('2. RBAC & Secret Masking: Student blocked from Admin Settings; Admin receives masked secrets', async () => {
    const student = await loginAs('student@faheem.sa');
    const admin = await loginAs('admin@faheem.sa');

    // Student cannot access admin settings
    await request(app.getHttpServer())
      .get('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(403);

    // Admin can read settings and secrets MUST be masked
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/settings?category=payment')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const secretSetting = res.body.items.find((s: any) => s.key === 'payment.moyasar.secret_key');
    expect(secretSetting).toBeDefined();
    expect(secretSetting.isSecret).toBe(true);
    expect(secretSetting.value).toMatch(/^\*{4,}/);
    expect(secretSetting.value).not.toContain('sk_test_faheem_super_secret');
  });

  it('3. Unapproved Tutor cannot view or accept lesson requests', async () => {
    const pendingTutor = await loginAs('pending.tutor@faheem.sa');

    await request(app.getHttpServer())
      .get('/api/v1/tutoring/requests')
      .set('Authorization', `Bearer ${pendingTutor.accessToken}`)
      .expect(403);
  });

  it('4. CRITICAL Atomic Tutoring Accept: concurrent accepts only assign 1 tutor & reject the other with 409', async () => {
    const student = await loginAs('student@faheem.sa');
    const tutor1 = await loginAs('tutor@faheem.sa');
    const tutor2 = await loginAs('tutor2@faheem.sa');

    const math = await prisma.subject.findUniqueOrThrow({ where: { code: 'MATH' } });
    const randomDaysOffset = 30 + Math.floor(Math.random() * 5000);
    const start = new Date(Date.now() + randomDaysOffset * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/tutoring/requests')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        subjectId: math.id,
        mode: 'OPEN_AUTO_MATCH',
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        priceSar: 140,
      })
      .expect(201);

    const reqId = createRes.body.id;

    // Fire two concurrent accepts simultaneously
    const [r1, r2] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/tutoring/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${tutor1.accessToken}`),
      request(app.getHttpServer())
        .post(`/api/v1/tutoring/requests/${reqId}/accept`)
        .set('Authorization', `Bearer ${tutor2.accessToken}`),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);

    // Verify IDOR protection on the created session: student2 cannot view student1's session
    const winner = r1.status === 201 ? r1 : r2;
    const sessionId = winner.body.session.id;
    const student2 = await loginAs('student2@faheem.sa');

    await request(app.getHttpServer())
      .get(`/api/v1/tutoring/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${student2.accessToken}`)
      .expect(403);

    // Owner student CAN view it
    await request(app.getHttpServer())
      .get(`/api/v1/tutoring/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
  });

  it('5. Finance Webhook Idempotency + Maker-Checker Refund Enforcement', async () => {
    const student = await loginAs('student@faheem.sa');
    const maker = await loginAs('finance.maker@faheem.sa');
    const checker = await loginAs('finance.checker@faheem.sa');

    const walletBefore = await request(app.getHttpServer())
      .get('/api/v1/finance/wallet')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);

    // Create order & payment
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/finance/orders')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ type: 'WALLET_TOPUP', amountSar: 200 })
      .expect(201);

    const paymentId = orderRes.body.payment.id;
    const totalSar = Number(orderRes.body.payment.amountSar);
    const idempotencyKey = `evt_${Date.now()}`;
    const providerRef = `moy_${Date.now()}`;
    const webhookPayload = {
      idempotencyKey,
      paymentId,
      providerRef,
      status: 'CAPTURED',
      amountSar: totalSar,
    };

    const canonical = `${idempotencyKey}:${paymentId}:${providerRef}:CAPTURED:${totalSar}`;
    const signature = cryptoService.hmacSha256(canonical, 'faheem-webhook-hmac-secret-2026');

    // Invalid signature rejected with 401
    await request(app.getHttpServer())
      .post('/api/v1/finance/webhooks/payment')
      .set('x-faheem-signature', 'bad-signature')
      .send(webhookPayload)
      .expect(401);

    // First valid webhook credits wallet
    const w1 = await request(app.getHttpServer())
      .post('/api/v1/finance/webhooks/payment')
      .set('x-faheem-signature', signature)
      .send(webhookPayload)
      .expect(201);
    expect(w1.body.idempotentReplay).toBe(false);

    // Replay same webhook -> idempotentReplay: true, NO double credit
    const w2 = await request(app.getHttpServer())
      .post('/api/v1/finance/webhooks/payment')
      .set('x-faheem-signature', signature)
      .send(webhookPayload)
      .expect(201);
    expect(w2.body.idempotentReplay).toBe(true);

    const walletAfter = await request(app.getHttpServer())
      .get('/api/v1/finance/wallet')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(Number((walletAfter.body.availableBalanceSar - walletBefore.body.availableBalanceSar).toFixed(2))).toBe(totalSar);

    // Maker-Checker Refund test:
    // Refund exceeding captured amount rejected with 400
    await request(app.getHttpServer())
      .post('/api/v1/finance/refunds')
      .set('Authorization', `Bearer ${maker.accessToken}`)
      .send({ paymentId, amountSar: totalSar + 50, reason: 'اختبار تجاوز الحد' })
      .expect(400);

    // Valid refund created by Maker
    const refundRes = await request(app.getHttpServer())
      .post('/api/v1/finance/refunds')
      .set('Authorization', `Bearer ${maker.accessToken}`)
      .send({ paymentId, amountSar: 50, reason: 'استرداد جزئي' })
      .expect(201);

    const refundId = refundRes.body.id;

    // Admin creates another refund and tries to self-approve -> MUST be 403
    const admin = await loginAs('admin@faheem.sa');
    const adminRefund = await request(app.getHttpServer())
      .post('/api/v1/finance/refunds')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ paymentId, amountSar: 20, reason: 'اختبار المنشئ والمعتمد' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/finance/refunds/${adminRefund.body.id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ approvalNotes: 'self approve attempt' })
      .expect(403);

    // Checker approves Maker's refund -> 201 PROCESSED
    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/finance/refunds/${refundId}/approve`)
      .set('Authorization', `Bearer ${checker.accessToken}`)
      .send({ approvalNotes: 'تم التدقيق والاعتماد' })
      .expect(201);
    expect(approveRes.body.status).toBe('PROCESSED');
  });

  it('6. Public Certificate Verification returns minimal non-sensitive fields only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/verify/VER-FAHEEM-2026')
      .expect(200);

    expect(res.body.valid).toBe(true);
    expect(res.body.serialNumber).toBe('FAHEEM-CERT-20260001');
    expect(res.body.ncelAccredited).toBe(true);
    // Ensure sensitive fields are NOT exposed
    expect(res.body.email).toBeUndefined();
    expect(res.body.phone).toBeUndefined();
    expect(res.body.nationalId).toBeUndefined();
    expect(res.body.studentId).toBeUndefined();
  });

  it('7. Enterprise Governance: Staff CRUD, Daily Report & Instructors Management', async () => {
    const admin = await loginAs('admin@faheem.sa');

    // Create internal staff member
    const uniqueStaffEmail = `cs_${Date.now()}@faheem.sa`;
    const createdStaff = await request(app.getHttpServer())
      .post('/api/v1/admin/staff')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        fullName: 'سلمان العلي',
        email: uniqueStaffEmail,
        roleCode: 'SUPPORT_AGENT',
        department: 'خدمة العملاء',
        jobTitle: 'أخصائي دعم',
      })
      .expect(201);

    expect(createdStaff.body.email).toBe(uniqueStaffEmail);

    // Update staff department & status
    const updatedStaff = await request(app.getHttpServer())
      .patch(`/api/v1/admin/staff/${createdStaff.body.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ department: 'الجودة والتدقيق', customPermissions: ['audit:read'] })
      .expect(200);
    expect(updatedStaff.body.profile.department).toBe('الجودة والتدقيق');

    // Daily Staff Report
    const reportRes = await request(app.getHttpServer())
      .get('/api/v1/admin/staff/daily-report')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(reportRes.body.summary.totalStaff).toBeGreaterThan(0);
    expect(Array.isArray(reportRes.body.staff)).toBe(true);

    // Instructors list & governance update
    const instRes = await request(app.getHttpServer())
      .get('/api/v1/admin/instructors')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(instRes.body.length).toBeGreaterThan(0);

    const targetInst = instRes.body[0];
    const patchInst = await request(app.getHttpServer())
      .patch(`/api/v1/admin/instructors/${targetInst.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        compensationModel: 'HOURLY',
        compensationRate: 165,
        instructorFlags: { canUploadMaterials: true, canGrade: true, canIssueDraftCerts: false },
      })
      .expect(200);
    expect(patchInst.body.profile.compensationModel).toBe('HOURLY');
  });

  it('8. Conversations Oversight, SUPER_ADMIN-only Audited Delete, Course Logs & Guardian Controls', async () => {
    const admin = await loginAs('admin@faheem.sa');
    const parent = await loginAs('parent@faheem.sa');
    const tutor = await loginAs('tutor@faheem.sa');
    const student2 = await loginAs('student2@faheem.sa');

    // Parent creates conversation with tutor
    const threadRes = await request(app.getHttpServer())
      .post('/api/v1/portals/conversations')
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({
        title: 'استفسار حول اختبار الأسبوع القادم',
        type: 'CHAT',
        contextType: 'TUTORING',
        participantIds: [tutor.user.id],
        initialMessage: 'مرحباً أستاذ، هل يوجد ملخص للمراجعة؟',
      })
      .expect(201);

    const msgId = threadRes.body.messages[0].id;

    // Non-SUPER_ADMIN (tutor) CANNOT delete message -> 403
    await request(app.getHttpServer())
      .delete(`/api/v1/admin/conversations/messages/${msgId}`)
      .set('Authorization', `Bearer ${tutor.accessToken}`)
      .expect(403);

    // SUPER_ADMIN can soft-delete message and creates AuditLog
    await request(app.getHttpServer())
      .delete(`/api/v1/admin/conversations/messages/${msgId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const auditCheck = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs?action=CONVERSATION_MESSAGE_DELETED')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(auditCheck.body.items.length).toBeGreaterThan(0);
    expect(auditCheck.body.items[0].beforeData).toBeDefined();
    expect(auditCheck.body.items[0].afterData).toBeDefined();

    // Course execution logs
    const logsRes = await request(app.getHttpServer())
      .get('/api/v1/admin/course-logs?logType=SESSION_INTERRUPTION')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(logsRes.body.length).toBeGreaterThan(0);

    // Guardian Governance & Per-Child Controls
    const guardiansRes = await request(app.getHttpServer())
      .get('/api/v1/admin/guardians')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(guardiansRes.body.length).toBeGreaterThan(0);
    const linkId = guardiansRes.body[0].guardianLinksAsParent[0].id;

    // Student2 cannot modify Parent's controls -> 403
    await request(app.getHttpServer())
      .patch(`/api/v1/portals/guardian/links/${linkId}/controls`)
      .set('Authorization', `Bearer ${student2.accessToken}`)
      .send({ monthlyBudgetLimitSar: 99999 })
      .expect(403);

    // Parent CAN update per-child controls -> 200
    const controlsRes = await request(app.getHttpServer())
      .patch(`/api/v1/portals/guardian/links/${linkId}/controls`)
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({
        monthlyBudgetLimitSar: 1200,
        requireBookingApproval: true,
        allowSessionRecording: false,
        notifyBeforeSession: true,
      })
      .expect(200);
    expect(Number(controlsRes.body.monthlyBudgetLimitSar)).toBe(1200);
    expect(controlsRes.body.allowSessionRecording).toBe(false);
  });
});
