import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  APPROVED_TUTORS,
  COURSES_CATALOG,
  DEMO_USERS,
  INITIAL_ADMIN_KPIS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CERTIFICATES,
  INITIAL_CHILDREN,
  INITIAL_CONVERSATIONS,
  INITIAL_ENROLLMENTS,
  INITIAL_GUARDIAN_LINKS,
  INITIAL_LEDGER,
  INITIAL_LESSON_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PENDING_REFUNDS,
  INITIAL_PENDING_TUTOR_APPS,
  INITIAL_STAFF_DAILY_REPORT,
  INITIAL_TICKETS,
  INITIAL_TRAINER_COHORTS,
  INITIAL_TRAINER_RECORDS,
  INITIAL_TUTOR_EARNINGS,
  INITIAL_TUTOR_REPORTS,
  INITIAL_TUTOR_SLOTS,
  INITIAL_WALLET,
  TUTOR_INCOMING_REQUESTS,
  TUTORING_PACKAGES,
  UPCOMING_SESSIONS,
} from '@/data/mockData';
import {
  adminApi,
  authApi,
  financeApi,
  lmsApi,
  portalsApi,
  sessionTokens,
  tutoringApi,
} from '@/lib/api';
import {
  AdminKpis,
  AuditLogItem,
  Certificate,
  ChildProfile,
  ConversationThread,
  ConversationType,
  Course,
  CourseEnrollment,
  GuardianLinkReview,
  LessonRequest,
  LessonRequestPath,
  NotificationItem,
  PendingRefundItem,
  PendingTutorApplication,
  StaffDailyReportRow,
  SupportTicket,
  TrainerCohort,
  TrainerTraineeRecord,
  TutorAvailabilitySlot,
  TutorEarningsSummary,
  TutoringPackage,
  TutorProfile,
  TutorSessionReport,
  UpcomingSession,
  User,
  UserRole,
  WalletLedgerEntry,
  WalletSummary,
} from '@/types';

export type MobileHomeRoute =
  | '/(tabs)'
  | '/(tutor)'
  | '/(trainer)'
  | '/(coordinator)'
  | '/(admin)';

export function getHomeRouteForRole(role: UserRole): MobileHomeRoute {
  switch (role) {
    case 'TUTOR':
      return '/(tutor)';
    case 'TRAINER':
      return '/(trainer)';
    case 'COORDINATOR':
      return '/(coordinator)';
    case 'SUPER_ADMIN':
      return '/(admin)';
    case 'STUDENT':
    case 'PARENT':
    case 'TRAINEE':
    default:
      return '/(tabs)';
  }
}

interface CreateLessonPayload {
  subject: string;
  grade: string;
  path: LessonRequestPath;
  tutorId?: string;
  tutorName?: string;
  preferredDate: string;
  preferredTime: string;
  durationMinutes: number;
  priceSar: number;
  notes?: string;
}

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isHydrating: boolean;
  isOfflineDemo: boolean;

  // Parent child switcher
  childrenList: ChildProfile[];
  selectedChildId: string;
  selectedChild: ChildProfile | null;
  selectChild: (childId: string) => void;
  addChild: (payload: { fullName: string; grade: string; school: string }) => Promise<void>;

  // Core data
  upcomingSessions: UpcomingSession[];
  tutors: TutorProfile[];
  packages: TutoringPackage[];
  lessonRequests: LessonRequest[];
  courses: Course[];
  enrollments: CourseEnrollment[];
  wallet: WalletSummary;
  ledger: WalletLedgerEntry[];
  certificates: Certificate[];
  notifications: NotificationItem[];
  tickets: SupportTicket[];

  // Tutor data
  tutorIncomingRequests: LessonRequest[];
  tutorConfirmedSessions: LessonRequest[];
  tutorSlots: TutorAvailabilitySlot[];
  tutorReports: TutorSessionReport[];
  tutorEarnings: TutorEarningsSummary;

  // Admin data & actions
  adminKpis: AdminKpis;
  maintenanceMode: boolean;
  auditLogs: AuditLogItem[];
  pendingTutorApps: PendingTutorApplication[];
  pendingRefunds: PendingRefundItem[];
  staffDailyReport: StaffDailyReportRow[];
  conversations: ConversationThread[];
  guardianLinks: GuardianLinkReview[];
  toggleMaintenanceMode: (enabled: boolean) => Promise<void>;
  reviewTutorApplication: (
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason: string
  ) => Promise<{ ok: boolean; message: string }>;
  reviewRefundRequest: (
    refundId: string,
    decision: 'APPROVED' | 'REJECTED',
    note: string
  ) => Promise<{ ok: boolean; message: string }>;
  updateGuardianLinkStatus: (
    linkId: string,
    status: 'VERIFIED' | 'REVOKED',
    reason?: string
  ) => Promise<void>;

  // Trainer data & actions
  trainerCohorts: TrainerCohort[];
  trainerRecords: TrainerTraineeRecord[];
  markTraineeAttendance: (
    recordId: string,
    attendance: 'PRESENT' | 'LATE' | 'ABSENT'
  ) => Promise<void>;
  gradeTraineeAssignment: (
    recordId: string,
    score: number,
    feedback: string
  ) => Promise<void>;

  // Coordinator actions
  assignTutorToRequest: (
    requestId: string,
    tutorId: string
  ) => Promise<{ ok: boolean; message: string }>;
  updateTicketStatus: (
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  ) => Promise<void>;
  addConversationMessage: (
    conversationId: string,
    content: string,
    type?: ConversationType
  ) => Promise<void>;

  // Auth actions
  requestOtp: (identifier: string) => Promise<{ devOtp?: string; isOfflineFallback: boolean }>;
  verifyOtp: (identifier: string, code: string, role: UserRole) => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;

  // Domain actions
  createLessonRequest: (payload: CreateLessonPayload) => Promise<LessonRequest>;
  enrollInCourse: (course: Course) => Promise<{ ok: boolean; message: string }>;
  topUpWallet: (amountSar: number, label: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  createSupportTicket: (subject: string, category: string) => Promise<void>;

  // Tutor actions
  acceptTutorRequest: (requestId: string) => Promise<{ ok: boolean; message: string }>;
  declineTutorRequest: (requestId: string) => void;
  toggleTutorSlot: (slotId: string) => void;
  addTutorSlot: (dayIndex: number, dayLabel: string, startTime: string, endTime: string) => void;
  saveTutorAvailability: () => Promise<void>;
  submitSessionReport: (payload: {
    sessionId: string;
    studentName: string;
    subject: string;
    attendance: 'PRESENT' | 'LATE' | 'ABSENT';
    rating: number;
    topicsCovered: string;
    homework: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [isHydrating, setIsHydrating] = useState(true);
  const [isOfflineDemo, setIsOfflineDemo] = useState(true);

  const [childrenList, setChildrenList] = useState<ChildProfile[]>(INITIAL_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string>(INITIAL_CHILDREN[0].id);

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>(UPCOMING_SESSIONS);
  const [lessonRequests, setLessonRequests] = useState<LessonRequest[]>(INITIAL_LESSON_REQUESTS);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(INITIAL_ENROLLMENTS);
  const [wallet, setWallet] = useState<WalletSummary>(INITIAL_WALLET);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>(INITIAL_LEDGER);
  const [certificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);

  const [tutorIncomingRequests, setTutorIncomingRequests] =
    useState<LessonRequest[]>(TUTOR_INCOMING_REQUESTS);
  const [tutorConfirmedSessions, setTutorConfirmedSessions] = useState<LessonRequest[]>([
    INITIAL_LESSON_REQUESTS[0],
  ]);
  const [tutorSlots, setTutorSlots] = useState<TutorAvailabilitySlot[]>(INITIAL_TUTOR_SLOTS);
  const [tutorReports, setTutorReports] = useState<TutorSessionReport[]>(INITIAL_TUTOR_REPORTS);
  const [tutorEarnings, setTutorEarnings] = useState<TutorEarningsSummary>(INITIAL_TUTOR_EARNINGS);

  // Admin / Trainer / Coordinator state
  const [adminKpis, setAdminKpis] = useState<AdminKpis>(INITIAL_ADMIN_KPIS);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [pendingTutorApps, setPendingTutorApps] =
    useState<PendingTutorApplication[]>(INITIAL_PENDING_TUTOR_APPS);
  const [pendingRefunds, setPendingRefunds] =
    useState<PendingRefundItem[]>(INITIAL_PENDING_REFUNDS);
  const [staffDailyReport] = useState<StaffDailyReportRow[]>(INITIAL_STAFF_DAILY_REPORT);
  const [conversations, setConversations] =
    useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [guardianLinks, setGuardianLinks] =
    useState<GuardianLinkReview[]>(INITIAL_GUARDIAN_LINKS);

  const [trainerCohorts] = useState<TrainerCohort[]>(INITIAL_TRAINER_COHORTS);
  const [trainerRecords, setTrainerRecords] =
    useState<TrainerTraineeRecord[]>(INITIAL_TRAINER_RECORDS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [token, savedRole] = await Promise.all([
          sessionTokens.getAccessToken(),
          sessionTokens.getSavedRole(),
        ]);
        if (mounted && token) {
          const activeRole: UserRole =
            savedRole && savedRole in DEMO_USERS ? savedRole : 'STUDENT';
          setRole(activeRole);
          setUser(DEMO_USERS[activeRole]);
          try {
            await authApi.me();
            if (mounted) setIsOfflineDemo(false);
          } catch {
            if (mounted) setIsOfflineDemo(true);
          }
        }
      } finally {
        if (mounted) setIsHydrating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedChild = useMemo(
    () => childrenList.find((c) => c.id === selectedChildId) ?? childrenList[0] ?? null,
    [childrenList, selectedChildId]
  );

  const appendAudit = (
    action: string,
    entity: string,
    summary: string,
    severity: AuditLogItem['severity'] = 'INFO'
  ) => {
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actorName: user?.fullName ?? DEMO_USERS[role].fullName,
        actorRole: role,
        action,
        entity,
        summary,
        createdAt: 'الآن',
        severity,
      },
      ...prev,
    ]);
  };

  const requestOtp = async (identifier: string) => {
    try {
      const channel = identifier.includes('@') ? 'EMAIL' : 'SMS';
      const res = await authApi.requestOtp(identifier, channel);
      setIsOfflineDemo(false);
      return { devOtp: res.devOtp ?? res.code ?? '1234', isOfflineFallback: false };
    } catch {
      setIsOfflineDemo(true);
      return { devOtp: '1234', isOfflineFallback: true };
    }
  };

  const verifyOtp = async (identifier: string, code: string, chosenRole: UserRole) => {
    try {
      const res = await authApi.verifyOtp({
        identifier,
        code,
        roleCode: chosenRole,
      });
      await sessionTokens.save(res.accessToken, res.refreshToken, chosenRole);
      const base = DEMO_USERS[chosenRole];
      setRole(chosenRole);
      setUser({
        ...base,
        id: res.user.id || base.id,
        fullName: res.user.fullName || base.fullName,
        email: res.user.email || (identifier.includes('@') ? identifier : base.email),
        phone: res.user.phone || (!identifier.includes('@') ? identifier : base.phone),
        role: chosenRole,
      });
      setIsOfflineDemo(false);
    } catch {
      await sessionTokens.save(`demo-token-${chosenRole.toLowerCase()}`, undefined, chosenRole);
      const base = DEMO_USERS[chosenRole];
      setRole(chosenRole);
      setUser({
        ...base,
        email: identifier.includes('@') ? identifier : base.email,
        phone: !identifier.includes('@') ? identifier : base.phone,
      });
      setIsOfflineDemo(true);
    }
  };

  const quickDemoLogin = async (chosenRole: UserRole) => {
    await sessionTokens.save(`demo-token-${chosenRole.toLowerCase()}`, undefined, chosenRole);
    setRole(chosenRole);
    setUser(DEMO_USERS[chosenRole]);
  };

  const switchRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setUser(DEMO_USERS[nextRole]);
    void sessionTokens.saveRole(nextRole);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    await sessionTokens.clear();
    setUser(null);
  };

  const addChild = async (payload: { fullName: string; grade: string; school: string }) => {
    try {
      await portalsApi.linkChild(payload);
    } catch {
      // Graceful local update
    }
    const initials = payload.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('');
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      fullName: payload.fullName.trim(),
      grade: payload.grade.trim(),
      school: payload.school.trim() || 'مدرسة مسجلة',
      consentVerified: true,
      avatarInitials: initials || 'ط',
      upcomingSessionsCount: 0,
      averageScore: 95,
    };
    setChildrenList((prev) => [...prev, newChild]);
    setSelectedChildId(newChild.id);
  };

  const createLessonRequest = async (payload: CreateLessonPayload) => {
    try {
      await tutoringApi.createRequest({
        subject: payload.subject,
        grade: payload.grade,
        mode: payload.path,
        tutorId: payload.tutorId,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        durationMinutes: payload.durationMinutes,
        notes: payload.notes,
      });
    } catch {
      // Offline/demo fallback
    }

    const activeStudentName =
      role === 'PARENT' && selectedChild ? selectedChild.fullName : user?.fullName ?? 'طالب فهيم';

    const newReq: LessonRequest = {
      id: `req-${Date.now().toString().slice(-4)}`,
      studentName: activeStudentName,
      studentId: role === 'PARENT' ? selectedChild?.id : user?.id,
      subject: payload.subject,
      grade: payload.grade,
      path: payload.path,
      status: payload.path === 'DIRECT' ? 'MATCHED' : 'OPEN',
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
      durationMinutes: payload.durationMinutes,
      priceSar: payload.priceSar,
      tutorId: payload.tutorId,
      tutorName: payload.tutorName,
      notes: payload.notes,
      createdAt: 'الآن',
    };

    setLessonRequests((prev) => [newReq, ...prev]);

    setWallet((prev) => ({
      ...prev,
      availableSar: Math.max(0, prev.availableSar - payload.priceSar),
      heldSar: prev.heldSar + payload.priceSar,
    }));
    setLedger((prev) => [
      {
        id: `led-${Date.now()}`,
        type: 'HOLD',
        amountSar: payload.priceSar,
        description: `حجز مبلغ لطلب درس تقوية - ${payload.subject}`,
        reference: newReq.id.toUpperCase(),
        createdAt: 'الآن',
      },
      ...prev,
    ]);

    return newReq;
  };

  const enrollInCourse = async (course: Course) => {
    const alreadyEnrolled = enrollments.some((e) => e.courseId === course.id);
    if (alreadyEnrolled) {
      return { ok: false, message: 'أنت مسجل بالفعل في هذه الدورة التدريبية.' };
    }
    if (wallet.availableSar < course.priceSar) {
      return {
        ok: false,
        message: 'رصيد المحفظة غير كافٍ. يرجى شحن المحفظة أولاً من تبويب المحفظة.',
      };
    }

    try {
      await lmsApi.enroll(course.id);
    } catch {
      // Offline/demo fallback
    }

    const newEnrollment: CourseEnrollment = {
      id: `enr-${Date.now()}`,
      courseId: course.id,
      courseTitle: course.title,
      mode: course.mode,
      enrolledAt: 'اليوم',
      progressPercent: 0,
      status: 'ACTIVE',
    };
    setEnrollments((prev) => [newEnrollment, ...prev]);
    setWallet((prev) => ({
      ...prev,
      availableSar: prev.availableSar - course.priceSar,
      totalSpentSar: prev.totalSpentSar + course.priceSar,
    }));
    setLedger((prev) => [
      {
        id: `led-${Date.now()}`,
        type: 'DEBIT',
        amountSar: course.priceSar,
        description: `تسجيل في دورة: ${course.title}`,
        reference: `ENR-${Date.now().toString().slice(-4)}`,
        createdAt: 'الآن',
      },
      ...prev,
    ]);
    return { ok: true, message: 'تم تأكيد تسجيلك في الدورة بنجاح!' };
  };

  const topUpWallet = async (amountSar: number, label: string) => {
    try {
      await financeApi.createOrder({ amountSar, description: label });
    } catch {
      // Offline/demo fallback
    }
    setWallet((prev) => ({
      ...prev,
      availableSar: prev.availableSar + amountSar,
    }));
    setLedger((prev) => [
      {
        id: `led-${Date.now()}`,
        type: 'CREDIT',
        amountSar,
        description: label,
        reference: `PAY-${Date.now().toString().slice(-5)}`,
        createdAt: 'الآن',
      },
      ...prev,
    ]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void portalsApi.markNotificationRead(id).catch(() => {});
  };

  const createSupportTicket = async (subject: string, category: string) => {
    try {
      await portalsApi.createTicket({ subject, category });
    } catch {
      // Offline/demo fallback
    }
    const nextTicket: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(4100 + Math.random() * 800)}`,
      subject: subject.trim(),
      category,
      requesterName: user?.fullName ?? 'مستخدم فهيم',
      status: 'OPEN',
      slaLabel: 'الرد المتوقع خلال 4 ساعات',
      updatedAt: 'الآن',
    };
    setTickets((prev) => [nextTicket, ...prev]);
  };

  const acceptTutorRequest = async (requestId: string) => {
    const target = tutorIncomingRequests.find((r) => r.id === requestId);
    if (!target) {
      return { ok: false, message: 'تعذر العثور على الطلب أو تم قبوله مسبقاً.' };
    }

    try {
      await tutoringApi.acceptRequestAtomic(requestId);
    } catch {
      // Offline/demo atomic lock simulation
    }

    const confirmed: LessonRequest = {
      ...target,
      status: 'CONFIRMED',
      tutorId: user?.id ?? 'usr-tutor-1',
      tutorName: user?.fullName ?? DEMO_USERS.TUTOR.fullName,
      classroomUrl: `https://zoom.us/j/faheem-${requestId}`,
    };

    setTutorIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    setTutorConfirmedSessions((prev) => [confirmed, ...prev]);
    setUpcomingSessions((prev) => [
      {
        id: `sess-${requestId}`,
        subject: confirmed.subject,
        topic: confirmed.notes || 'جلسة تقوية فردية',
        tutorName: confirmed.tutorName || DEMO_USERS.TUTOR.fullName,
        studentId: confirmed.studentId || 'child-1',
        studentName: confirmed.studentName,
        startsAtLabel: `${confirmed.preferredDate} • ${confirmed.preferredTime}`,
        countdownLabel: 'مؤكدة وجاهزة',
        durationMinutes: confirmed.durationMinutes,
        platform: 'Zoom',
        classroomUrl: confirmed.classroomUrl!,
        status: 'SCHEDULED',
      },
      ...prev,
    ]);

    return {
      ok: true,
      message: 'تم قبول الطلب وتثبيت الحجز ذرياً (Atomic Lock) وإشعار الطالب.',
    };
  };

  const declineTutorRequest = (requestId: string) => {
    setTutorIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const toggleTutorSlot = (slotId: string) => {
    setTutorSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot))
    );
  };

  const addTutorSlot = (
    dayIndex: number,
    dayLabel: string,
    startTime: string,
    endTime: string
  ) => {
    setTutorSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        dayIndex,
        dayLabel,
        startTime,
        endTime,
        enabled: true,
      },
    ]);
  };

  const saveTutorAvailability = async () => {
    try {
      await tutoringApi.updateAvailability(tutorSlots);
    } catch {
      // Offline/demo fallback
    }
  };

  const submitSessionReport = async (payload: {
    sessionId: string;
    studentName: string;
    subject: string;
    attendance: 'PRESENT' | 'LATE' | 'ABSENT';
    rating: number;
    topicsCovered: string;
    homework: string;
  }) => {
    try {
      await tutoringApi.submitSessionReport(payload.sessionId, {
        attendance: payload.attendance,
        rating: payload.rating,
        topicsCovered: payload.topicsCovered,
        homework: payload.homework,
      });
    } catch {
      // Offline/demo fallback
    }

    const report: TutorSessionReport = {
      id: `rep-${Date.now()}`,
      ...payload,
      submittedAt: 'الآن',
    };
    setTutorReports((prev) => [report, ...prev]);
    setTutorEarnings((prev) => ({
      ...prev,
      pendingSettlementSar: prev.pendingSettlementSar + 120,
      monthlyEarnedSar: prev.monthlyEarnedSar + 120,
      completedSessionsCount: prev.completedSessionsCount + 1,
    }));
  };

  // --- Admin Actions ---
  const toggleMaintenanceMode = async (enabled: boolean) => {
    setMaintenanceMode(enabled);
    try {
      await adminApi.setMaintenanceMode(enabled);
    } catch {
      // Graceful fallback
    }
    appendAudit(
      'MAINTENANCE_TOGGLED',
      'SystemSetting#maintenance_mode',
      enabled ? 'تفعيل وضع الصيانة الشامل للمنصة' : 'إيقاف وضع الصيانة وعودة المنصة للعمل',
      enabled ? 'CRITICAL' : 'INFO'
    );
  };

  const reviewTutorApplication = async (
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason: string
  ) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      return { ok: false, message: 'سبب القرار إلزامي للتوثيق في سجل التدقيق (Audit Log).' };
    }
    const app = pendingTutorApps.find((a) => a.id === applicationId);
    try {
      await adminApi.reviewTutorApplication(applicationId, { status: decision, reason: trimmed });
    } catch {
      // Graceful fallback
    }
    setPendingTutorApps((prev) =>
      prev.map((item) =>
        item.id === applicationId
          ? { ...item, status: decision, decisionReason: trimmed }
          : item
      )
    );
    setAdminKpis((prev) => ({
      ...prev,
      pendingApprovalsCount: Math.max(0, prev.pendingApprovalsCount - 1),
    }));
    appendAudit(
      decision === 'APPROVED' ? 'TUTOR_APPROVED' : 'TUTOR_REJECTED',
      `TutorApplication#${applicationId}`,
      `${decision === 'APPROVED' ? 'اعتماد' : 'رفض'} طلب المعلم ${app?.fullName ?? ''} — السبب: ${trimmed}`,
      decision === 'REJECTED' ? 'WARNING' : 'INFO'
    );
    return {
      ok: true,
      message:
        decision === 'APPROVED'
          ? 'تم اعتماد المعلم وتفعيل صلاحية استقبال الطلبات.'
          : 'تم رفض الطلب وتوثيق السبب في سجل التدقيق.',
    };
  };

  const reviewRefundRequest = async (
    refundId: string,
    decision: 'APPROVED' | 'REJECTED',
    note: string
  ) => {
    const target = pendingRefunds.find((r) => r.id === refundId);
    if (!target) {
      return { ok: false, message: 'طلب الاسترداد غير موجود.' };
    }
    if (user && target.makerId === user.id) {
      return {
        ok: false,
        message: 'مخالفة Maker-Checker: لا يمكن لمنشئ طلب الاسترداد اعتماده بنفسه.',
      };
    }
    if (decision === 'APPROVED' && target.amountSar > target.netCapturedSar) {
      return {
        ok: false,
        message: 'قيمة الاسترداد تتجاوز صافي المبلغ المحصّل.',
      };
    }
    if (!note.trim()) {
      return { ok: false, message: 'يرجى كتابة ملاحظة/سبب قرار الاسترداد.' };
    }

    try {
      if (decision === 'APPROVED') {
        await financeApi.approveRefund(refundId, note.trim());
      } else {
        await financeApi.rejectRefund(refundId, note.trim());
      }
    } catch {
      // Graceful fallback
    }

    setPendingRefunds((prev) =>
      prev.map((r) =>
        r.id === refundId ? { ...r, status: decision, checkerNote: note.trim() } : r
      )
    );
    setAdminKpis((prev) => ({
      ...prev,
      pendingApprovalsCount: Math.max(0, prev.pendingApprovalsCount - 1),
    }));
    appendAudit(
      decision === 'APPROVED' ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
      `Refund#${target.reference}`,
      `${decision === 'APPROVED' ? 'اعتماد' : 'رفض'} استرداد ${target.amountSar} ر.س (${target.studentName}) — ${note.trim()}`,
      decision === 'REJECTED' ? 'WARNING' : 'INFO'
    );
    return {
      ok: true,
      message:
        decision === 'APPROVED'
          ? `تم اعتماد استرداد ${target.amountSar} ر.س وفق ضوابط Maker-Checker.`
          : 'تم رفض طلب الاسترداد وتوثيق الملاحظة.',
    };
  };

  const updateGuardianLinkStatus = async (
    linkId: string,
    status: 'VERIFIED' | 'REVOKED',
    reason?: string
  ) => {
    try {
      await adminApi.updateGuardianLinkStatus(linkId, { status, reason });
    } catch {
      // Graceful fallback
    }
    setGuardianLinks((prev) =>
      prev.map((g) => (g.id === linkId ? { ...g, status, updatedAt: 'الآن' } : g))
    );
    appendAudit(
      status === 'VERIFIED' ? 'GUARDIAN_LINK_VERIFIED' : 'GUARDIAN_LINK_REVOKED',
      `GuardianLink#${linkId}`,
      status === 'VERIFIED'
        ? 'توثيق ربط ولي الأمر بالطالب'
        : `إلغاء ربط ولي الأمر${reason ? ` — ${reason}` : ''}`,
      status === 'REVOKED' ? 'WARNING' : 'INFO'
    );
  };

  // --- Trainer Actions ---
  const markTraineeAttendance = async (
    recordId: string,
    attendance: 'PRESENT' | 'LATE' | 'ABSENT'
  ) => {
    const rec = trainerRecords.find((r) => r.id === recordId);
    setTrainerRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, attendance } : r))
    );
    if (rec) {
      try {
        await lmsApi.markAttendance({
          cohortId: rec.cohortId,
          traineeId: rec.id,
          status: attendance,
        });
      } catch {
        // Graceful fallback
      }
    }
  };

  const gradeTraineeAssignment = async (
    recordId: string,
    score: number,
    feedback: string
  ) => {
    const clamped = Math.max(0, Math.min(100, Math.round(score)));
    setTrainerRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, gradeScore: clamped, feedback: feedback.trim() || r.feedback } : r
      )
    );
    try {
      await lmsApi.gradeAssessment(recordId, { score: clamped, feedback });
    } catch {
      // Graceful fallback
    }
  };

  // --- Coordinator Actions ---
  const assignTutorToRequest = async (requestId: string, tutorId: string) => {
    const tutor = APPROVED_TUTORS.find((t) => t.id === tutorId);
    if (!tutor) {
      return { ok: false, message: 'يرجى اختيار معلم معتمد.' };
    }
    try {
      await tutoringApi.assignRequest(requestId, tutorId);
    } catch {
      // Graceful fallback
    }
    setLessonRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'CONFIRMED',
              tutorId: tutor.id,
              tutorName: tutor.fullName,
              classroomUrl: `https://zoom.us/j/faheem-${requestId}`,
            }
          : r
      )
    );
    appendAudit(
      'COORDINATOR_ASSIGNED_TUTOR',
      `LessonRequest#${requestId}`,
      `إسناد الطلب يدوياً إلى ${tutor.fullName}`
    );
    return { ok: true, message: `تم إسناد الطلب بنجاح إلى ${tutor.fullName}.` };
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  ) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status,
              slaLabel: status === 'RESOLVED' ? 'تم الإغلاق ضمن SLA' : t.slaLabel,
              updatedAt: 'الآن',
            }
          : t
      )
    );
    try {
      await portalsApi.updateTicketStatus(ticketId, status);
    } catch {
      // Graceful fallback
    }
  };

  const addConversationMessage = async (
    conversationId: string,
    content: string,
    type: ConversationType = 'COORDINATOR_NOTE'
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      await portalsApi.addConversationMessage(conversationId, { content: trimmed, type });
    } catch {
      // Graceful fallback
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              updatedAt: 'الآن',
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  senderName: user?.fullName ?? DEMO_USERS[role].fullName,
                  content: trimmed,
                  createdAt: 'الآن',
                },
              ],
            }
          : c
      )
    );
  };

  const value: AuthContextValue = {
    user,
    role,
    isAuthenticated: Boolean(user),
    isHydrating,
    isOfflineDemo,
    childrenList,
    selectedChildId,
    selectedChild,
    selectChild: setSelectedChildId,
    addChild,
    upcomingSessions,
    tutors: APPROVED_TUTORS,
    packages: TUTORING_PACKAGES,
    lessonRequests,
    courses: COURSES_CATALOG,
    enrollments,
    wallet,
    ledger,
    certificates,
    notifications,
    tickets,
    tutorIncomingRequests,
    tutorConfirmedSessions,
    tutorSlots,
    tutorReports,
    tutorEarnings,
    adminKpis,
    maintenanceMode,
    auditLogs,
    pendingTutorApps,
    pendingRefunds,
    staffDailyReport,
    conversations,
    guardianLinks,
    toggleMaintenanceMode,
    reviewTutorApplication,
    reviewRefundRequest,
    updateGuardianLinkStatus,
    trainerCohorts,
    trainerRecords,
    markTraineeAttendance,
    gradeTraineeAssignment,
    assignTutorToRequest,
    updateTicketStatus,
    addConversationMessage,
    requestOtp,
    verifyOtp,
    quickDemoLogin,
    switchRole,
    logout,
    createLessonRequest,
    enrollInCourse,
    topUpWallet,
    markNotificationRead,
    createSupportTicket,
    acceptTutorRequest,
    declineTutorRequest,
    toggleTutorSlot,
    addTutorSlot,
    saveTutorAvailability,
    submitSessionReport,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
