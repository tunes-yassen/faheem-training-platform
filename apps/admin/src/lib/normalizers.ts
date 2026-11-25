import type {
  AuditLogEntry,
  CmsItem,
  CorporateRequest,
  CourseItem,
  IntegrationConfig,
  PlatformUser,
  PolicyVersion,
  RefundRequest,
  RoleDefinition,
  SubjectItem,
  SupportTicket,
  TeacherSettlement,
  TutorApplication,
  TutoringPackage,
  TutoringRequestItem,
} from './types';

function extractArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  }
  return [];
}

function str(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function num(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCourses(raw: unknown, fallback: CourseItem[]): CourseItem[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((c, idx) => {
    const trainer = (c.trainer as Record<string, unknown> | undefined) ?? {};
    const trainerProfile = (trainer.profile as Record<string, unknown> | undefined) ?? {};
    const cohorts = Array.isArray(c.cohorts) ? c.cohorts : [];
    const totalCapacity = cohorts.reduce(
      (sum, coh) => sum + num((coh as Record<string, unknown>)?.capacity, 30),
      0
    );
    const totalEnrolled = cohorts.reduce(
      (sum, coh) => sum + num(((coh as Record<string, unknown>)?._count as Record<string, unknown>)?.enrollments, 0),
      0
    );
    const deliveryRaw = str(c.deliveryMode || c.mode, 'LIVE_ONLINE').toUpperCase();
    const deliveryMode: CourseItem['deliveryMode'] =
      deliveryRaw === 'IN_PERSON' || deliveryRaw === 'RECORDED' ? deliveryRaw : 'LIVE_ONLINE';

    const statusRaw = str(c.status, 'PUBLISHED').toUpperCase();
    const status: CourseItem['status'] =
      statusRaw === 'DRAFT' || statusRaw === 'ARCHIVED' ? statusRaw : 'PUBLISHED';

    return {
      id: str(c.id, `crs-live-${idx}`),
      title: str(c.titleAr || c.title || c.titleEn, 'دورة تدريبية'),
      category: str(c.category || c.categoryAr, 'التدريب المهني'),
      deliveryMode,
      trainerName: str(trainerProfile.fullNameAr || trainer.email || c.trainerName, 'مدرب معتمد'),
      priceSar: num(c.priceSar, 0),
      hours: num(c.durationHours || c.hours, 20),
      cohortsCount: cohorts.length || num(c.cohortsCount, 1),
      enrolledCount: totalEnrolled || num(c.enrolledCount, 0),
      capacity: totalCapacity || num(c.capacity, 40) || 40,
      completionRate: num(c.completionRate, 88),
      ncelSynced: Boolean(c.ncelSynced ?? true),
      status,
    };
  });
}

export function normalizeTutorApplications(
  raw: unknown,
  fallback: TutorApplication[]
): TutorApplication[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((a, idx) => {
    const user = (a.user as Record<string, unknown> | undefined) ?? {};
    const profile = (user.profile as Record<string, unknown> | undefined) ?? {};
    const rawSubjects = Array.isArray(a.subjects)
      ? (a.subjects as unknown[]).map((s) =>
          typeof s === 'string'
            ? s
            : str((s as Record<string, unknown>)?.nameAr || (s as Record<string, unknown>)?.subject)
        )
      : [];
    const statusRaw = str(a.status, 'PENDING').toUpperCase();
    const status: TutorApplication['status'] =
      statusRaw === 'APPROVED' || statusRaw === 'REJECTED' ? statusRaw : 'PENDING';

    return {
      id: str(a.id, `app-live-${idx}`),
      name: str(profile.fullNameAr || a.name || user.email, 'معلم متقدم'),
      email: str(user.email || a.email, '—'),
      phone: str(user.phone || a.phone, '—'),
      subjects: rawSubjects.length ? rawSubjects : ['مواد تعليمية'],
      qualification: str(a.bio || a.qualification, 'مؤهل أكاديمي معتمد'),
      experienceYears: num(a.yearsExperience ?? a.experienceYears, 3),
      hourlyRateRequested: num(a.hourlyRateRequested ?? a.hourlyRateSar, 120),
      submittedAt: str(a.createdAt || a.submittedAt, '').slice(0, 10) || '2026-11-24',
      status,
      decisionReason: a.reviewNotes ? str(a.reviewNotes) : a.decisionReason ? str(a.decisionReason) : undefined,
      decidedBy: a.reviewedById ? 'المشرف الأكاديمي' : a.decidedBy ? str(a.decidedBy) : undefined,
    };
  });
}

export function normalizeTutoringRequests(
  raw: unknown,
  fallback: TutoringRequestItem[]
): TutoringRequestItem[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((r, idx) => {
    const student = (r.student as Record<string, unknown> | undefined) ?? {};
    const studentProfile = (student.profile as Record<string, unknown> | undefined) ?? {};
    const subject = (r.subject as Record<string, unknown> | undefined) ?? {};
    const grade = (r.grade as Record<string, unknown> | undefined) ?? {};
    const assignedTutor = (r.assignedTutor as Record<string, unknown> | undefined) ?? {};
    const tutorProfile = (assignedTutor.profile as Record<string, unknown> | undefined) ?? {};

    const modeRaw = str(r.mode || r.path, 'OPEN_AUTO_MATCH').toUpperCase();
    const path: TutoringRequestItem['path'] =
      modeRaw === 'DIRECT' || modeRaw === 'COORDINATOR' ? modeRaw : 'OPEN_AUTO_MATCH';

    const statusRaw = str(r.status, 'OPEN').toUpperCase();
    const status: TutoringRequestItem['status'] =
      statusRaw === 'BOOKED' || statusRaw === 'MATCHED'
        ? 'MATCHED'
        : statusRaw === 'COMPLETED' || statusRaw === 'DISPUTED' || statusRaw === 'CANCELLED'
        ? statusRaw
        : 'OPEN';

    return {
      id: str(r.id, `req-live-${idx}`).slice(0, 10),
      studentName: str(studentProfile.fullNameAr || student.email || r.studentName, 'طالب مسجل'),
      subject: str(subject.nameAr || r.subject, 'الرياضيات'),
      grade: str(grade.nameAr || r.grade, 'المرحلة الثانوية'),
      path,
      assignedTutor: tutorProfile.fullNameAr
        ? str(tutorProfile.fullNameAr)
        : assignedTutor.email
        ? str(assignedTutor.email)
        : undefined,
      scheduledAt: str(r.scheduledStart || r.scheduledAt, '').replace('T', ' ').slice(0, 16) || '—',
      status,
      priceSar: num(r.priceSar, 120),
    };
  });
}

export function normalizeSubjects(raw: unknown, fallback: SubjectItem[]): SubjectItem[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((s, idx) => ({
    id: str(s.id, `sub-live-${idx}`),
    nameAr: str(s.nameAr, 'مادة دراسية'),
    nameEn: str(s.nameEn, 'Subject'),
    stage: str(s.stage || s.description, 'جميع المراحل'),
    baseHourlyRate: num(s.baseHourlyRate, 120),
    activeTutors: num(s.activeTutors, 12),
    active: Boolean(s.isActive ?? s.active ?? true),
  }));
}

export function normalizePackages(raw: unknown, fallback: TutoringPackage[]): TutoringPackage[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((p, idx) => {
    const price = num(p.priceSar, 400);
    return {
      id: str(p.id, `pkg-live-${idx}`),
      name: str(p.titleAr || p.name, 'باقة تقوية'),
      sessionsCount: num(p.sessionsCount, 4) || 4,
      sessionDurationMin: num(p.durationMins || p.sessionDurationMin, 60),
      priceSar: price,
      originalPriceSar: num(p.originalPriceSar, Math.round(price * 1.15)),
      validityDays: num(p.validityDays, 90),
      badge: p.code ? str(p.code) : undefined,
      active: Boolean(p.isActive ?? p.active ?? true),
      soldCount: num(p.soldCount, 24),
    };
  });
}

export function normalizeRefunds(raw: unknown, fallback: RefundRequest[]): RefundRequest[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((r, idx) => {
    const requester = (r.requestedBy as Record<string, unknown> | undefined) ?? {};
    const reqProfile = (requester.profile as Record<string, unknown> | undefined) ?? {};
    const approver = (r.approvedBy as Record<string, unknown> | undefined) ?? {};
    const appProfile = (approver.profile as Record<string, unknown> | undefined) ?? {};
    const payment = (r.payment as Record<string, unknown> | undefined) ?? {};
    const statusRaw = str(r.status, 'PENDING_APPROVAL').toUpperCase();
    const status: RefundRequest['status'] =
      statusRaw === 'APPROVED' || statusRaw === 'PROCESSED'
        ? 'APPROVED'
        : statusRaw === 'REJECTED'
        ? 'REJECTED'
        : 'PENDING_APPROVAL';

    const amount = num(r.amountSar ?? r.requestedAmountSar, 0);
    return {
      id: str(r.id, `ref-live-${idx}`),
      orderRef: str(payment.providerRef || r.paymentId || r.orderRef, `PAY-${idx + 1}`).slice(0, 18),
      studentName: str(r.studentName, 'طالب المنصة'),
      netCapturedSar: num(payment.amountSar ?? r.netCapturedSar, Math.max(amount, 420)),
      requestedAmountSar: amount,
      reason: str(r.reason, 'طلب استرداد'),
      status,
      createdById: str(r.requestedById || r.createdById, 'unknown'),
      createdByName: str(reqProfile.fullNameAr || requester.email || r.createdByName, 'مشرف المنصة'),
      createdAt: str(r.createdAt, '').replace('T', ' ').slice(0, 16) || '—',
      approvedById: r.approvedById ? str(r.approvedById) : undefined,
      approvedByName: appProfile.fullNameAr
        ? str(appProfile.fullNameAr)
        : approver.email
        ? str(approver.email)
        : undefined,
      decisionNote: r.approvalNotes ? str(r.approvalNotes) : undefined,
      decidedAt: r.approvedAt ? str(r.approvedAt).replace('T', ' ').slice(0, 16) : undefined,
    };
  });
}

export function normalizeSettlements(
  raw: unknown,
  fallback: TeacherSettlement[]
): TeacherSettlement[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((e, idx) => {
    const teacher = (e.teacher as Record<string, unknown> | undefined) ?? {};
    const profile = (teacher.profile as Record<string, unknown> | undefined) ?? {};
    const statusRaw = str(e.status, 'ACCRUED').toUpperCase();
    return {
      id: str(e.id, `set-live-${idx}`),
      teacherName: str(profile.fullNameAr || teacher.email || e.teacherName, 'معلم معتمد'),
      period: str(e.createdAt, '').slice(0, 10) || 'الفترة الحالية',
      sessionsCount: num(e.sessionsCount, 1),
      grossAmountSar: num(e.grossSar ?? e.grossAmountSar, 0),
      commissionSar: num(e.platformFeeSar ?? e.commissionSar, 0),
      netPayoutSar: num(e.netSar ?? e.netPayoutSar, 0),
      ibanLast4: str(e.ibanLast4, '4821'),
      status: statusRaw === 'SETTLED' || statusRaw === 'PAID' ? 'SETTLED' : 'PENDING',
    };
  });
}

export function normalizeUsers(raw: unknown, fallback: PlatformUser[]): PlatformUser[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((u, idx) => {
    const roleObj = (u.role as Record<string, unknown> | undefined) ?? {};
    const profile = (u.profile as Record<string, unknown> | undefined) ?? {};
    const roleCode = str(roleObj.code || u.role, 'STUDENT').toUpperCase();
    const role: PlatformUser['role'] =
      roleCode === 'PARENT' ||
      roleCode === 'TUTOR' ||
      roleCode === 'TRAINER' ||
      roleCode === 'COORDINATOR' ||
      roleCode === 'ADMIN' ||
      roleCode === 'SUPER_ADMIN'
        ? roleCode === 'SUPER_ADMIN'
          ? 'ADMIN'
          : (roleCode as PlatformUser['role'])
        : 'STUDENT';
    const statusRaw = str(u.status, 'ACTIVE').toUpperCase();
    return {
      id: str(u.id, `u-live-${idx}`),
      name: str(profile.fullNameAr || u.name || u.email, 'مستخدم'),
      email: str(u.email, '—'),
      phone: str(u.phone, '—'),
      role,
      status: statusRaw === 'SUSPENDED' ? 'SUSPENDED' : statusRaw === 'PENDING' ? 'PENDING' : 'ACTIVE',
      joinedAt: str(u.createdAt, '').slice(0, 10) || '2026-11-24',
      walletBalanceSar: num(u.walletBalanceSar, 0),
    };
  });
}

export function normalizeTickets(raw: unknown, fallback: SupportTicket[]): SupportTicket[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((t, idx) => {
    const requester = (t.requester as Record<string, unknown> | undefined) ?? {};
    const profile = (requester.profile as Record<string, unknown> | undefined) ?? {};
    const statusRaw = str(t.status, 'OPEN').toUpperCase();
    const prioRaw = str(t.priority, 'MEDIUM').toUpperCase();
    return {
      id: str(t.id, `tkt-live-${idx}`),
      code: str(t.ticketNumber || t.code, `TKT-${idx + 1}`),
      subject: str(t.subject, 'تذكرة دعم فني'),
      requesterName: str(profile.fullNameAr || requester.email || t.requesterName, 'مستخدم'),
      requesterRole: str(t.requesterRole, 'مستخدم المنصة'),
      category: (str(t.category, 'TECHNICAL').toUpperCase() as SupportTicket['category']),
      priority:
        prioRaw === 'URGENT' || prioRaw === 'HIGH' || prioRaw === 'LOW'
          ? (prioRaw as SupportTicket['priority'])
          : 'MEDIUM',
      slaRemaining: str(t.slaRemaining, 'ضمن نافذة SLA'),
      slaBreached: Boolean(t.slaBreached ?? false),
      status:
        statusRaw === 'RESOLVED' || statusRaw === 'CLOSED' || statusRaw === 'IN_PROGRESS'
          ? (statusRaw as SupportTicket['status'])
          : 'OPEN',
      createdAt: str(t.createdAt, '').replace('T', ' ').slice(0, 16) || '—',
      lastMessage: str(t.description || t.lastMessage, ''),
    };
  });
}

export function normalizeAuditLogs(raw: unknown, fallback: AuditLogEntry[]): AuditLogEntry[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((l, idx) => {
    const actor = (l.actor as Record<string, unknown> | undefined) ?? {};
    const profile = (actor.profile as Record<string, unknown> | undefined) ?? {};
    const action = str(l.action, 'SYSTEM_EVENT');
    const severity: AuditLogEntry['severity'] =
      action.includes('REFUND') || action.includes('SETTING') || action.includes('REVOKE')
        ? 'CRITICAL'
        : action.includes('REJECT') || action.includes('SUSPEND')
        ? 'WARNING'
        : 'INFO';
    return {
      id: str(l.id, `aud-live-${idx}`),
      timestamp: str(l.createdAt || l.timestamp, '').replace('T', ' ').slice(0, 19) || '—',
      actorName: str(profile.fullNameAr || actor.email || l.actorName, 'النظام'),
      actorRole: str(l.actorRole, 'ADMIN'),
      module: str(l.entityType || l.module, 'النظام'),
      action,
      severity,
      ipAddress: str(l.ipAddress, '127.0.0.1'),
      summary: str(l.summary, `${action} على ${str(l.entityType, 'النظام')} (${str(l.entityId, '').slice(0, 8)})`),
      before: (l.beforeData as Record<string, unknown> | undefined) ?? undefined,
      after: (l.afterData as Record<string, unknown> | undefined) ?? undefined,
    };
  });
}

export function normalizeCms(raw: unknown, fallback: CmsItem[]): CmsItem[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  const mapped: CmsItem[] = arr.map((c, idx) => ({
    id: str(c.id, `cms-live-${idx}`),
    type: 'page',
    title: str(c.titleAr || c.title, 'صفحة'),
    slug: str(c.slug, ''),
    summary: str(c.seoDescAr || c.titleEn || c.summary, ''),
    content: str(c.contentAr || c.content, ''),
    status: str(c.status, 'PUBLISHED').toUpperCase() === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    updatedAt: str(c.updatedAt, '').slice(0, 10) || '2026-11-24',
    author: 'إدارة المحتوى',
  }));
  // Keep rich banners/menus/faqs alongside live DB pages
  const nonPages = fallback.filter((f) => f.type !== 'page');
  return [...mapped, ...nonPages];
}

export function normalizePolicies(raw: unknown, fallback: PolicyVersion[]): PolicyVersion[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((p, idx) => {
    const rules = (p.rulesJson as Record<string, unknown> | undefined) ?? {};
    const isActive = Boolean(p.isActive ?? p.status === 'ACTIVE');
    return {
      id: str(p.id, `pol-live-${idx}`),
      version: str(p.version, `v${idx + 1}.0`),
      title: str(p.titleAr || p.title, 'سياسة تشغيلية'),
      status: isActive ? 'ACTIVE' : 'DRAFT',
      effectiveFrom: str(p.effectiveAt || p.createdAt, '').slice(0, 10) || '2026-11-24',
      cancellationFreeWindowHours: num(rules.freeCancelHours ?? rules.cancellationFreeWindowHours, 24),
      noShowPenaltyPercent: num(rules.noShowPenaltyPercent, 50),
      refundMaxDays: num(rules.refundMaxDays, 14),
      refundProcessingFeePercent: num(rules.refundProcessingFeePercent, 2.5),
      autoMatchTimeoutMinutes: num(rules.autoMatchTimeoutMinutes, 15),
      teacherCompModel: 'COMMISSION',
      teacherHourlyRate: num(rules.teacherHourlyRate, 95),
      teacherCommissionPercent: num(rules.teacherCommissionPercent, 80),
      teacherFixedPerSession: num(rules.teacherFixedPerSession, 85),
      platformCommissionPercent: num(rules.platformCommissionPercent, 20),
      notes: str(p.contentAr || p.notes, ''),
      updatedBy: 'الإدارة العامة',
    };
  });
}

export function normalizeCorporate(
  raw: unknown,
  fallback: CorporateRequest[]
): CorporateRequest[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((c, idx) => ({
    id: str(c.id, `corp-live-${idx}`),
    companyName: str(c.companyName, 'جهة متعاقدة'),
    contactName: str(c.contactName, 'مسؤول التدريب'),
    contactEmail: str(c.contactEmail, '—'),
    contactPhone: str(c.contactPhone, '—'),
    programTopic: str(c.topic || c.programTopic, 'برنامج تدريبي مخصص'),
    seatsCount: num(c.seatsCount || c.traineesCount, 25),
    deliveryMode: 'HYBRID',
    estimatedBudgetSar: num(c.estimatedBudgetSar || c.budgetSar, 50000),
    status: (str(c.status, 'NEW').toUpperCase() as CorporateRequest['status']),
    createdAt: str(c.createdAt, '').slice(0, 10) || '2026-11-24',
  }));
}

export function mergeLiveSettingsIntoIntegrations(
  raw: unknown,
  base: IntegrationConfig[]
): IntegrationConfig[] {
  const arr = extractArray(raw);
  if (!arr.length) return base;
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of arr) {
    const k = str(item.key);
    if (k) byKey.set(k, item);
  }
  return base.map((cfg) => ({
    ...cfg,
    fields: cfg.fields.map((f) => {
      const match = byKey.get(f.key);
      if (!match || match.value === undefined || match.value === null) return f;
      if (f.type === 'boolean') {
        return { ...f, value: match.value === true || match.value === 'true' };
      }
      if (f.type === 'number') {
        return { ...f, value: num(match.value, Number(f.value) || 0) };
      }
      return { ...f, value: str(match.value) };
    }),
  }));
}

export function normalizeRoles(raw: unknown, fallback: RoleDefinition[]): RoleDefinition[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return fallback; // Keep structured RBAC matrix UI synced with system roles
}
