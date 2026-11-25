import {
  CompensationModel,
  ConversationType,
  CourseDeliveryMode,
  CourseLogType,
  CourseStatus,
  GuardianLinkStatus,
  LessonRequestMode,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PolicyType,
  PrismaClient,
  SettingCategory,
  TicketPriority,
  TicketStatus,
  TutorApplicationStatus,
  WalletEntryType,
} from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function encryptSecret(plaintext: string): string {
  const rawKey =
    process.env.SETTINGS_ENCRYPTION_KEY || 'faheem-settings-aes256-gcm-master-key-change-in-prod';
  const key = crypto.createHash('sha256').update(rawKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function main() {
  console.log('Seeding Faheem Training Platform (منصة فهيم للتدريب)...');

  // 1. Permissions
  const permissionDefs = [
    { code: 'settings:read', module: 'admin', description: 'عرض إعدادات النظام' },
    { code: 'settings:write', module: 'admin', description: 'تعديل إعدادات النظام والتكاملات' },
    { code: 'policies:manage', module: 'admin', description: 'إدارة السياسات وإصداراتها' },
    { code: 'cms:manage', module: 'admin', description: 'إدارة صفحات المحتوى' },
    { code: 'rbac:manage', module: 'admin', description: 'إدارة الأدوار والصلاحيات' },
    { code: 'audit:read', module: 'admin', description: 'استعراض سجل التدقيق' },
    { code: 'tutoring:approve', module: 'tutoring', description: 'اعتماد طلبات المعلمين' },
    { code: 'tutoring:assign', module: 'tutoring', description: 'تعيين المعلمين لطلبات الدروس' },
    { code: 'lms:manage', module: 'lms', description: 'إدارة الدورات والشعب والشهادات' },
    { code: 'refunds:create', module: 'finance', description: 'إنشاء طلبات الاسترداد (Maker)' },
    { code: 'refunds:approve', module: 'finance', description: 'اعتماد طلبات الاسترداد (Checker)' },
    { code: 'earnings:settle', module: 'finance', description: 'تسوية مستحقات المعلمين' },
  ];

  const permissionsByCode: Record<string, string> = {};
  for (const p of permissionDefs) {
    const rec = await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { description: p.description },
    });
    permissionsByCode[p.code] = rec.id;
  }

  // 2. Roles
  const roleDefs = [
    { code: 'SUPER_ADMIN', nameAr: 'مدير النظام العام', nameEn: 'Super Admin', isSystem: true, perms: Object.keys(permissionsByCode) },
    { code: 'ADMIN', nameAr: 'مدير المنصة', nameEn: 'Platform Admin', isSystem: true, perms: Object.keys(permissionsByCode) },
    { code: 'FINANCE_MAKER', nameAr: 'محاسب مالي (منشئ)', nameEn: 'Finance Maker', isSystem: true, perms: ['refunds:create'] },
    { code: 'FINANCE_CHECKER', nameAr: 'مدقق مالي (معتمد)', nameEn: 'Finance Checker', isSystem: true, perms: ['refunds:approve', 'earnings:settle', 'audit:read'] },
    { code: 'COORDINATOR', nameAr: 'منسق أكاديمي', nameEn: 'Academic Coordinator', isSystem: true, perms: ['tutoring:assign'] },
    { code: 'SUPPORT_AGENT', nameAr: 'أخصائي خدمة عملاء', nameEn: 'Customer Support Agent', isSystem: true, perms: [] },
    { code: 'TRAINING_MANAGER', nameAr: 'مدير التدريب', nameEn: 'Training Manager', isSystem: true, perms: ['lms:manage', 'tutoring:approve'] },
    { code: 'TUTOR', nameAr: 'معلم تقوية', nameEn: 'Academic Tutor', isSystem: true, perms: [] },
    { code: 'TRAINER', nameAr: 'مدرب مهني', nameEn: 'Professional Trainer', isSystem: true, perms: ['lms:manage'] },
    { code: 'PARENT', nameAr: 'ولي أمر', nameEn: 'Guardian / Parent', isSystem: true, perms: [] },
    { code: 'STUDENT', nameAr: 'طالب / متدرب', nameEn: 'Student / Learner', isSystem: true, perms: [] },
  ];

  const rolesByCode: Record<string, string> = {};
  for (const r of roleDefs) {
    const rec = await prisma.role.upsert({
      where: { code: r.code },
      create: { code: r.code, nameAr: r.nameAr, nameEn: r.nameEn, isSystem: r.isSystem },
      update: { nameAr: r.nameAr, nameEn: r.nameEn },
    });
    rolesByCode[r.code] = rec.id;
    for (const permCode of r.perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rec.id, permissionId: permissionsByCode[permCode] } },
        create: { roleId: rec.id, permissionId: permissionsByCode[permCode] },
        update: {},
      });
    }
  }

  // 3. Grades & Subjects
  const gradesData = [
    { code: 'G6', nameAr: 'السادس الابتدائي', nameEn: 'Grade 6', stage: 'ابتدائي', sortOrder: 1 },
    { code: 'G9', nameAr: 'الثالث المتوسط', nameEn: 'Grade 9', stage: 'متوسط', sortOrder: 2 },
    { code: 'G10', nameAr: 'الأول الثانوي', nameEn: 'Grade 10', stage: 'ثانوي', sortOrder: 3 },
    { code: 'G12', nameAr: 'الثالث الثانوي', nameEn: 'Grade 12', stage: 'ثانوي', sortOrder: 4 },
    { code: 'UNI', nameAr: 'المرحلة الجامعية', nameEn: 'University', stage: 'جامعي', sortOrder: 5 },
  ];
  const gradesByCode: Record<string, string> = {};
  for (const g of gradesData) {
    const rec = await prisma.grade.upsert({ where: { code: g.code }, create: g, update: g });
    gradesByCode[g.code] = rec.id;
  }

  const subjectsData = [
    { code: 'MATH', nameAr: 'الرياضيات', nameEn: 'Mathematics', description: 'الجبر، التفاضل والتكامل، والهندسة' },
    { code: 'PHYS', nameAr: 'الفيزياء', nameEn: 'Physics', description: 'الميكانيكا، الكهرباء والمغناطيسية' },
    { code: 'CHEM', nameAr: 'الكيمياء', nameEn: 'Chemistry', description: 'الكيمياء العامة والعضوية' },
    { code: 'ENG', nameAr: 'اللغة الإنجليزية', nameEn: 'English Language', description: 'المحادثة، القواعد، وتأهيل IELTS' },
    { code: 'QUDURAT', nameAr: 'القدرات والتحصيلي', nameEn: 'Qudurat & Tahsili', description: 'تأهيل شامل لاختبارات قياس' },
  ];
  const subjectsByCode: Record<string, string> = {};
  for (const s of subjectsData) {
    const rec = await prisma.subject.upsert({ where: { code: s.code }, create: s, update: s });
    subjectsByCode[s.code] = rec.id;
  }

  // 4. Demo Users for all roles
  async function upsertUser(data: {
    email: string;
    phone: string;
    roleCode: string;
    fullName: string;
    fullNameEn?: string;
    city?: string;
    bio?: string;
    isTutorApproved?: boolean;
    hourlyRate?: number;
    gradeCode?: string;
  }) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        phone: data.phone,
        roleId: rolesByCode[data.roleCode],
        isTutorApproved: data.isTutorApproved ?? false,
        profile: {
          create: {
            fullName: data.fullName,
            fullNameEn: data.fullNameEn,
            city: data.city ?? 'الرياض',
            bio: data.bio,
            hourlyRate: data.hourlyRate,
            ratingAvg: data.isTutorApproved ? 4.9 : 0,
            ratingCount: data.isTutorApproved ? 38 : 0,
            gradeId: data.gradeCode ? gradesByCode[data.gradeCode] : undefined,
          },
        },
      },
      update: {
        roleId: rolesByCode[data.roleCode],
        isTutorApproved: data.isTutorApproved ?? false,
      },
      include: { profile: true },
    });
    return user;
  }

  const admin = await upsertUser({
    email: 'admin@faheem.sa',
    phone: '+966500000001',
    roleCode: 'SUPER_ADMIN',
    fullName: 'عبدالعزيز المنصور',
    fullNameEn: 'Abdulaziz Al-Mansour',
  });
  await upsertUser({
    email: 'finance.maker@faheem.sa',
    phone: '+966500000002',
    roleCode: 'FINANCE_MAKER',
    fullName: 'سارة القحطاني',
  });
  await upsertUser({
    email: 'finance.checker@faheem.sa',
    phone: '+966500000003',
    roleCode: 'FINANCE_CHECKER',
    fullName: 'خالد الحربي',
  });
  const coordinator = await upsertUser({
    email: 'coordinator@faheem.sa',
    phone: '+966500000004',
    roleCode: 'COORDINATOR',
    fullName: 'نورة الدوسري',
  });
  const supportAgent = await upsertUser({
    email: 'support@faheem.sa',
    phone: '+966500000012',
    roleCode: 'SUPPORT_AGENT',
    fullName: 'ريم الشمري',
  });
  const trainingManager = await upsertUser({
    email: 'training.manager@faheem.sa',
    phone: '+966500000013',
    roleCode: 'TRAINING_MANAGER',
    fullName: 'د. ماجد العمري',
  });
  const tutor1 = await upsertUser({
    email: 'tutor@faheem.sa',
    phone: '+966500000005',
    roleCode: 'TUTOR',
    fullName: 'أ. محمد الشهري',
    fullNameEn: 'Mohammed Al-Shehri',
    bio: 'معلم رياضيات وقدرات بخبرة 10 سنوات في المناهج السعودية وتدريب طلاب الثانوي.',
    isTutorApproved: true,
    hourlyRate: 140,
  });
  const tutor2 = await upsertUser({
    email: 'tutor2@faheem.sa',
    phone: '+966500000006',
    roleCode: 'TUTOR',
    fullName: 'أ. ريم الغامدي',
    fullNameEn: 'Reem Al-Ghamdi',
    bio: 'أستاذة فيزياء وكيمياء ماجستير علوم، متخصصة في التأسيس والتحصيلي.',
    isTutorApproved: true,
    hourlyRate: 150,
  });
  const pendingTutor = await upsertUser({
    email: 'pending.tutor@faheem.sa',
    phone: '+966500000007',
    roleCode: 'TUTOR',
    fullName: 'أ. فهد الزهراني',
    bio: 'معلم لغة إنجليزية حديث الانضمام بانتظار الاعتماد.',
    isTutorApproved: false,
    hourlyRate: 110,
  });
  const trainer = await upsertUser({
    email: 'trainer@faheem.sa',
    phone: '+966500000008',
    roleCode: 'TRAINER',
    fullName: 'م. طارق السبيعي',
    fullNameEn: 'Tariq Al-Subaie',
    bio: 'مدرب معتمد في إدارة المشاريع الاحترافية وتحليل البيانات والذكاء الاصطناعي.',
  });
  const parent = await upsertUser({
    email: 'parent@faheem.sa',
    phone: '+966500000009',
    roleCode: 'PARENT',
    fullName: 'أبو عمر العتيبي',
  });
  const student = await upsertUser({
    email: 'student@faheem.sa',
    phone: '+966500000010',
    roleCode: 'STUDENT',
    fullName: 'عمر العتيبي',
    fullNameEn: 'Omar Al-Otaibi',
    gradeCode: 'G12',
  });
  const student2 = await upsertUser({
    email: 'student2@faheem.sa',
    phone: '+966500000011',
    roleCode: 'STUDENT',
    fullName: 'ليان العتيبي',
    gradeCode: 'G9',
  });

  // 5. Guardian-Student verified link + Consent
  await prisma.guardianStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship: 'أب',
      status: GuardianLinkStatus.VERIFIED,
      verifiedAt: new Date(),
    },
    update: { status: GuardianLinkStatus.VERIFIED },
  });

  // 6. Tutor Subjects, Applications & Availability
  for (const subjectCode of ['MATH', 'QUDURAT']) {
    await prisma.tutorSubject.upsert({
      where: { tutorId_subjectId: { tutorId: tutor1.id, subjectId: subjectsByCode[subjectCode] } },
      create: { tutorId: tutor1.id, subjectId: subjectsByCode[subjectCode] },
      update: {},
    });
  }
  for (const subjectCode of ['PHYS', 'CHEM', 'MATH']) {
    await prisma.tutorSubject.upsert({
      where: { tutorId_subjectId: { tutorId: tutor2.id, subjectId: subjectsByCode[subjectCode] } },
      create: { tutorId: tutor2.id, subjectId: subjectsByCode[subjectCode] },
      update: {},
    });
  }
  await prisma.tutorApplication.upsert({
    where: { userId: pendingTutor.id },
    create: {
      userId: pendingTutor.id,
      status: TutorApplicationStatus.PENDING,
      bio: 'معلم لغة إنجليزية معتمد بشهادة TESOL وخبرة 5 سنوات.',
      yearsExperience: 5,
    },
    update: {},
  });

  // 7. Tutoring Packages
  const packagesData = [
    { code: 'PKG-4', titleAr: 'باقة الانطلاقة (4 حصص)', titleEn: 'Starter Pack (4 Sessions)', sessionsCount: 4, priceSar: 480, subjectId: subjectsByCode['MATH'] },
    { code: 'PKG-8', titleAr: 'باقة التميز (8 حصص)', titleEn: 'Excellence Pack (8 Sessions)', sessionsCount: 8, priceSar: 890, subjectId: subjectsByCode['QUDURAT'] },
    { code: 'PKG-16', titleAr: 'الباقة الفصلية الشاملة (16 حصة)', titleEn: 'Semester Pack (16 Sessions)', sessionsCount: 16, priceSar: 1650, subjectId: null },
  ];
  for (const pkg of packagesData) {
    await prisma.tutoringPackage.upsert({ where: { code: pkg.code }, create: pkg, update: pkg });
  }

  // 8. Courses (IN_PERSON, LIVE_ONLINE, RECORDED) + Cohorts + Certificate
  const course1 = await prisma.course.upsert({
    where: { slug: 'pmp-professional-2026' },
    create: {
      slug: 'pmp-professional-2026',
      titleAr: 'إدارة المشاريع الاحترافية PMP (إصدار 2026)',
      titleEn: 'Project Management Professional (PMP)',
      summaryAr: 'برنامج تأهيلي معتمد لاجتياز اختبار PMP بإشراف خبراء معتمدين.',
      descriptionAr: 'تغطية شاملة لمجالات المعرفة والأجايل والأسئلة التطبيقية مع شهادة معتمدة جاهزة للتكامل مع المركز الوطني للتعليم الإلكتروني NCEL.',
      category: 'الإدارة والقيادة',
      deliveryMode: CourseDeliveryMode.LIVE_ONLINE,
      status: CourseStatus.PUBLISHED,
      priceSar: 1850,
      durationHours: 35,
      ncelAccredited: true,
      ncelProgramCode: 'NCEL-PMP-2026-01',
      trainerId: trainer.id,
    },
    update: {},
  });

  const course2 = await prisma.course.upsert({
    where: { slug: 'data-analytics-powerbi' },
    create: {
      slug: 'data-analytics-powerbi',
      titleAr: 'تحليل البيانات وبناء لوحات الأعمال باستخدام Power BI',
      titleEn: 'Business Data Analytics with Power BI',
      summaryAr: 'تطبيقات عملية لبناء تقارير تفاعلية واتخاذ القرارات المبنية على البيانات.',
      descriptionAr: 'دورة حضورية مكثفة في مقر فهيم بالرياض مع مشاريع واقعية من السوق السعودي.',
      category: 'التقنية والبيانات',
      deliveryMode: CourseDeliveryMode.IN_PERSON,
      status: CourseStatus.PUBLISHED,
      priceSar: 2400,
      durationHours: 24,
      ncelAccredited: true,
      ncelProgramCode: 'NCEL-DA-2026-02',
      trainerId: trainer.id,
    },
    update: {},
  });

  await prisma.course.upsert({
    where: { slug: 'ai-productivity-recorded' },
    create: {
      slug: 'ai-productivity-recorded',
      titleAr: 'الذكاء الاصطناعي التوليدي لرفع الإنتاجية في الأعمال',
      titleEn: 'Generative AI for Workplace Productivity',
      summaryAr: 'دورة مسجلة متاحة في أي وقت لتسريع الأعمال اليومية بأدوات الذكاء الاصطناعي.',
      descriptionAr: 'تعلم هندسة الأوامر والأتمتة وبناء مساعدين أذكياء مع تطبيقات عربية عملية.',
      category: 'الذكاء الاصطناعي',
      deliveryMode: CourseDeliveryMode.RECORDED,
      status: CourseStatus.PUBLISHED,
      priceSar: 490,
      durationHours: 12,
      ncelAccredited: true,
      ncelProgramCode: 'NCEL-AI-2026-03',
      trainerId: trainer.id,
    },
    update: {},
  });

  const cohort1 = await prisma.cohort.upsert({
    where: { code: 'PMP-2026-Q4' },
    create: {
      courseId: course1.id,
      trainerId: trainer.id,
      code: 'PMP-2026-Q4',
      titleAr: 'شعبة نوفمبر المسائية - أونلاين مباشر',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      capacity: 30,
      location: 'Zoom Classroom',
    },
    update: {},
  });

  await prisma.cohort.upsert({
    where: { code: 'PBI-RYD-01' },
    create: {
      courseId: course2.id,
      trainerId: trainer.id,
      code: 'PBI-RYD-01',
      titleAr: 'شعبة الرياض الحضورية - قاعة فهيم 1',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      capacity: 20,
      location: 'الرياض - حي العليا - مركز فهيم للتدريب',
    },
    update: {},
  });

  await prisma.enrollment.upsert({
    where: { cohortId_studentId: { cohortId: cohort1.id, studentId: student.id } },
    create: {
      cohortId: cohort1.id,
      studentId: student.id,
      status: 'ACTIVE',
      paidAmountSar: 1850,
      progressPct: 65,
    },
    update: {},
  });

  await prisma.certificate.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course1.id } },
    create: {
      serialNumber: 'FAHEEM-CERT-20260001',
      verificationCode: 'VER-FAHEEM-2026',
      studentId: student.id,
      courseId: course1.id,
      ncelAccredited: true,
      ncelReference: 'NCEL-PMP-2026-01',
    },
    update: {},
  });

  // 9. Sample Open Tutoring Request + Wallet Credit + Order/Payment
  await prisma.walletLedger.upsert({
    where: { idempotencyKey: 'seed-initial-credit-student' },
    create: {
      userId: student.id,
      entryType: WalletEntryType.CREDIT,
      amountSar: 1200,
      idempotencyKey: 'seed-initial-credit-student',
      referenceType: 'PAYMENT',
      description: 'رصيد ترحيبي وباقة دروس تقوية',
    },
    update: {},
  });

  const seededOrder = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-001' },
    create: {
      orderNumber: 'ORD-SEED-001',
      userId: student.id,
      type: OrderType.TUTORING_PACKAGE,
      status: OrderStatus.PAID,
      subtotalSar: 890,
      vatSar: 133.5,
      totalSar: 1023.5,
    },
    update: {},
  });

  await prisma.payment.upsert({
    where: { providerRef: 'moy_seed_001' },
    create: {
      orderId: seededOrder.id,
      provider: 'MOYASAR',
      providerRef: 'moy_seed_001',
      idempotencyKey: 'seed-pay-001',
      status: PaymentStatus.CAPTURED,
      amountSar: 1023.5,
      capturedAt: new Date(),
    },
    update: {},
  });

  const existingOpenReq = await prisma.lessonRequest.findFirst({
    where: { studentId: student2.id, status: 'OPEN' },
  });
  if (!existingOpenReq) {
    await prisma.lessonRequest.create({
      data: {
        studentId: student2.id,
        createdById: student2.id,
        subjectId: subjectsByCode['MATH'],
        gradeId: gradesByCode['G9'],
        mode: LessonRequestMode.OPEN_AUTO_MATCH,
        scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        priceSar: 130,
        notes: 'مراجعة وحدة المعادلات الخطية قبل الاختبار الشهري',
      },
    });
  }

  // 10. Policies, CMS Pages, Ticket
  await prisma.policyVersion.upsert({
    where: { type_version: { type: PolicyType.CANCELLATION_REFUND, version: 'v1.0' } },
    create: {
      type: PolicyType.CANCELLATION_REFUND,
      version: 'v1.0',
      titleAr: 'سياسة الإلغاء والاسترداد الرسمية',
      contentAr: 'يحق للطالب الإلغاء المجاني قبل 24 ساعة من موعد الجلسة واسترداد كامل المبلغ للمحفظة.',
      rulesJson: { freeCancelHours: 24, lateCancelRefundPct: 50, noShowRefundPct: 0 },
      isActive: true,
      createdById: admin.id,
    },
    update: {},
  });

  await prisma.policyVersion.upsert({
    where: { type_version: { type: PolicyType.TEACHER_COMPENSATION, version: 'v1.0' } },
    create: {
      type: PolicyType.TEACHER_COMPENSATION,
      version: 'v1.0',
      titleAr: 'سياسة مستحقات المعلمين والمدربين',
      contentAr: 'يحصل المعلم على 75% من قيمة الحصة وتُسوّى المستحقات أسبوعياً بعد اعتماد التقرير.',
      rulesJson: { teacherSharePct: 75, platformFeePct: 25, settlementCycleDays: 7 },
      isActive: true,
      createdById: admin.id,
    },
    update: {},
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'about-faheem' },
    create: {
      slug: 'about-faheem',
      titleAr: 'عن منصة فهيم للتدريب',
      titleEn: 'About Faheem Training Platform',
      contentAr: 'منصة فهيم تجمع بين التدريب المهني المعتمد ودروس التقوية الأكاديمية المخصصة بأعلى معايير الجودة والحوكمة في المملكة العربية السعودية.',
      isPublished: true,
    },
    update: {},
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-SEED01' },
    create: {
      ticketNumber: 'TKT-SEED01',
      requesterId: parent.id,
      category: 'TUTORING',
      subject: 'استفسار حول جدول حصص الرياضيات الأسبوعي',
      description: 'أرغب في تنسيق حصتين أسبوعياً لابني عمر قبل اختبار القدرات.',
      priority: TicketPriority.MEDIUM,
      slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    update: {},
  });

  // 11. Categorized SystemSettings (with encrypted secrets!)
  const settingsData = [
    { key: 'payment.moyasar.publishable_key', category: SettingCategory.payment, labelAr: 'مفتاح Moyasar العام', value: 'pk_test_faheem_demo_9981', isSecret: false },
    { key: 'payment.moyasar.secret_key', category: SettingCategory.payment, labelAr: 'مفتاح Moyasar السري', value: encryptSecret('sk_test_faheem_super_secret_key_8821'), isSecret: true },
    { key: 'payment.webhook_secret', category: SettingCategory.payment, labelAr: 'سر توقيع Webhook للمدفوعات', value: encryptSecret('faheem-webhook-hmac-secret-2026'), isSecret: true },
    { key: 'classroom.zoom.account_id', category: SettingCategory.classroom, labelAr: 'معرف حساب Zoom', value: 'zoom_acct_faheem_01', isSecret: false },
    { key: 'classroom.zoom.client_secret', category: SettingCategory.classroom, labelAr: 'سر عميل Zoom OAuth', value: encryptSecret('zoom_secret_key_99384721'), isSecret: true },
    { key: 'sms.unifonic.app_sid', category: SettingCategory.sms, labelAr: 'معرف Unifonic SMS AppSID', value: encryptSecret('unifonic_sid_faheem_7712'), isSecret: true },
    { key: 'email.smtp.host', category: SettingCategory.email, labelAr: 'خادم البريد SMTP', value: 'smtp.faheem.sa', isSecret: false },
    { key: 'email.smtp.password', category: SettingCategory.email, labelAr: 'كلمة مرور SMTP', value: encryptSecret('smtp_secret_pass_5541'), isSecret: true },
    { key: 'storage.r2.bucket', category: SettingCategory.storage, labelAr: 'اسم حاوية التخزين S3/R2', value: 'faheem-media-prod', isSecret: false },
    { key: 'storage.r2.secret_access_key', category: SettingCategory.storage, labelAr: 'مفتاح الوصول السري للتخزين', value: encryptSecret('r2_secret_access_key_3310'), isSecret: true },
    { key: 'ncel.api.endpoint', category: SettingCategory.ncel, labelAr: 'رابط بوابة المركز الوطني NCEL', value: 'https://api.ncel.gov.sa/v1/certificates', isSecret: false },
    { key: 'ncel.api.token', category: SettingCategory.ncel, labelAr: 'رمز التكامل مع NCEL', value: encryptSecret('ncel_bearer_token_2026_xyz'), isSecret: true },
    { key: 'branding.platform_name_ar', category: SettingCategory.branding, labelAr: 'اسم المنصة بالعربية', value: 'منصة فهيم للتدريب', isSecret: false },
    { key: 'general.vat_rate', category: SettingCategory.general, labelAr: 'نسبة ضريبة القيمة المضافة (%)', value: '15', isSecret: false },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }

  // 12. Enterprise Governance Seed Data (Staff departments, Instructor comp/flags, Guardian controls, Conversations, Course Execution Logs)
  await Promise.all([
    prisma.profile.update({
      where: { userId: admin.id },
      data: { department: 'الإدارة العليا', jobTitle: 'مدير النظام العام' },
    }),
    prisma.profile.update({
      where: { userId: coordinator.id },
      data: { department: 'التنسيق الأكاديمي', jobTitle: 'منسقة أكاديمية أولى' },
    }),
    prisma.profile.update({
      where: { userId: supportAgent.id },
      data: { department: 'خدمة العملاء', jobTitle: 'أخصائية دعم فني وتجربة عملاء' },
    }),
    prisma.profile.update({
      where: { userId: trainingManager.id },
      data: { department: 'إدارة التدريب المهني', jobTitle: 'مدير برامج التدريب' },
    }),
    prisma.profile.update({
      where: { userId: tutor1.id },
      data: {
        compensationModel: CompensationModel.COMMISSION,
        compensationRate: 75,
        instructorFlags: {
          canUploadMaterials: true,
          canGrade: true,
          canIssueDraftCerts: false,
          canAcceptOpenRequests: true,
        },
      },
    }),
    prisma.profile.update({
      where: { userId: tutor2.id },
      data: {
        compensationModel: CompensationModel.HOURLY,
        compensationRate: 150,
        instructorFlags: {
          canUploadMaterials: true,
          canGrade: true,
          canIssueDraftCerts: false,
          canAcceptOpenRequests: true,
        },
      },
    }),
    prisma.profile.update({
      where: { userId: trainer.id },
      data: {
        compensationModel: CompensationModel.FIXED,
        compensationRate: 4500,
        instructorFlags: {
          canUploadMaterials: true,
          canGrade: true,
          canIssueDraftCerts: true,
          canAcceptOpenRequests: false,
        },
      },
    }),
  ]);

  // Guardian per-child controls & consent
  await prisma.guardianStudentLink.update({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    data: {
      monthlyBudgetLimitSar: 1500,
      requireBookingApproval: true,
      allowSessionRecording: true,
      notifyBeforeSession: true,
    },
  });

  await prisma.guardianStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student2.id } },
    create: {
      parentId: parent.id,
      studentId: student2.id,
      relationship: 'أب',
      status: GuardianLinkStatus.PENDING,
      monthlyBudgetLimitSar: 800,
      requireBookingApproval: true,
      allowSessionRecording: true,
      notifyBeforeSession: true,
    },
    update: {},
  });

  const existingConsent = await prisma.consentRecord.findFirst({
    where: { userId: parent.id, consentType: 'GUARDIAN_LINK' },
  });
  if (!existingConsent) {
    await prisma.consentRecord.create({
      data: {
        userId: parent.id,
        consentType: 'GUARDIAN_LINK',
        policyVersion: 'v1.0',
        accepted: true,
        metadata: { studentId: student.id, relationship: 'أب' },
      },
    });
  }

  // Resolved ticket assigned to support agent for Daily Staff Report
  await prisma.ticket.upsert({
    where: { ticketNumber: 'TKT-SEED02' },
    create: {
      ticketNumber: 'TKT-SEED02',
      requesterId: student.id,
      assigneeId: supportAgent.id,
      category: 'TECHNICAL',
      subject: 'تفعيل رابط القاعة الافتراضية Zoom',
      description: 'تم التواصل مع المتدرب وتحديث رابط القاعة بنجاح.',
      priority: TicketPriority.HIGH,
      status: TicketStatus.RESOLVED,
      slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      resolvedAt: new Date(),
      resolution: 'تم إرسال الرابط المحدث وتأكيد دخول الطالب.',
    },
    update: {},
  });

  // Conversation Threads (CHAT, CALL_LOG, COORDINATOR_NOTE)
  const existingThreads = await prisma.conversationThread.count();
  if (existingThreads === 0) {
    await prisma.conversationThread.create({
      data: {
        title: 'متابعة خطة القدرات للطالب عمر العتيبي',
        type: ConversationType.CHAT,
        contextType: 'TUTORING',
        createdById: parent.id,
        participants: {
          create: [{ userId: parent.id }, { userId: tutor1.id }, { userId: coordinator.id }],
        },
        messages: {
          create: [
            {
              senderId: parent.id,
              type: ConversationType.CHAT,
              content: 'السلام عليكم أستاذ محمد، نود التركيز هذا الأسبوع على القسم الكمي قبل الاختبار التجريبي.',
            },
            {
              senderId: tutor1.id,
              type: ConversationType.CHAT,
              content: 'وعليكم السلام أبو عمر، أبشر تم تجهيز حقيبة تدريبية مخصصة لأسئلة الهندسة والنسب.',
            },
          ],
        },
      },
    });

    await prisma.conversationThread.create({
      data: {
        title: 'مكالمة خدمة عملاء — تأكيد جدول شعبة PMP',
        type: ConversationType.CALL_LOG,
        contextType: 'COURSE',
        createdById: supportAgent.id,
        participants: {
          create: [{ userId: supportAgent.id }, { userId: student.id }],
        },
        messages: {
          create: [
            {
              senderId: supportAgent.id,
              type: ConversationType.CALL_LOG,
              content: 'مكالمة صادرة (4 دقائق): تأكيد موعد الجلسة الافتتاحية وإرسال دليل المتدرب عبر البريد.',
              durationSeconds: 240,
            },
          ],
        },
      },
    });

    await prisma.conversationThread.create({
      data: {
        title: 'ملاحظة منسق أكاديمي — تقييم جودة الحصة الأولى',
        type: ConversationType.COORDINATOR_NOTE,
        contextType: 'TUTORING',
        createdById: coordinator.id,
        participants: {
          create: [{ userId: coordinator.id }, { userId: admin.id }],
        },
        messages: {
          create: [
            {
              senderId: coordinator.id,
              type: ConversationType.COORDINATOR_NOTE,
              content: 'التزام ممتاز من المعلم أ. محمد الشهري ورفع التقرير خلال 15 دقيقة من نهاية الجلسة.',
            },
          ],
        },
      },
    });
  }

  // Course Execution Logs
  const existingCourseLogs = await prisma.courseExecutionLog.count();
  if (existingCourseLogs === 0) {
    await prisma.courseExecutionLog.createMany({
      data: [
        {
          courseId: course1.id,
          cohortId: cohort1.id,
          actorId: student.id,
          studentId: student.id,
          logType: CourseLogType.ENROLLMENT,
          titleAr: 'تسجيل متدرب جديد في الشعبة',
          details: 'تم تأكيد مقعد عمر العتيبي في شعبة PMP-2026-Q4 بنجاح.',
          metadata: { paidAmountSar: 1850 },
        },
        {
          courseId: course1.id,
          cohortId: cohort1.id,
          actorId: trainer.id,
          studentId: student.id,
          logType: CourseLogType.ATTENDANCE,
          titleAr: 'رصد حضور الجلسة التدريبية الأولى',
          details: 'حضر المتدرب 100% من مدة الجلسة المباشرة عبر Zoom.',
          metadata: { status: 'PRESENT', durationMins: 120 },
        },
        {
          courseId: course1.id,
          cohortId: cohort1.id,
          actorId: trainer.id,
          logType: CourseLogType.SESSION_INTERRUPTION,
          titleAr: 'انقطاع مؤقت في بث القاعة الافتراضية',
          details: 'توقف البث لمدة 4 دقائق بسبب تحديث الشبكة وتم استئناف الجلسة وتعويض الوقت.',
          metadata: { downtimeMinutes: 4, compensated: true },
        },
        {
          courseId: course1.id,
          cohortId: cohort1.id,
          actorId: student.id,
          studentId: student.id,
          logType: CourseLogType.ASSESSMENT_SUBMISSION,
          titleAr: 'اجتياز الاختبار التقييمي النصفي',
          details: 'حصل المتدرب عمر العتيبي على درجة 92/100 (ناجح).',
          metadata: { score: 92, passingScore: 70, passed: true },
        },
        {
          courseId: course1.id,
          cohortId: cohort1.id,
          actorId: admin.id,
          studentId: student.id,
          logType: CourseLogType.CERTIFICATE_ISSUED,
          titleAr: 'إصدار شهادة معتمدة جاهزة لـ NCEL',
          details: 'تم إصدار الشهادة رقم FAHEEM-CERT-20260001 برمز تحقق VER-FAHEEM-2026.',
          metadata: { serialNumber: 'FAHEEM-CERT-20260001', ncelReference: 'NCEL-PMP-2026-01' },
        },
      ],
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
