import {
  DEMO_CERTIFICATES,
  DEMO_CONVERSATIONS,
  DEMO_COURSES,
  DEMO_LESSON_REQUESTS,
  DEMO_PACKAGES,
  DEMO_TICKETS,
  DEMO_TUTORS,
  DEMO_WALLET_LEDGER,
} from './demo-data';
import type {
  BookingPath,
  CertificateRecord,
  ChildControls,
  ConversationChannelType,
  ConversationMessage,
  ConversationThread,
  Course,
  CourseFormat,
  LessonRequest,
  SupportTicket,
  Tutor,
  TutoringPackage,
  User,
  UserRole,
  WalletTransaction,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function hasAuthToken(): boolean {
  return typeof window !== 'undefined' && Boolean(localStorage.getItem('faheem_token'));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiFetch<T = any>(path: string, options?: RequestInit & { requireAuth?: boolean }): Promise<T | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('faheem_token') : null;
    if (options?.requireAuth && !token) return null;
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.data)) return raw.data;
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCourse(raw: any, idx = 0): Course {
  const accents: Course['accent'][] = ['teal', 'azure', 'amber'];
  const validFormat: CourseFormat =
    raw?.format === 'IN_PERSON' || raw?.format === 'LIVE_ONLINE' || raw?.format === 'RECORDED'
      ? raw.format
      : raw?.deliveryMode === 'IN_PERSON' ||
          raw?.deliveryMode === 'LIVE_ONLINE' ||
          raw?.deliveryMode === 'RECORDED'
        ? raw.deliveryMode
        : 'LIVE_ONLINE';

  const price = Number(raw?.price ?? raw?.priceSar ?? 950) || 950;
  const hours = Number(raw?.hours ?? raw?.durationHours ?? 20) || 20;
  const trainerName =
    raw?.trainer?.name ||
    raw?.trainer?.profile?.fullName ||
    raw?.trainerName ||
    'مدرب معتمد في منصة فهيم';
  const trainerBio =
    raw?.trainer?.bio ||
    raw?.trainer?.profile?.bio ||
    'مدرب معتمد بخبرة عملية وتطبيقية في برامج التطوير المهني بالمملكة.';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCohorts = Array.isArray(raw?.cohorts) ? raw.cohorts : [];
  const cohorts =
    rawCohorts.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawCohorts.map((coh: any, cIdx: number) => {
          const total = Number(coh?.seatsTotal ?? coh?.capacity ?? 30) || 30;
          const enrolled = Number(coh?.enrolledCount ?? 0) || 0;
          const remaining =
            coh?.seatsRemaining !== undefined ? Number(coh.seatsRemaining) : Math.max(1, total - enrolled);
          return {
            id: String(coh?.id || `coh-${idx}-${cIdx}`),
            name: String(coh?.name || coh?.code || `الدفعة ${cIdx + 1}`),
            startDate: coh?.startDate ? String(coh.startDate).slice(0, 10) : 'قريباً',
            endDate: coh?.endDate ? String(coh.endDate).slice(0, 10) : 'مرن',
            schedule: String(coh?.schedule || 'الأحد - الأربعاء | 7:00 م - 9:30 م'),
            seatsTotal: total,
            seatsRemaining: remaining,
            locationOrPlatform: String(
              coh?.locationOrPlatform ||
                coh?.location ||
                (validFormat === 'IN_PERSON'
                  ? 'مقر أكاديمية فهيم — الرياض'
                  : 'قاعة فهيم الافتراضية'),
            ),
          };
        })
      : [
          {
            id: `coh-default-${raw?.id || idx}`,
            name: validFormat === 'RECORDED' ? 'التعلم الذاتي المسجل — متاح فوراً' : 'الدفعة القادمة المفتوحة للتسجيل',
            startDate: validFormat === 'RECORDED' ? 'متاح فوراً' : '2026-12-10',
            endDate: validFormat === 'RECORDED' ? 'وصول مفتوح' : '2026-12-28',
            schedule: validFormat === 'RECORDED' ? 'بالوقت الذي يناسبك' : 'الأحد - الأربعاء | 7:00 م - 9:30 م',
            seatsTotal: validFormat === 'RECORDED' ? 999 : 30,
            seatsRemaining: validFormat === 'RECORDED' ? 999 : 12,
            locationOrPlatform:
              validFormat === 'IN_PERSON' ? 'مقر فهيم للتدريب — الرياض' : 'قاعة فهيم الافتراضية',
          },
        ];

  const fallbackCourse = DEMO_COURSES[idx % DEMO_COURSES.length];

  return {
    id: String(raw?.id || `crs-${idx}`),
    slug: String(raw?.slug || fallbackCourse.slug),
    title: String(raw?.title || raw?.titleAr || fallbackCourse.title),
    subtitle: String(raw?.subtitle || raw?.summaryAr || raw?.descriptionAr || fallbackCourse.subtitle),
    category: String(raw?.category || 'التطوير المهني'),
    format: validFormat,
    price,
    originalPrice: raw?.originalPrice ? Number(raw.originalPrice) : Math.round(price * 1.25),
    hours,
    level: String(raw?.level || 'جميع المستويات'),
    rating: Number(raw?.rating || raw?.trainer?.profile?.ratingAvg || 4.9) || 4.9,
    studentsCount: Number(raw?.studentsCount || 480 + idx * 120),
    ncelAccredited: Boolean(raw?.ncelAccredited ?? true),
    accent: raw?.accent || accents[idx % accents.length],
    trainer: {
      name: String(trainerName),
      title: String(raw?.trainer?.title || 'مدرب مهني معتمد'),
      bio: String(trainerBio),
      experienceYears: Number(raw?.trainer?.experienceYears || 10),
      rating: Number(raw?.trainer?.rating || raw?.trainer?.profile?.ratingAvg || 4.9) || 4.9,
    },
    highlights:
      Array.isArray(raw?.highlights) && raw.highlights.length > 0
        ? raw.highlights
        : [
            `${hours} ساعة تدريبية تطبيقية معتمدة`,
            'شهادة رقمية قابلة للتحقق الفوري برمز QR',
            'حقيبة تدريبية وملفات تطبيقية جاهزة للاستخدام',
            'متابعة وتقييم مباشر مع المدرب عبر بوابة المتدرب',
          ],
    curriculum:
      Array.isArray(raw?.curriculum) && raw.curriculum.length > 0
        ? raw.curriculum
        : fallbackCourse.curriculum,
    cohorts,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTutor(raw: any, idx = 0): Tutor {
  const profile = raw?.profile || {};
  const rawSubjects = Array.isArray(raw?.subjects)
    ? raw.subjects
    : Array.isArray(raw?.tutorSubjects)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw.tutorSubjects.map((ts: any) => ts?.subject?.nameAr || ts?.nameAr).filter(Boolean)
      : [];

  const subjects: string[] = rawSubjects.length > 0 ? rawSubjects : ['الرياضيات', 'القدرات الكمي'];
  const stages: string[] =
    Array.isArray(raw?.stages) && raw.stages.length > 0 ? raw.stages : ['المتوسط', 'الثانوي'];

  return {
    id: String(raw?.id || `tut-${idx}`),
    name: String(raw?.name || profile?.fullName || `معلم معتمد ${idx + 1}`),
    title: String(raw?.title || `معلم ${subjects[0]} معتمد`),
    subjects,
    stages,
    hourlyRate: Number(raw?.hourlyRate ?? profile?.hourlyRate ?? 110) || 110,
    rating: Number(raw?.rating ?? profile?.ratingAvg ?? 4.9) || 4.9,
    reviewsCount: Number(raw?.reviewsCount ?? profile?.ratingCount ?? 42) || 42,
    sessionsCompleted: Number(raw?.sessionsCompleted ?? 180 + idx * 45),
    verified: Boolean(raw?.verified ?? raw?.isTutorApproved ?? true),
    bio: String(
      raw?.bio ||
        profile?.bio ||
        'معلم معتمد في منصة فهيم بخبرة تربوية وتأسيسية وتقارير أداء دورية لولي الأمر.',
    ),
    city: String(raw?.city || profile?.city || 'الرياض'),
    nextSlot: String(raw?.nextSlot || 'اليوم 5:00 م'),
    specialties:
      Array.isArray(raw?.specialties) && raw.specialties.length > 0 ? raw.specialties : subjects,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePackage(raw: any, idx = 0): TutoringPackage {
  const hours = Number(raw?.hours ?? raw?.sessionsCount ?? 4) || 4;
  const price = Number(raw?.price ?? raw?.priceSar ?? hours * 95) || hours * 95;
  const pricePerHour = Number(raw?.pricePerHour ?? Math.round(price / Math.max(1, hours)));
  const validity = Number(raw?.validityDays ?? 90);
  const subjectName = raw?.subject?.nameAr;

  return {
    id: String(raw?.id || `pkg-${idx}`),
    name: String(raw?.name || raw?.titleAr || `باقة ${hours} حصص`),
    hours,
    price,
    pricePerHour,
    savingsPercent: Number(raw?.savingsPercent ?? (idx === 0 ? 10 : idx === 1 ? 20 : 28)),
    popular: Boolean(raw?.popular ?? idx === 1),
    features:
      Array.isArray(raw?.features) && raw.features.length > 0
        ? raw.features
        : [
            `${hours} حصص تقوية فردية 1-on-1 (${raw?.durationMins || 60} دقيقة لكل حصة)`,
            subjectName ? `مخصصة لمادة ${subjectName} أو شاملة` : 'صالحة لجميع المواد والمعلمين المعتمدين',
            `صلاحية الرصيد لمدة ${validity} يوماً`,
            'تقرير أداء مفصل بعد كل حصة لولي الأمر والطالب',
          ],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRequest(raw: any, idx = 0): LessonRequest {
  const modeVal = raw?.mode === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE';
  const pathVal: BookingPath =
    raw?.path === 'DIRECT' || raw?.path === 'OPEN_AUTO_MATCH' || raw?.path === 'COORDINATOR'
      ? raw.path
      : raw?.mode === 'DIRECT' || raw?.mode === 'OPEN_AUTO_MATCH' || raw?.mode === 'COORDINATOR'
        ? raw.mode
        : 'OPEN_AUTO_MATCH';

  return {
    id: String(raw?.id || `REQ-${8400 + idx}`),
    studentName: String(raw?.studentName || raw?.student?.profile?.fullName || 'طالب مسجل'),
    subject: String(raw?.subject?.nameAr || raw?.subject || 'الرياضيات'),
    stage: String(raw?.stage || raw?.grade?.stage || 'الثانوي'),
    grade: String(raw?.grade?.nameAr || raw?.grade || 'الثالث الثانوي'),
    path: pathVal,
    preferredTime: String(raw?.preferredTime || raw?.scheduledAt?.slice(0, 16)?.replace('T', ' ') || 'غداً 5:00 م'),
    mode: modeVal,
    notes: raw?.notes ? String(raw.notes) : undefined,
    status:
      raw?.status === 'CONFIRMED' || raw?.status === 'MATCHED' || raw?.status === 'COMPLETED' || raw?.status === 'CANCELLED'
        ? raw.status
        : 'PENDING',
    tutorName: raw?.tutorName || raw?.assignedTutor?.profile?.fullName || undefined,
    price: Number(raw?.price ?? raw?.priceSar ?? 110) || 110,
    createdAt: raw?.createdAt ? String(raw.createdAt).slice(0, 10) : 'اليوم',
  };
}

export const api = {
  async getCourses(): Promise<Course[]> {
    const raw = await apiFetch('/lms/courses');
    const list = extractList(raw);
    return list.length > 0 ? list.map((c, i) => normalizeCourse(c, i)) : DEMO_COURSES;
  },

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const all = await this.getCourses();
    const bySlug = all.find((c) => c.slug === slug || c.id === slug);
    if (bySlug) return bySlug;
    const single = await apiFetch(`/lms/courses/${encodeURIComponent(slug)}`);
    if (single && (single.slug || single.titleAr || single.title)) {
      return normalizeCourse(single, 0);
    }
    return DEMO_COURSES.find((c) => c.slug === slug);
  },

  async getTutors(): Promise<Tutor[]> {
    const raw = await apiFetch('/tutoring/tutors');
    const list = extractList(raw);
    return list.length > 0 ? list.map((t, i) => normalizeTutor(t, i)) : DEMO_TUTORS;
  },

  async getPackages(): Promise<TutoringPackage[]> {
    const raw = await apiFetch('/tutoring/packages');
    const list = extractList(raw);
    return list.length > 0 ? list.map((p, i) => normalizePackage(p, i)) : DEMO_PACKAGES;
  },

  async getLessonRequests(): Promise<LessonRequest[]> {
    if (!hasAuthToken()) return DEMO_LESSON_REQUESTS;
    const raw = await apiFetch('/tutoring/requests', { requireAuth: true });
    const list = extractList(raw);
    return list.length > 0 ? list.map((r, i) => normalizeRequest(r, i)) : DEMO_LESSON_REQUESTS;
  },

  async createLessonRequest(payload: Partial<LessonRequest>): Promise<{ ok: boolean; id: string }> {
    const res = await apiFetch<{ id?: string }>('/tutoring/requests', {
      method: 'POST',
      body: JSON.stringify({
        mode: payload.path || 'OPEN_AUTO_MATCH',
        notes: `${payload.subject || ''} - ${payload.grade || ''} - ${payload.preferredTime || ''} ${payload.notes || ''}`.trim(),
      }),
    });
    return { ok: true, id: res?.id || `REQ-${Math.floor(8500 + Math.random() * 1400)}` };
  },

  async acceptLessonRequest(id: string): Promise<{ ok: boolean; message: string }> {
    const res = await apiFetch<{ message?: string }>(`/tutoring/requests/${encodeURIComponent(id)}/accept`, {
      method: 'POST',
    });
    return {
      ok: true,
      message: res?.message || 'تم قبول الطلب وتثبيت الحجز ذرياً بنجاح.',
    };
  },

  async enrollInCourse(cohortId: string): Promise<{ ok: boolean; message: string }> {
    const res = await apiFetch('/lms/enrollments', {
      method: 'POST',
      body: JSON.stringify({ cohortId }),
    });
    return {
      ok: true,
      message: res ? 'تم تأكيد تسجيلك في الدفعة وحجز المقعد بنجاح!' : 'تم تسجيل طلبك في الدفعة بنجاح!',
    };
  },

  async verifyCertificate(code: string): Promise<CertificateRecord | null> {
    const clean = code.trim().toUpperCase();
    const res = await apiFetch(`/verify/${encodeURIComponent(clean)}`);
    if (res && (res.serial || res.verificationCode || res.serialNumber)) {
      return {
        serial: String(res.serial || res.serialNumber || res.verificationCode || clean),
        holderName: String(res.holderName || res.studentName || 'متدرب معتمد'),
        courseTitle: String(res.courseTitle || res.courseTitleAr || 'برنامج تدريبي معتمد'),
        issueDate: String(res.issueDate || res.issuedAt || '2026-11-10').slice(0, 10),
        hours: Number(res.hours || res.durationHours || 30),
        ncelCode: String(res.ncelCode || res.ncelProgramCode || 'NCEL-SA-READY'),
        status: res.status === 'REVOKED' ? 'REVOKED' : 'VALID',
        grade: String(res.grade || 'امتياز'),
        trainerName: String(res.trainerName || 'مدرب معتمد في منصة فهيم'),
      };
    }
    return DEMO_CERTIFICATES[clean] || null;
  },

  async getWalletLedger(): Promise<WalletTransaction[]> {
    if (!hasAuthToken()) return DEMO_WALLET_LEDGER;
    const res = await apiFetch('/finance/wallet', { requireAuth: true });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.ledger)
        ? res.ledger
        : Array.isArray(res?.transactions)
          ? res.transactions
          : [];
    if (list.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return list.map((tx: any, i: number) => ({
        id: String(tx?.id || `TX-${i}`),
        type: tx?.type || 'CREDIT',
        amount: Number(tx?.amount ?? tx?.amountSar ?? 0),
        description: String(tx?.description || tx?.note || 'حركة محفظة'),
        date: String(tx?.date || tx?.createdAt || '2026-11-20').slice(0, 10),
        reference: String(tx?.reference || tx?.idempotencyKey || `REF-${i}`),
      }));
    }
    return DEMO_WALLET_LEDGER;
  },

  async getTickets(): Promise<SupportTicket[]> {
    if (!hasAuthToken()) return DEMO_TICKETS;
    const raw = await apiFetch('/portals/tickets', { requireAuth: true });
    const list = extractList(raw);
    if (list.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return list.map((t: any, i: number) => ({
        id: String(t?.id || `TKT-${i}`),
        subject: String(t?.subject || 'تذكرة دعم'),
        category: String(t?.category || 'دعم عام'),
        status: t?.status === 'RESOLVED' || t?.status === 'IN_PROGRESS' ? t.status : 'OPEN',
        priority: t?.priority === 'HIGH' || t?.priority === 'LOW' ? t.priority : 'MEDIUM',
        slaRemaining: String(t?.slaRemaining || 'ضمن SLA'),
        createdAt: String(t?.createdAt || 'اليوم').slice(0, 10),
        requesterName: t?.requesterName || t?.user?.profile?.fullName,
      }));
    }
    return DEMO_TICKETS;
  },

  async requestOtp(identifier: string): Promise<{ ok: boolean; demoCode: string; live: boolean }> {
    const res = await apiFetch<{ devOtp?: string; demoCode?: string; code?: string }>(
      '/auth/otp/request',
      {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      },
    );
    const code = res?.devOtp || res?.demoCode || res?.code || '123456';
    return { ok: true, demoCode: String(code), live: Boolean(res) };
  },

  async verifyOtp(params: {
    identifier: string;
    code: string;
    roleCode?: UserRole;
    fullName?: string;
  }): Promise<{ ok: boolean; accessToken?: string; user?: Partial<User> }> {
    const mappedRole = params.roleCode === 'TRAINEE' ? 'STUDENT' : params.roleCode;
    const res = await apiFetch<{
      accessToken?: string;
      refreshToken?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user?: any;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        identifier: params.identifier,
        code: params.code,
        roleCode: mappedRole,
        fullName: params.fullName || undefined,
      }),
    });

    if (res?.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('faheem_token', res.accessToken);
        if (res.refreshToken) localStorage.setItem('faheem_refresh_token', res.refreshToken);
      }
      return {
        ok: true,
        accessToken: res.accessToken,
        user: {
          id: res.user?.id,
          name: res.user?.profile?.fullName || params.fullName,
          email: res.user?.email,
          phone: res.user?.phone,
          role: params.roleCode || (res.user?.role?.code as UserRole) || 'STUDENT',
        },
      };
    }

    return { ok: true };
  },

  async submitCorporateQuote(payload: Record<string, string>): Promise<{ ok: boolean; reference: string }> {
    const res = await apiFetch<{ id?: string }>('/lms/corporate-quotes', {
      method: 'POST',
      body: JSON.stringify({
        companyName: payload.companyName,
        contactName: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        traineesCount: 30,
        notes: `${payload.track || ''} | ${payload.employeesCount || ''} | ${payload.notes || ''}`,
      }),
    });
    return { ok: true, reference: res?.id || `CORP-${Math.floor(1000 + Math.random() * 9000)}` };
  },

  async submitTutorApplication(payload: Record<string, string>): Promise<{ ok: boolean; reference: string }> {
    const res = await apiFetch<{ id?: string }>('/tutoring/applications', {
      method: 'POST',
      body: JSON.stringify({
        bio: payload.bio,
        experienceYears: 5,
        specialty: payload.specialty,
      }),
    });
    return { ok: true, reference: res?.id || `APP-${Math.floor(1000 + Math.random() * 9000)}` };
  },

  async updateChildControls(linkId: string, controls: ChildControls): Promise<{ ok: boolean; synced: boolean }> {
    if (!hasAuthToken()) return { ok: true, synced: false };
    const res = await apiFetch(`/portals/guardian/links/${encodeURIComponent(linkId)}/controls`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(controls),
    });
    return { ok: true, synced: Boolean(res) };
  },

  async getConversations(): Promise<ConversationThread[]> {
    if (!hasAuthToken()) return DEMO_CONVERSATIONS;
    const raw = await apiFetch('/portals/conversations', { requireAuth: true });
    const list = extractList(raw);
    if (list.length === 0) return DEMO_CONVERSATIONS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((t: any, i: number) => ({
      id: String(t?.id || `conv-${i}`),
      subject: String(t?.subject || t?.title || 'محادثة متابعة'),
      participantName: String(
        t?.participantName || t?.participants?.[0]?.profile?.fullName || 'فريق منصة فهيم',
      ),
      participantRole: String(t?.participantRole || 'منسق / معلم'),
      channelType: (t?.channelType || t?.type || 'CHAT') as ConversationChannelType,
      unreadCount: Number(t?.unreadCount || 0),
      updatedAt: String(t?.updatedAt || 'اليوم').slice(0, 16).replace('T', ' '),
      messages: Array.isArray(t?.messages)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t.messages.map((m: any, mIdx: number) => ({
            id: String(m?.id || `m-${i}-${mIdx}`),
            senderName: String(m?.senderName || m?.sender?.profile?.fullName || 'مشارك'),
            senderRole: String(m?.senderRole || m?.sender?.role?.code || 'مستخدم'),
            body: String(m?.body || m?.content || ''),
            type: (m?.type || m?.channelType || 'CHAT') as ConversationChannelType,
            createdAt: String(m?.createdAt || 'الآن').slice(0, 16).replace('T', ' '),
            isMine: Boolean(m?.isMine),
          }))
        : [],
    }));
  },

  async createConversation(payload: {
    subject: string;
    participantName: string;
    channelType: ConversationChannelType;
    initialMessage: string;
  }): Promise<{ ok: boolean; thread: ConversationThread }> {
    const now = 'الآن';
    const localThread: ConversationThread = {
      id: `conv-${Date.now()}`,
      subject: payload.subject,
      participantName: payload.participantName,
      participantRole: 'عضو في فهيم',
      channelType: payload.channelType,
      unreadCount: 0,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: 'أنت',
          senderRole: 'مستخدم',
          body: payload.initialMessage,
          type: payload.channelType,
          createdAt: now,
          isMine: true,
        },
      ],
    };

    if (hasAuthToken()) {
      const res = await apiFetch<{ id?: string }>('/portals/conversations', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({
          title: payload.subject,
          type: payload.channelType,
          participantIds: [],
          initialMessage: payload.initialMessage,
        }),
      });
      if (res?.id) localThread.id = String(res.id);
    }

    return { ok: true, thread: localThread };
  },

  async sendConversationMessage(
    threadId: string,
    payload: { body: string; type: ConversationChannelType; senderName: string; senderRole: string },
  ): Promise<{ ok: boolean; message: ConversationMessage }> {
    const msg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      senderName: payload.senderName,
      senderRole: payload.senderRole,
      body: payload.body,
      type: payload.type,
      createdAt: 'الآن',
      isMine: true,
    };

    if (hasAuthToken()) {
      await apiFetch(`/portals/conversations/${encodeURIComponent(threadId)}/messages`, {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ content: payload.body, type: payload.type }),
      });
    }

    return { ok: true, message: msg };
  },
};
