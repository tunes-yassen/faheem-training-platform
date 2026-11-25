'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  AdminUser,
  AuditLogEntry,
  CertificateRecord,
  CmsItem,
  CorporateRequest,
  CourseItem,
  DisputeItem,
  IntegrationConfig,
  PlatformUser,
  PolicyVersion,
  PricingRule,
  RefundRequest,
  RoleDefinition,
  SubjectItem,
  SupportTicket,
  TeacherSettlement,
  TutorApplication,
  TutoringPackage,
  TutoringRequestItem,
  WalletLedgerEntry,
} from '@/lib/types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CERTIFICATES,
  INITIAL_CMS_ITEMS,
  INITIAL_CORPORATE,
  INITIAL_COURSES,
  INITIAL_DISPUTES,
  INITIAL_INTEGRATIONS,
  INITIAL_LEDGER,
  INITIAL_PACKAGES,
  INITIAL_POLICIES,
  INITIAL_PRICING_RULES,
  INITIAL_REFUNDS,
  INITIAL_ROLES,
  INITIAL_SETTLEMENTS,
  INITIAL_SUBJECTS,
  INITIAL_TICKETS,
  INITIAL_TUTOR_APPLICATIONS,
  INITIAL_TUTORING_REQUESTS,
  INITIAL_USERS,
} from '@/lib/demo-data';
import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  requestAdminOtp,
  setStoredToken,
  verifyAdminOtp,
} from '@/lib/api';
import {
  mergeLiveSettingsIntoIntegrations,
  normalizeAuditLogs,
  normalizeCms,
  normalizeCorporate,
  normalizeCourses,
  normalizePackages,
  normalizePolicies,
  normalizeRefunds,
  normalizeSettlements,
  normalizeSubjects,
  normalizeTickets,
  normalizeTutorApplications,
  normalizeTutoringRequests,
  normalizeUsers,
} from '@/lib/normalizers';
import type {
  ConversationThread,
  CourseActivityLog,
  GuardianRecord,
  InstructorProfile,
  StaffDailyReport,
  StaffMember,
} from '@/lib/governance-types';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_COURSE_LOGS,
  INITIAL_GUARDIANS,
  INITIAL_INSTRUCTORS,
  INITIAL_STAFF,
  INITIAL_STAFF_REPORTS,
} from '@/lib/governance-data';
import {
  normalizeConversations,
  normalizeCourseLogs,
  normalizeGuardians,
  normalizeInstructors,
  normalizeStaff,
  normalizeStaffReports,
} from '@/lib/governance-normalizers';

export const LIVE_ADMIN_ACCOUNTS: AdminUser[] = [
  {
    id: 'adm-1',
    name: 'أحمد المنصور',
    email: 'admin@faheem.sa',
    role: 'المدير العام (Super Admin)',
    roleId: 'role-super-admin',
    avatarInitials: 'أم',
  },
  {
    id: 'adm-2',
    name: 'سارة العتيبي',
    email: 'finance.checker@faheem.sa',
    role: 'المدير المالي (Finance Checker)',
    roleId: 'role-finance',
    avatarInitials: 'سع',
  },
  {
    id: 'adm-4',
    name: 'نورة السبيعي',
    email: 'finance.maker@faheem.sa',
    role: 'أخصائي مالي (Finance Maker)',
    roleId: 'role-finance',
    avatarInitials: 'نس',
  },
  {
    id: 'adm-3',
    name: 'خالد الشهري',
    email: 'coordinator@faheem.sa',
    role: 'مدير العمليات الأكاديمية',
    roleId: 'role-academic',
    avatarInitials: 'خش',
  },
];

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}

export interface LiveKpis {
  totalUsers?: number;
  approvedTutors?: number;
  pendingTutorApps?: number;
  publishedCourses?: number;
  activeEnrollments?: number;
  totalBookings?: number;
  openRequests?: number;
  openTickets?: number;
  pendingRefunds?: number;
  grossRevenueSar?: number;
  certificatesIssued?: number;
  newCorporateQuotes?: number;
}

interface AdminContextValue {
  currentAdmin: AdminUser;
  switchAdmin: (adminId: string) => Promise<void>;
  adminUsers: AdminUser[];
  apiOnline: boolean;
  isAuthenticated: boolean;
  isHydrating: boolean;
  liveKpis: LiveKpis | null;
  loginWithEmailOtp: (email: string, code: string) => Promise<boolean>;
  quickLiveLogin: (email: string) => Promise<boolean>;
  logoutAdmin: () => void;
  refreshFromApi: () => Promise<void>;
  toasts: ToastItem[];
  notify: (title: string, variant?: ToastItem['variant'], description?: string) => void;
  dismissToast: (id: string) => void;

  // Store state
  integrations: IntegrationConfig[];
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationConfig[]>>;
  cmsItems: CmsItem[];
  setCmsItems: React.Dispatch<React.SetStateAction<CmsItem[]>>;
  policies: PolicyVersion[];
  setPolicies: React.Dispatch<React.SetStateAction<PolicyVersion[]>>;
  subjects: SubjectItem[];
  setSubjects: React.Dispatch<React.SetStateAction<SubjectItem[]>>;
  packages: TutoringPackage[];
  setPackages: React.Dispatch<React.SetStateAction<TutoringPackage[]>>;
  pricingRules: PricingRule[];
  setPricingRules: React.Dispatch<React.SetStateAction<PricingRule[]>>;
  roles: RoleDefinition[];
  setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>;
  courses: CourseItem[];
  setCourses: React.Dispatch<React.SetStateAction<CourseItem[]>>;
  certificates: CertificateRecord[];
  setCertificates: React.Dispatch<React.SetStateAction<CertificateRecord[]>>;
  tutorApplications: TutorApplication[];
  setTutorApplications: React.Dispatch<React.SetStateAction<TutorApplication[]>>;
  tutoringRequests: TutoringRequestItem[];
  setTutoringRequests: React.Dispatch<React.SetStateAction<TutoringRequestItem[]>>;
  disputes: DisputeItem[];
  setDisputes: React.Dispatch<React.SetStateAction<DisputeItem[]>>;
  ledger: WalletLedgerEntry[];
  setLedger: React.Dispatch<React.SetStateAction<WalletLedgerEntry[]>>;
  refunds: RefundRequest[];
  setRefunds: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  settlements: TeacherSettlement[];
  setSettlements: React.Dispatch<React.SetStateAction<TeacherSettlement[]>>;
  users: PlatformUser[];
  setUsers: React.Dispatch<React.SetStateAction<PlatformUser[]>>;
  corporateRequests: CorporateRequest[];
  setCorporateRequests: React.Dispatch<React.SetStateAction<CorporateRequest[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  auditLogs: AuditLogEntry[];
  appendAuditLog: (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorName' | 'actorRole' | 'ipAddress'>
  ) => void;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  staffReports: StaffDailyReport[];
  setStaffReports: React.Dispatch<React.SetStateAction<StaffDailyReport[]>>;
  instructors: InstructorProfile[];
  setInstructors: React.Dispatch<React.SetStateAction<InstructorProfile[]>>;
  conversations: ConversationThread[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationThread[]>>;
  courseLogs: CourseActivityLog[];
  setCourseLogs: React.Dispatch<React.SetStateAction<CourseActivityLog[]>>;
  guardians: GuardianRecord[];
  setGuardians: React.Dispatch<React.SetStateAction<GuardianRecord[]>>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(LIVE_ADMIN_ACCOUNTS[0]);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isHydrating, setIsHydrating] = useState<boolean>(false);
  const [liveKpis, setLiveKpis] = useState<LiveKpis | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(INITIAL_INTEGRATIONS);
  const [cmsItems, setCmsItems] = useState<CmsItem[]>(INITIAL_CMS_ITEMS);
  const [policies, setPolicies] = useState<PolicyVersion[]>(INITIAL_POLICIES);
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [packages, setPackages] = useState<TutoringPackage[]>(INITIAL_PACKAGES);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(INITIAL_PRICING_RULES);
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [courses, setCourses] = useState<CourseItem[]>(INITIAL_COURSES);
  const [certificates, setCertificates] = useState<CertificateRecord[]>(INITIAL_CERTIFICATES);
  const [tutorApplications, setTutorApplications] = useState<TutorApplication[]>(
    INITIAL_TUTOR_APPLICATIONS
  );
  const [tutoringRequests, setTutoringRequests] = useState<TutoringRequestItem[]>(
    INITIAL_TUTORING_REQUESTS
  );
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>(INITIAL_LEDGER);
  const [refunds, setRefunds] = useState<RefundRequest[]>(INITIAL_REFUNDS);
  const [settlements, setSettlements] = useState<TeacherSettlement[]>(INITIAL_SETTLEMENTS);
  const [users, setUsers] = useState<PlatformUser[]>(INITIAL_USERS);
  const [corporateRequests, setCorporateRequests] = useState<CorporateRequest[]>(INITIAL_CORPORATE);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [staffReports, setStaffReports] = useState<StaffDailyReport[]>(INITIAL_STAFF_REPORTS);
  const [instructors, setInstructors] = useState<InstructorProfile[]>(INITIAL_INSTRUCTORS);
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [courseLogs, setCourseLogs] = useState<CourseActivityLog[]>(INITIAL_COURSE_LOGS);
  const [guardians, setGuardians] = useState<GuardianRecord[]>(INITIAL_GUARDIANS);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, variant: ToastItem['variant'] = 'success', description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, variant, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const refreshFromApi = useCallback(async (tokenOverride?: string) => {
    setIsHydrating(true);
    try {
      // Public endpoints (work even before JWT)
      const [coursesRes, subjectsRes, packagesRes] = await Promise.all([
        apiRequest('/lms/courses', { tokenOverride }),
        apiRequest('/tutoring/subjects', { tokenOverride }),
        apiRequest('/tutoring/packages', { tokenOverride }),
      ]);

      if (coursesRes.ok || subjectsRes.ok || packagesRes.ok) {
        setApiOnline(true);
      }
      if (coursesRes.ok && coursesRes.data) {
        setCourses(normalizeCourses(coursesRes.data, INITIAL_COURSES));
      }
      if (subjectsRes.ok && subjectsRes.data) {
        setSubjects(normalizeSubjects(subjectsRes.data, INITIAL_SUBJECTS));
      }
      if (packagesRes.ok && packagesRes.data) {
        setPackages(normalizePackages(packagesRes.data, INITIAL_PACKAGES));
      }

      const token = tokenOverride ?? getStoredToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Authenticated admin endpoints
      const [
        meRes,
        overviewRes,
        settingsRes,
        policiesRes,
        cmsRes,
        appsRes,
        reqsRes,
        refundsRes,
        earningsRes,
        usersRes,
        corpRes,
        ticketsRes,
        auditRes,
      ] = await Promise.all([
        apiRequest<{
          id: string;
          email?: string;
          role?: { code?: string; nameAr?: string };
          profile?: { fullNameAr?: string };
        }>('/auth/me', { tokenOverride: token }),
        apiRequest<{ kpis?: LiveKpis }>('/portals/analytics/overview', { tokenOverride: token }),
        apiRequest('/admin/settings', { tokenOverride: token }),
        apiRequest('/admin/policies', { tokenOverride: token }),
        apiRequest('/admin/cms', { tokenOverride: token }),
        apiRequest('/tutoring/applications', { tokenOverride: token }),
        apiRequest('/tutoring/requests', { tokenOverride: token }),
        apiRequest('/finance/refunds', { tokenOverride: token }),
        apiRequest('/finance/earnings', { tokenOverride: token }),
        apiRequest('/admin/users', { tokenOverride: token }),
        apiRequest('/lms/corporate-quotes', { tokenOverride: token }),
        apiRequest('/portals/tickets', { tokenOverride: token }),
        apiRequest('/admin/audit-logs', { tokenOverride: token }),
      ]);

      if (meRes.ok && meRes.data) {
        setApiOnline(true);
        setIsAuthenticated(true);
        const me = meRes.data;
        const name = me.profile?.fullNameAr || me.email || 'مشرف المنصة';
        const initials = name
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0] || '')
          .join('');
        setCurrentAdmin({
          id: me.id,
          name,
          email: me.email || '',
          role: me.role?.nameAr || me.role?.code || 'ADMIN',
          roleId: me.role?.code || 'ADMIN',
          avatarInitials: initials || 'أد',
        });
      }

      if (overviewRes.ok && overviewRes.data?.kpis) {
        setLiveKpis(overviewRes.data.kpis);
      }
      if (settingsRes.ok && settingsRes.data) {
        setIntegrations((prev) => mergeLiveSettingsIntoIntegrations(settingsRes.data, prev));
      }
      if (policiesRes.ok && policiesRes.data) {
        setPolicies(normalizePolicies(policiesRes.data, INITIAL_POLICIES));
      }
      if (cmsRes.ok && cmsRes.data) {
        setCmsItems(normalizeCms(cmsRes.data, INITIAL_CMS_ITEMS));
      }
      if (appsRes.ok && appsRes.data) {
        setTutorApplications(normalizeTutorApplications(appsRes.data, INITIAL_TUTOR_APPLICATIONS));
      }
      if (reqsRes.ok && reqsRes.data) {
        setTutoringRequests(normalizeTutoringRequests(reqsRes.data, INITIAL_TUTORING_REQUESTS));
      }
      if (refundsRes.ok && refundsRes.data) {
        setRefunds(normalizeRefunds(refundsRes.data, INITIAL_REFUNDS));
      }
      if (earningsRes.ok && earningsRes.data) {
        setSettlements(normalizeSettlements(earningsRes.data, INITIAL_SETTLEMENTS));
      }
      if (usersRes.ok && usersRes.data) {
        setUsers(normalizeUsers(usersRes.data, INITIAL_USERS));
      }
      if (corpRes.ok && corpRes.data) {
        setCorporateRequests(normalizeCorporate(corpRes.data, INITIAL_CORPORATE));
      }
      if (ticketsRes.ok && ticketsRes.data) {
        setTickets(normalizeTickets(ticketsRes.data, INITIAL_TICKETS));
      }
      if (auditRes.ok && auditRes.data) {
        setAuditLogs(normalizeAuditLogs(auditRes.data, INITIAL_AUDIT_LOGS));
      }

      // Governance expansion endpoints (hydrate cleanly when backend exposes them)
      const [staffRes, reportsRes, instrRes, convRes, clogRes, guardRes] = await Promise.all([
        apiRequest('/admin/staff', { tokenOverride: token }),
        apiRequest('/admin/staff/daily-report', { tokenOverride: token }),
        apiRequest('/admin/instructors', { tokenOverride: token }),
        apiRequest('/admin/conversations', { tokenOverride: token }),
        apiRequest('/admin/course-logs', { tokenOverride: token }),
        apiRequest('/admin/guardians', { tokenOverride: token }),
      ]);
      if (staffRes.ok && staffRes.data) setStaff(normalizeStaff(staffRes.data, INITIAL_STAFF));
      if (reportsRes.ok && reportsRes.data)
        setStaffReports(normalizeStaffReports(reportsRes.data, INITIAL_STAFF_REPORTS));
      if (instrRes.ok && instrRes.data)
        setInstructors(normalizeInstructors(instrRes.data, INITIAL_INSTRUCTORS));
      if (convRes.ok && convRes.data)
        setConversations(normalizeConversations(convRes.data, INITIAL_CONVERSATIONS));
      if (clogRes.ok && clogRes.data)
        setCourseLogs(normalizeCourseLogs(clogRes.data, INITIAL_COURSE_LOGS));
      if (guardRes.ok && guardRes.data)
        setGuardians(normalizeGuardians(guardRes.data, INITIAL_GUARDIANS));
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    refreshFromApi();
  }, [refreshFromApi]);

  const loginWithEmailOtp = useCallback(
    async (email: string, code: string): Promise<boolean> => {
      const res = await verifyAdminOtp(email, code);
      if (!res.ok || !res.data?.accessToken) {
        notify('فشل التحقق من الرمز', 'error', res.error || 'تأكد من صحة رمز OTP');
        return false;
      }
      setStoredToken(res.data.accessToken);
      setIsAuthenticated(true);
      setApiOnline(true);
      await refreshFromApi(res.data.accessToken);
      notify('تم تسجيل الدخول بنجاح والربط المباشر بقاعدة البيانات', 'success');
      return true;
    },
    [notify, refreshFromApi]
  );

  const quickLiveLogin = useCallback(
    async (email: string): Promise<boolean> => {
      const otpRes = await requestAdminOtp(email);
      if (!otpRes.ok || !otpRes.data?.devOtp) {
        notify('تعذر تسجيل الدخول السريع', 'warning', 'يمكنك استخدام رمز OTP اليدوي أو متابعة الوضع التجريبي.');
        return false;
      }
      return loginWithEmailOtp(email, otpRes.data.devOtp);
    },
    [loginWithEmailOtp, notify]
  );

  const logoutAdmin = useCallback(() => {
    clearStoredToken();
    setIsAuthenticated(false);
    notify('تم تسجيل الخروج من جلسة API', 'info');
  }, [notify]);

  const switchAdmin = useCallback(
    async (adminId: string) => {
      const found = LIVE_ADMIN_ACCOUNTS.find((u) => u.id === adminId);
      if (!found) return;
      setCurrentAdmin(found);
      // Also authenticate against live backend if online so Maker-Checker uses real DB user IDs!
      const ok = await quickLiveLogin(found.email);
      if (!ok) {
        notify(`تم التبديل محلياً إلى حساب ${found.name}`, 'info', found.role);
      }
    },
    [notify, quickLiveLogin]
  );

  const appendAuditLog = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorName' | 'actorRole' | 'ipAddress'>) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const newLog: AuditLogEntry = {
        ...entry,
        id: `aud-${Date.now()}`,
        timestamp: ts,
        actorName: currentAdmin.name,
        actorRole: currentAdmin.role,
        ipAddress: '185.120.44.12',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [currentAdmin]
  );

  return (
    <AdminContext.Provider
      value={{
        currentAdmin,
        switchAdmin,
        adminUsers: LIVE_ADMIN_ACCOUNTS,
        apiOnline,
        isAuthenticated,
        isHydrating,
        liveKpis,
        loginWithEmailOtp,
        quickLiveLogin,
        logoutAdmin,
        refreshFromApi,
        toasts,
        notify,
        dismissToast,
        integrations,
        setIntegrations,
        cmsItems,
        setCmsItems,
        policies,
        setPolicies,
        subjects,
        setSubjects,
        packages,
        setPackages,
        pricingRules,
        setPricingRules,
        roles,
        setRoles,
        courses,
        setCourses,
        certificates,
        setCertificates,
        tutorApplications,
        setTutorApplications,
        tutoringRequests,
        setTutoringRequests,
        disputes,
        setDisputes,
        ledger,
        setLedger,
        refunds,
        setRefunds,
        settlements,
        setSettlements,
        users,
        setUsers,
        corporateRequests,
        setCorporateRequests,
        tickets,
        setTickets,
        auditLogs,
        appendAuditLog,
        staff,
        setStaff,
        staffReports,
        setStaffReports,
        instructors,
        setInstructors,
        conversations,
        setConversations,
        courseLogs,
        setCourseLogs,
        guardians,
        setGuardians,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
