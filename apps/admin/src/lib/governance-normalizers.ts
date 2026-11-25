import type {
  ConversationThread,
  CourseActivityLog,
  GuardianRecord,
  InstructorProfile,
  StaffDailyReport,
  StaffMember,
} from './governance-types';

function extractArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  }
  return [];
}

function str(v: unknown, fb = ''): string {
  return v === null || v === undefined ? fb : String(v);
}

function num(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

export function normalizeStaff(raw: unknown, fallback: StaffMember[]): StaffMember[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((s, idx) => {
    const role = (s.role as Record<string, unknown> | undefined) ?? {};
    const profile = (s.profile as Record<string, unknown> | undefined) ?? {};
    const code = str(role.code || s.roleCode, 'COORDINATOR').toUpperCase();
    return {
      id: str(s.id, `stf-live-${idx}`),
      name: str(profile.fullNameAr || s.name || s.email, 'موظف'),
      email: str(s.email, '—'),
      phone: str(s.phone, '—'),
      department: str(s.department, 'العمليات والإدارة'),
      roleCode: (
        ['SUPER_ADMIN', 'TRAINING_MANAGER', 'FINANCE_MAKER', 'FINANCE_CHECKER', 'COORDINATOR', 'CUSTOMER_SERVICE'].includes(code)
          ? code
          : 'COORDINATOR'
      ) as StaffMember['roleCode'],
      roleLabel: str(role.nameAr || s.roleLabel, code),
      status: str(s.status, 'ACTIVE').toUpperCase() === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      customPermissions: Array.isArray(s.customPermissions)
        ? (s.customPermissions as string[])
        : ['STANDARD_ACCESS'],
      lastActive: str(s.lastLoginAt || s.updatedAt, '').replace('T', ' ').slice(0, 16) || '—',
    };
  });
}

export function normalizeStaffReports(
  raw: unknown,
  fallback: StaffDailyReport[]
): StaffDailyReport[] {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  const reportDate = obj?.reportDate ? str(obj.reportDate).slice(0, 10) : '2026-11-24';
  const arr =
    obj && Array.isArray(obj.staff)
      ? (obj.staff as Record<string, unknown>[])
      : extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((r, idx) => {
    const staff = (r.staff as Record<string, unknown> | undefined) ?? {};
    const profile = (staff.profile as Record<string, unknown> | undefined) ?? {};
    return {
      id: str(r.id || r.staffId, `rep-live-${idx}`),
      staffId: str(r.staffId, ''),
      staffName: str(r.fullName || profile.fullNameAr || staff.email || r.staffName, 'موظف'),
      department: str(r.department, 'خدمة العملاء والعمليات'),
      date: str(r.reportDate || r.date || r.createdAt, reportDate).slice(0, 10) || reportDate,
      callsHandled: num(r.callsHandled, 0),
      ticketsClosed: num(r.ticketsClosed, 0),
      requestsAssigned: num(r.requestsAssigned, 0),
      slaCompliancePercent: num(r.slaCompliancePct ?? r.slaCompliancePercent ?? r.slaRate, 96),
      notes: str(r.notes || r.summary, `إجمالي الإجراءات اليومية: ${num(r.dailyAuditActions, 0)}`),
    };
  });
}

export function normalizeInstructors(
  raw: unknown,
  fallback: InstructorProfile[]
): InstructorProfile[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((ins, idx) => {
    const role = (ins.role as Record<string, unknown> | undefined) ?? {};
    const profile = (ins.profile as Record<string, unknown> | undefined) ?? {};
    const perms = (ins.permissionsJson as Record<string, unknown> | undefined) ??
      (ins.permissions as Record<string, unknown> | undefined) ?? {};
    const roleCode = str(role.code || ins.type, 'TUTOR').toUpperCase();
    const statusRaw = str(ins.status, 'ACTIVE').toUpperCase();
    return {
      id: str(ins.id, `ins-live-${idx}`),
      name: str(profile.fullNameAr || ins.name || ins.email, 'مدرب / معلم'),
      email: str(ins.email, '—'),
      phone: str(ins.phone, '—'),
      type: roleCode === 'TRAINER' ? 'TRAINER' : 'TUTOR',
      status: statusRaw === 'SUSPENDED' ? 'SUSPENDED' : 'APPROVED',
      specialties: Array.isArray(ins.specialties)
        ? (ins.specialties as string[])
        : ['تخصص معتمد'],
      assignedItems: Array.isArray(ins.assignedItems)
        ? (ins.assignedItems as string[])
        : ['برامج ومواد نشطة'],
      compModel: (['HOURLY', 'COMMISSION', 'FIXED'].includes(str(ins.compModel, 'COMMISSION').toUpperCase())
        ? str(ins.compModel, 'COMMISSION').toUpperCase()
        : 'COMMISSION') as InstructorProfile['compModel'],
      compRate: num(ins.compRate ?? ins.hourlyRateSar, 80),
      ratingAvg: num(ins.ratingAvg, 4.8),
      attendanceRate: num(ins.attendanceRate, 97),
      completedSessions: num(ins.completedSessions, 24),
      permissions: {
        canUploadMaterials: Boolean(perms.canUploadMaterials ?? true),
        canGrade: Boolean(perms.canGrade ?? true),
        canIssueDraftCerts: Boolean(perms.canIssueDraftCerts ?? false),
        canAcceptOpenRequests: Boolean(perms.canAcceptOpenRequests ?? (roleCode !== 'TRAINER')),
      },
    };
  });
}

export function normalizeConversations(
  raw: unknown,
  fallback: ConversationThread[]
): ConversationThread[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((c, idx) => {
    const typeRaw = str(c.type || c.channel, 'CHAT').toUpperCase();
    const type: ConversationThread['type'] =
      typeRaw === 'CALL_LOG' || typeRaw === 'COORDINATOR_NOTE' ? typeRaw : 'CHAT';
    const rawMsgs = Array.isArray(c.messages) ? (c.messages as Record<string, unknown>[]) : [];
    const messages = rawMsgs.map((m, mi) => {
      const sender = (m.sender as Record<string, unknown> | undefined) ?? {};
      const sp = (sender.profile as Record<string, unknown> | undefined) ?? {};
      return {
        id: str(m.id, `m-live-${mi}`),
        senderName: str(sp.fullNameAr || sender.email || m.senderName, 'مشارك'),
        senderRole: str(m.senderRole, 'مستخدم'),
        content: str(m.body || m.content, ''),
        timestamp: str(m.createdAt || m.timestamp, '').replace('T', ' ').slice(0, 16) || '—',
      };
    });
    return {
      id: str(c.id, `conv-live-${idx}`),
      type,
      subject: str(c.subject || c.title, 'محادثة مسجلة'),
      participants: Array.isArray(c.participants)
        ? (c.participants as Record<string, unknown>[]).map((p) => ({
            name: str(p.name || p.email, 'مشارك'),
            role: str(p.role, 'مستخدم'),
          }))
        : [{ name: 'أطراف المحادثة', role: 'منصة فهيم' }],
      lastMessageAt: str(c.updatedAt || c.lastMessageAt, '').replace('T', ' ').slice(0, 16) || '—',
      durationSeconds: c.durationSeconds ? num(c.durationSeconds) : undefined,
      archived: Boolean(c.isArchived ?? c.archived ?? false),
      archiveReason: c.archiveReason ? str(c.archiveReason) : undefined,
      messages: messages.length
        ? messages
        : [{ id: 'empty', senderName: 'النظام', senderRole: 'تلقائي', content: 'لا توجد رسائل بعد.', timestamp: '—' }],
    };
  });
}

export function normalizeCourseLogs(
  raw: unknown,
  fallback: CourseActivityLog[]
): CourseActivityLog[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((l, idx) => {
    const ev = str(l.eventType || l.type, 'ENROLLMENT').toUpperCase();
    const eventType: CourseActivityLog['eventType'] =
      ev === 'ATTENDANCE' || ev === 'INTERRUPTION' || ev === 'GRADE_CHANGE' || ev === 'CERTIFICATE'
        ? ev
        : 'ENROLLMENT';
    return {
      id: str(l.id, `clog-live-${idx}`),
      timestamp: str(l.createdAt || l.timestamp, '').replace('T', ' ').slice(0, 16) || '—',
      courseTitle: str(l.courseTitle || l.courseName, 'دورة تدريبية'),
      cohortName: str(l.cohortName, 'الدفعة النشطة'),
      eventType,
      actorName: str(l.actorName, 'النظام'),
      details: str(l.details || l.summary, ''),
    };
  });
}

export function normalizeGuardians(
  raw: unknown,
  fallback: GuardianRecord[]
): GuardianRecord[] {
  const arr = extractArray(raw);
  if (!arr.length) return fallback;
  return arr.map((g, idx) => {
    const profile = (g.profile as Record<string, unknown> | undefined) ?? {};
    const rawLinks = Array.isArray(g.children)
      ? (g.children as Record<string, unknown>[])
      : Array.isArray(g.guardianLinks)
      ? (g.guardianLinks as Record<string, unknown>[])
      : [];
    return {
      id: str(g.id, `grd-live-${idx}`),
      guardianName: str(profile.fullNameAr || g.guardianName || g.email, 'ولي أمر'),
      email: str(g.email, '—'),
      phone: str(g.phone, '—'),
      walletBalanceSar: num(g.walletBalanceSar, 0),
      totalSpentMonthSar: num(g.totalSpentMonthSar, 0),
      children: rawLinks.map((lnk, li) => {
        const student = (lnk.student as Record<string, unknown> | undefined) ?? {};
        const sp = (student.profile as Record<string, unknown> | undefined) ?? {};
        const statusRaw = str(lnk.status, 'APPROVED').toUpperCase();
        return {
          linkId: str(lnk.id || lnk.linkId, `lnk-live-${idx}-${li}`),
          studentName: str(sp.fullNameAr || student.email || lnk.studentName, 'طالب'),
          grade: str(lnk.grade, 'المرحلة الدراسية'),
          relationship: str(lnk.relationship, 'ولي أمر'),
          status:
            statusRaw === 'PENDING' || statusRaw === 'REVOKED'
              ? (statusRaw as 'PENDING' | 'REVOKED')
              : 'APPROVED',
          consentProof: str(lnk.consentProof || lnk.verificationMethod, 'موثق عبر OTP'),
          monthlyBudgetLimitSar: num(lnk.monthlyBudgetLimitSar, 1500),
          requireBookingApproval: Boolean(lnk.requireBookingApproval ?? true),
          allowSessionRecording: Boolean(lnk.allowSessionRecording ?? true),
          notifyBeforeSession: Boolean(lnk.notifyBeforeSession ?? true),
          revokeReason: lnk.revokeReason ? str(lnk.revokeReason) : undefined,
        };
      }),
    };
  });
}
