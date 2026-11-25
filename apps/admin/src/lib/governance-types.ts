export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  roleCode: 'SUPER_ADMIN' | 'TRAINING_MANAGER' | 'FINANCE_MAKER' | 'FINANCE_CHECKER' | 'COORDINATOR' | 'CUSTOMER_SERVICE';
  roleLabel: string;
  status: 'ACTIVE' | 'SUSPENDED';
  customPermissions: string[];
  lastActive: string;
}

export interface StaffDailyReport {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  date: string;
  callsHandled: number;
  ticketsClosed: number;
  requestsAssigned: number;
  slaCompliancePercent: number;
  notes: string;
}

export interface InstructorPermissions {
  canUploadMaterials: boolean;
  canGrade: boolean;
  canIssueDraftCerts: boolean;
  canAcceptOpenRequests: boolean;
}

export interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'TRAINER' | 'TUTOR';
  status: 'APPROVED' | 'SUSPENDED' | 'PENDING';
  specialties: string[];
  assignedItems: string[];
  compModel: 'HOURLY' | 'COMMISSION' | 'FIXED';
  compRate: number;
  ratingAvg: number;
  attendanceRate: number;
  completedSessions: number;
  permissions: InstructorPermissions;
}

export interface ConversationMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

export interface ConversationThread {
  id: string;
  type: 'CHAT' | 'CALL_LOG' | 'COORDINATOR_NOTE';
  subject: string;
  participants: { name: string; role: string }[];
  lastMessageAt: string;
  durationSeconds?: number;
  archived: boolean;
  archiveReason?: string;
  messages: ConversationMessage[];
}

export interface CourseActivityLog {
  id: string;
  timestamp: string;
  courseTitle: string;
  cohortName: string;
  eventType: 'ENROLLMENT' | 'ATTENDANCE' | 'INTERRUPTION' | 'GRADE_CHANGE' | 'CERTIFICATE';
  actorName: string;
  details: string;
}

export interface GuardianChildLink {
  linkId: string;
  studentName: string;
  grade: string;
  relationship: string;
  status: 'APPROVED' | 'PENDING' | 'REVOKED';
  consentProof: string;
  monthlyBudgetLimitSar: number;
  requireBookingApproval: boolean;
  allowSessionRecording: boolean;
  notifyBeforeSession: boolean;
  revokeReason?: string;
}

export interface GuardianRecord {
  id: string;
  guardianName: string;
  email: string;
  phone: string;
  walletBalanceSar: number;
  totalSpentMonthSar: number;
  children: GuardianChildLink[];
}
