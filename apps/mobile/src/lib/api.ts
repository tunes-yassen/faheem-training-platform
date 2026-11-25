import Constants from 'expo-constants';
import { tokenStorage } from './storage';
import {
  ConversationType,
  LessonRequestPath,
  TutorAvailabilitySlot,
  UserRole,
} from '@/types';

const ACCESS_TOKEN_KEY = 'faheem_access_token';
const REFRESH_TOKEN_KEY = 'faheem_refresh_token';
const USER_ROLE_KEY = 'faheem_user_role';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  'http://localhost:4000/api/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  skipAuth?: boolean;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, timeoutMs = 4500, skipAuth = false, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const token = skipAuth ? null : await tokenStorage.getItem(ACCESS_TOKEN_KEY);
    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': 'ar',
      ...(headers as Record<string, string> | undefined),
    };

    if (token) {
      mergedHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: mergedHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const msg =
        (parsed && (parsed.message || parsed.error)) ||
        `HTTP ${response.status}`;
      throw new ApiError(
        Array.isArray(msg) ? msg.join(', ') : String(msg),
        response.status,
        parsed
      );
    }

    return parsed as T;
  } finally {
    clearTimeout(timer);
  }
}

export const sessionTokens = {
  getAccessToken: () => tokenStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => tokenStorage.getItem(REFRESH_TOKEN_KEY),
  getSavedRole: () => tokenStorage.getItem(USER_ROLE_KEY) as Promise<UserRole | null>,
  async save(accessToken: string, refreshToken?: string, role?: UserRole) {
    await tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (role) {
      await tokenStorage.setItem(USER_ROLE_KEY, role);
    }
  },
  async saveRole(role: UserRole) {
    await tokenStorage.setItem(USER_ROLE_KEY, role);
  },
  async clear() {
    await Promise.all([
      tokenStorage.removeItem(ACCESS_TOKEN_KEY),
      tokenStorage.removeItem(REFRESH_TOKEN_KEY),
      tokenStorage.removeItem(USER_ROLE_KEY),
    ]);
  },
};

export const authApi = {
  requestOtp(identifier: string, channel?: 'SMS' | 'EMAIL') {
    return apiRequest<{ message?: string; devOtp?: string; code?: string }>(
      '/auth/otp/request',
      {
        method: 'POST',
        body: { identifier, channel },
        skipAuth: true,
      }
    );
  },
  verifyOtp(payload: {
    identifier: string;
    code: string;
    roleCode?: UserRole;
    fullName?: string;
  }) {
    return apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        fullName?: string;
        email?: string;
        phone?: string;
        role?: string;
      };
    }>('/auth/otp/verify', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  },
  me() {
    return apiRequest<Record<string, unknown>>('/auth/me');
  },
  logout() {
    return apiRequest('/auth/logout', { method: 'POST' });
  },
};

export const tutoringApi = {
  getTutors() {
    return apiRequest<unknown[]>('/tutoring/tutors');
  },
  getPackages() {
    return apiRequest<unknown[]>('/tutoring/packages');
  },
  getRequests() {
    return apiRequest<unknown[]>('/tutoring/requests');
  },
  createRequest(payload: {
    subject: string;
    grade: string;
    mode: LessonRequestPath;
    tutorId?: string;
    preferredDate: string;
    preferredTime: string;
    durationMinutes: number;
    notes?: string;
  }) {
    return apiRequest<Record<string, unknown>>('/tutoring/requests', {
      method: 'POST',
      body: payload,
    });
  },
  acceptRequestAtomic(requestId: string) {
    return apiRequest<Record<string, unknown>>(
      `/tutoring/requests/${requestId}/accept`,
      { method: 'POST' }
    );
  },
  assignRequest(requestId: string, tutorId: string) {
    return apiRequest<Record<string, unknown>>(
      `/tutoring/requests/${requestId}/assign`,
      { method: 'POST', body: { tutorId } }
    );
  },
  getMyBookings() {
    return apiRequest<unknown[]>('/tutoring/bookings/my');
  },
  getMyAvailability() {
    return apiRequest<unknown[]>('/tutoring/availability/my');
  },
  updateAvailability(slots: TutorAvailabilitySlot[]) {
    return apiRequest('/tutoring/availability', {
      method: 'PUT',
      body: {
        slots: slots.map((s) => ({
          dayOfWeek: s.dayIndex,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.enabled,
        })),
      },
    });
  },
  submitSessionReport(
    sessionId: string,
    payload: {
      attendance: 'PRESENT' | 'LATE' | 'ABSENT';
      rating: number;
      topicsCovered: string;
      homework: string;
    }
  ) {
    return apiRequest(`/tutoring/sessions/${sessionId}/report`, {
      method: 'POST',
      body: payload,
    });
  },
};

export const lmsApi = {
  getCourses() {
    return apiRequest<unknown[]>('/lms/courses');
  },
  enroll(courseId: string) {
    return apiRequest('/lms/enrollments', {
      method: 'POST',
      body: { courseId },
    });
  },
  getMyEnrollments() {
    return apiRequest<unknown[]>('/lms/enrollments/my');
  },
  getMyCertificates() {
    return apiRequest<unknown[]>('/lms/certificates/my');
  },
  verifyCertificate(code: string) {
    return apiRequest<Record<string, unknown>>(`/verify/${code}`, {
      skipAuth: true,
    });
  },
  markAttendance(payload: { cohortId: string; traineeId: string; status: 'PRESENT' | 'LATE' | 'ABSENT' }) {
    return apiRequest('/lms/attendance', {
      method: 'POST',
      body: payload,
    });
  },
  gradeAssessment(assessmentId: string, payload: { score: number; feedback: string }) {
    return apiRequest(`/lms/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: payload,
    });
  },
};

export const financeApi = {
  getWallet() {
    return apiRequest<Record<string, unknown>>('/finance/wallet');
  },
  createOrder(payload: { amountSar: number; description: string; packageId?: string }) {
    return apiRequest('/finance/orders', {
      method: 'POST',
      body: payload,
    });
  },
  getMyEarnings() {
    return apiRequest<Record<string, unknown>>('/finance/earnings/my');
  },
  getRefunds() {
    return apiRequest<unknown[]>('/finance/refunds');
  },
  approveRefund(refundId: string, note?: string) {
    return apiRequest(`/finance/refunds/${refundId}/approve`, {
      method: 'POST',
      body: { note },
    });
  },
  rejectRefund(refundId: string, reason: string) {
    return apiRequest(`/finance/refunds/${refundId}/reject`, {
      method: 'POST',
      body: { reason },
    });
  },
};

export const portalsApi = {
  getChildren() {
    return apiRequest<unknown[]>('/portals/guardian/children');
  },
  linkChild(payload: { fullName: string; grade: string; school: string }) {
    return apiRequest('/portals/guardian/links', {
      method: 'POST',
      body: payload,
    });
  },
  getNotifications() {
    return apiRequest<unknown[]>('/portals/notifications');
  },
  markNotificationRead(id: string) {
    return apiRequest(`/portals/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
  getTickets() {
    return apiRequest<unknown[]>('/portals/tickets');
  },
  createTicket(payload: { subject: string; category: string; description?: string }) {
    return apiRequest('/portals/tickets', {
      method: 'POST',
      body: payload,
    });
  },
  updateTicketStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') {
    return apiRequest(`/portals/tickets/${id}`, {
      method: 'PATCH',
      body: { status },
    });
  },
  getConversations() {
    return apiRequest<unknown[]>('/portals/conversations');
  },
  addConversationMessage(
    conversationId: string,
    payload: { content: string; type?: ConversationType; durationSeconds?: number }
  ) {
    return apiRequest(`/portals/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: payload,
    });
  },
};

export const adminApi = {
  getAnalyticsOverview() {
    return apiRequest<Record<string, unknown>>('/portals/analytics/overview');
  },
  setMaintenanceMode(enabled: boolean) {
    return apiRequest('/admin/settings', {
      method: 'PUT',
      body: {
        category: 'general',
        key: 'maintenance_mode',
        value: enabled ? 'true' : 'false',
      },
    });
  },
  getAuditLogs() {
    return apiRequest<unknown[]>('/admin/audit-logs');
  },
  reviewTutorApplication(
    applicationId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; reason: string }
  ) {
    return apiRequest(`/tutoring/applications/${applicationId}/review`, {
      method: 'PATCH',
      body: payload,
    });
  },
  getStaffDailyReport() {
    return apiRequest<Record<string, unknown>>('/admin/staff/daily-report');
  },
  getConversations(params?: { search?: string; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest<unknown[]>(`/admin/conversations${suffix}`);
  },
  getGuardians() {
    return apiRequest<unknown[]>('/admin/guardians');
  },
  updateGuardianLinkStatus(
    linkId: string,
    payload: { status: 'VERIFIED' | 'REVOKED'; reason?: string }
  ) {
    return apiRequest(`/admin/guardians/links/${linkId}/status`, {
      method: 'PATCH',
      body: payload,
    });
  },
};
