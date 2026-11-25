export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string;
  avatarInitials: string;
}

export type IntegrationCategory =
  | 'payment'
  | 'classroom'
  | 'sms'
  | 'email'
  | 'storage'
  | 'ncel'
  | 'branding';

export interface IntegrationField {
  key: string;
  label: string;
  type: 'text' | 'secret' | 'number' | 'boolean' | 'select' | 'color' | 'textarea';
  value: string | number | boolean;
  placeholder?: string;
  helperText?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface IntegrationConfig {
  category: IntegrationCategory;
  title: string;
  subtitle: string;
  mode: 'live' | 'sandbox';
  enabled: boolean;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'error' | 'idle';
  lastTestMessage?: string;
  fields: IntegrationField[];
}

export interface CmsItem {
  id: string;
  type: 'menu' | 'banner' | 'page' | 'faq' | 'testimonial' | 'seo';
  title: string;
  slug?: string;
  summary: string;
  content: string;
  status: 'DRAFT' | 'PREVIEW' | 'PUBLISHED';
  updatedAt: string;
  author: string;
  meta?: Record<string, string>;
}

export interface PolicyVersion {
  id: string;
  version: string;
  title: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  effectiveFrom: string;
  cancellationFreeWindowHours: number;
  noShowPenaltyPercent: number;
  refundMaxDays: number;
  refundProcessingFeePercent: number;
  autoMatchTimeoutMinutes: number;
  teacherCompModel: 'HOURLY' | 'COMMISSION' | 'FIXED';
  teacherHourlyRate: number;
  teacherCommissionPercent: number;
  teacherFixedPerSession: number;
  platformCommissionPercent: number;
  notes: string;
  updatedBy: string;
}

export interface SubjectItem {
  id: string;
  nameAr: string;
  nameEn: string;
  stage: string;
  baseHourlyRate: number;
  activeTutors: number;
  active: boolean;
}

export interface TutoringPackage {
  id: string;
  name: string;
  sessionsCount: number;
  sessionDurationMin: number;
  priceSar: number;
  originalPriceSar: number;
  validityDays: number;
  badge?: string;
  active: boolean;
  soldCount: number;
}

export interface PricingRule {
  id: string;
  name: string;
  condition: string;
  adjustmentType: 'PERCENT_UP' | 'PERCENT_DOWN' | 'FIXED_ADD';
  value: number;
  active: boolean;
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export interface RoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  usersCount: number;
  isSystem: boolean;
  permissions: Record<string, PermissionAction[]>;
}

export interface CourseItem {
  id: string;
  title: string;
  category: string;
  deliveryMode: 'IN_PERSON' | 'LIVE_ONLINE' | 'RECORDED';
  trainerName: string;
  priceSar: number;
  hours: number;
  cohortsCount: number;
  enrolledCount: number;
  capacity: number;
  completionRate: number;
  ncelSynced: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
}

export interface CertificateRecord {
  id: string;
  serialCode: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  status: 'VALID' | 'REVOKED';
  ncelReported: boolean;
  revokeReason?: string;
}

export interface TutorApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  qualification: string;
  experienceYears: number;
  hourlyRateRequested: number;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionReason?: string;
  decidedBy?: string;
}

export interface TutoringRequestItem {
  id: string;
  studentName: string;
  subject: string;
  grade: string;
  path: 'DIRECT' | 'OPEN_AUTO_MATCH' | 'COORDINATOR';
  assignedTutor?: string;
  scheduledAt: string;
  status: 'OPEN' | 'MATCHED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  priceSar: number;
}

export interface DisputeItem {
  id: string;
  bookingRef: string;
  studentName: string;
  tutorName: string;
  reason: string;
  amountSar: number;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  openedAt: string;
  resolution?: string;
}

export interface WalletLedgerEntry {
  id: string;
  reference: string;
  userName: string;
  userRole: string;
  type: 'CREDIT' | 'HOLD' | 'DEBIT' | 'RELEASE' | 'REFUND' | 'SETTLEMENT';
  amountSar: number;
  balanceAfterSar: number;
  description: string;
  createdAt: string;
  immutableHash: string;
}

export interface RefundRequest {
  id: string;
  orderRef: string;
  studentName: string;
  netCapturedSar: number;
  requestedAmountSar: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdById: string;
  createdByName: string;
  createdAt: string;
  approvedById?: string;
  approvedByName?: string;
  decisionNote?: string;
  decidedAt?: string;
}

export interface TeacherSettlement {
  id: string;
  teacherName: string;
  period: string;
  sessionsCount: number;
  grossAmountSar: number;
  commissionSar: number;
  netPayoutSar: number;
  ibanLast4: string;
  status: 'PENDING' | 'SETTLED';
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'PARENT' | 'TUTOR' | 'TRAINER' | 'COORDINATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  joinedAt: string;
  walletBalanceSar: number;
  linkedChildren?: string[];
}

export interface CorporateRequest {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  programTopic: string;
  seatsCount: number;
  deliveryMode: 'IN_PERSON' | 'LIVE_ONLINE' | 'HYBRID';
  estimatedBudgetSar: number;
  status: 'NEW' | 'QUOTING' | 'PROPOSAL_SENT' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  code: string;
  subject: string;
  requesterName: string;
  requesterRole: string;
  category: 'PAYMENT' | 'TECHNICAL' | 'TUTORING' | 'CERTIFICATE' | 'COMPLAINT';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  slaRemaining: string;
  slaBreached: boolean;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  lastMessage: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  module: string;
  action: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress: string;
  summary: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
