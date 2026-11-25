export type UserRole = 'STUDENT' | 'TRAINEE' | 'PARENT' | 'TUTOR' | 'TRAINER' | 'COORDINATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  verified?: boolean;
}

export type CourseFormat = 'IN_PERSON' | 'LIVE_ONLINE' | 'RECORDED';

export interface CourseCohort {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  schedule: string;
  seatsTotal: number;
  seatsRemaining: number;
  locationOrPlatform: string;
}

export interface CourseModule {
  title: string;
  duration: string;
  lessons: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  format: CourseFormat;
  price: number;
  originalPrice?: number;
  hours: number;
  level: string;
  rating: number;
  studentsCount: number;
  ncelAccredited: boolean;
  trainer: {
    name: string;
    title: string;
    bio: string;
    experienceYears: number;
    rating: number;
  };
  highlights: string[];
  curriculum: CourseModule[];
  cohorts: CourseCohort[];
  accent: 'teal' | 'azure' | 'amber';
}

export interface Tutor {
  id: string;
  name: string;
  title: string;
  subjects: string[];
  stages: string[];
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  sessionsCompleted: number;
  verified: boolean;
  bio: string;
  city: string;
  nextSlot: string;
  specialties: string[];
}

export interface TutoringPackage {
  id: string;
  name: string;
  hours: number;
  price: number;
  pricePerHour: number;
  savingsPercent: number;
  popular?: boolean;
  features: string[];
}

export type BookingPath = 'DIRECT' | 'OPEN_AUTO_MATCH' | 'COORDINATOR';

export interface LessonRequest {
  id: string;
  studentName: string;
  subject: string;
  stage: string;
  grade: string;
  path: BookingPath;
  preferredTime: string;
  mode: 'ONLINE' | 'IN_PERSON';
  notes?: string;
  status: 'PENDING' | 'MATCHED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  tutorName?: string;
  price: number;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'HOLD' | 'DEBIT' | 'RELEASE' | 'REFUND' | 'SETTLEMENT';
  amount: number;
  description: string;
  date: string;
  reference: string;
}

export interface CertificateRecord {
  serial: string;
  holderName: string;
  courseTitle: string;
  issueDate: string;
  hours: number;
  ncelCode: string;
  status: 'VALID' | 'REVOKED';
  grade: string;
  trainerName: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  slaRemaining: string;
  createdAt: string;
  requesterName?: string;
}

export interface ChildControls {
  monthlyBudgetLimitSar: number;
  requireBookingApproval: boolean;
  allowSessionRecording: boolean;
  notifyBeforeSession: boolean;
}

export interface ChildAccount {
  id: string;
  name: string;
  grade: string;
  stage: string;
  relation: string;
  consentVerified: boolean;
  upcomingSessions: number;
  averageScore: number;
  attendanceRate: number;
  lastReportSummary: string;
  monthlySpentSar: number;
  controls: ChildControls;
}

export type ConversationChannelType = 'CHAT' | 'CALL_LOG' | 'COORDINATOR_NOTE';

export interface ConversationMessage {
  id: string;
  senderName: string;
  senderRole: string;
  body: string;
  type: ConversationChannelType;
  createdAt: string;
  isMine?: boolean;
}

export interface ConversationThread {
  id: string;
  subject: string;
  participantName: string;
  participantRole: string;
  channelType: ConversationChannelType;
  unreadCount: number;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface SessionItem {
  id: string;
  title: string;
  subject: string;
  tutorOrTrainer: string;
  studentName?: string;
  date: string;
  time: string;
  mode: 'ONLINE' | 'IN_PERSON';
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  meetingUrl?: string;
  reportSummary?: string;
}
