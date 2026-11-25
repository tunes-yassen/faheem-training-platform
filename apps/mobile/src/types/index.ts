export type UserRole =
  | 'STUDENT'
  | 'PARENT'
  | 'TRAINEE'
  | 'TUTOR'
  | 'TRAINER'
  | 'COORDINATOR'
  | 'SUPER_ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarInitials: string;
  grade?: string;
  department?: string;
  jobTitle?: string;
  isApprovedTutor?: boolean;
  tutorRating?: number;
  tutorSpecialties?: string[];
}

export interface ChildProfile {
  id: string;
  fullName: string;
  grade: string;
  school: string;
  consentVerified: boolean;
  avatarInitials: string;
  upcomingSessionsCount: number;
  averageScore: number;
}

export interface TutorProfile {
  id: string;
  fullName: string;
  title: string;
  subjects: string[];
  grades: string[];
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  experienceYears: number;
  verified: boolean;
  bio: string;
  nextAvailable: string;
  avatarInitials: string;
}

export interface TutoringPackage {
  id: string;
  name: string;
  sessionsCount: number;
  priceSar: number;
  originalPriceSar: number;
  validityDays: number;
  popular?: boolean;
  features: string[];
}

export type LessonRequestPath = 'DIRECT' | 'OPEN_AUTO_MATCH' | 'COORDINATOR';
export type LessonRequestStatus =
  | 'OPEN'
  | 'MATCHED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface LessonRequest {
  id: string;
  studentName: string;
  studentId?: string;
  subject: string;
  grade: string;
  path: LessonRequestPath;
  status: LessonRequestStatus;
  preferredDate: string;
  preferredTime: string;
  durationMinutes: number;
  priceSar: number;
  tutorId?: string;
  tutorName?: string;
  notes?: string;
  createdAt: string;
  classroomUrl?: string;
}

export interface UpcomingSession {
  id: string;
  subject: string;
  topic: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  startsAtLabel: string;
  countdownLabel: string;
  durationMinutes: number;
  platform: 'Zoom' | 'Microsoft Teams' | 'فصل فهيم الافتراضي';
  classroomUrl: string;
  status: 'LIVE_SOON' | 'SCHEDULED' | 'COMPLETED';
}

export type CourseMode = 'IN_PERSON' | 'LIVE_ONLINE' | 'RECORDED';

export interface Course {
  id: string;
  title: string;
  category: string;
  instructorName: string;
  mode: CourseMode;
  durationHours: number;
  priceSar: number;
  rating: number;
  enrolledCount: number;
  seatsRemaining?: number;
  nextCohortDate: string;
  locationOrPlatform: string;
  ncelReady: boolean;
  summary: string;
  highlights: string[];
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  mode: CourseMode;
  enrolledAt: string;
  progressPercent: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export type WalletLedgerType =
  | 'CREDIT'
  | 'HOLD'
  | 'DEBIT'
  | 'RELEASE'
  | 'REFUND'
  | 'SETTLEMENT';

export interface WalletLedgerEntry {
  id: string;
  type: WalletLedgerType;
  amountSar: number;
  description: string;
  reference: string;
  createdAt: string;
}

export interface WalletSummary {
  availableSar: number;
  heldSar: number;
  totalSpentSar: number;
  currency: 'SAR';
}

export interface Certificate {
  id: string;
  serialCode: string;
  courseTitle: string;
  holderName: string;
  issuedAt: string;
  hours: number;
  ncelReady: boolean;
  verificationUrl: string;
  gradeLabel: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  category: 'SESSION' | 'WALLET' | 'COURSE' | 'SYSTEM';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  requesterName?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  slaLabel: string;
  updatedAt: string;
}

export interface TutorAvailabilitySlot {
  id: string;
  dayIndex: number; // 0 = الأحد ... 6 = السبت
  dayLabel: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface TutorSessionReport {
  id: string;
  sessionId: string;
  studentName: string;
  subject: string;
  attendance: 'PRESENT' | 'LATE' | 'ABSENT';
  rating: number;
  topicsCovered: string;
  homework: string;
  submittedAt: string;
}

export interface TutorEarningsSummary {
  pendingSettlementSar: number;
  monthlyEarnedSar: number;
  completedSessionsCount: number;
  averageRating: number;
  recentSettlements: {
    id: string;
    period: string;
    amountSar: number;
    status: 'PAID' | 'PENDING';
    sessionsCount: number;
  }[];
}

// --- Multi-Role Control Suite Types (Admin, Trainer, Coordinator) ---

export interface AdminKpis {
  totalUsers: number;
  monthlyRevenueSar: number;
  activeSessionsToday: number;
  slaCompliancePct: number;
  pendingApprovalsCount: number;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  summary: string;
  createdAt: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface PendingTutorApplication {
  id: string;
  fullName: string;
  email: string;
  specialties: string[];
  qualification: string;
  experienceYears: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionReason?: string;
}

export interface PendingRefundItem {
  id: string;
  reference: string;
  studentName: string;
  amountSar: number;
  netCapturedSar: number;
  reason: string;
  makerId: string;
  makerName: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  checkerNote?: string;
}

export interface StaffDailyReportRow {
  staffId: string;
  fullName: string;
  roleCode: string;
  department: string;
  callsHandled: number;
  ticketsClosed: number;
  ticketsOpen: number;
  slaCompliancePct: number;
  requestsAssigned: number;
  dailyAuditActions: number;
}

export type ConversationType = 'CHAT' | 'CALL_LOG' | 'COORDINATOR_NOTE';

export interface ConversationMessageItem {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  durationSeconds?: number;
}

export interface ConversationThread {
  id: string;
  title: string;
  type: ConversationType;
  participantsLabel: string;
  status: 'OPEN' | 'CLOSED';
  updatedAt: string;
  messages: ConversationMessageItem[];
}

export interface GuardianLinkReview {
  id: string;
  guardianName: string;
  guardianPhone: string;
  studentName: string;
  grade: string;
  monthlyBudgetLimitSar: number;
  status: 'PENDING' | 'VERIFIED' | 'REVOKED';
  updatedAt: string;
}

export interface TrainerCohort {
  id: string;
  courseTitle: string;
  cohortName: string;
  mode: CourseMode;
  traineesCount: number;
  nextSessionLabel: string;
  classroomUrl: string;
  completionPct: number;
}

export interface TrainerTraineeRecord {
  id: string;
  cohortId: string;
  traineeName: string;
  attendance: 'PRESENT' | 'LATE' | 'ABSENT';
  assignmentTitle: string;
  gradeScore: number;
  feedback: string;
}
