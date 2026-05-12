import { ProjectStatus, ProjectType, EnrollmentStatus, AttendanceStatus, StaffRole, MessageTag, ReviewActionType } from "@prisma/client"

// ─── Date Formatting ────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// ─── Currency ───────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount)
}

// ─── Labels ─────────────────────────────────────────────

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  DRAFT: "var(--status-draft)",
  SUBMITTED: "var(--status-submitted)",
  UNDER_REVIEW: "var(--status-review)",
  APPROVED: "var(--status-approved)",
  REJECTED: "var(--status-rejected)",
  ACTIVE: "var(--status-active)",
  COMPLETED: "var(--status-completed)",
  ARCHIVED: "var(--status-archived)",
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  WORKSHOP: "Workshop",
  COURSE: "Course",
  ACTIVITY: "Activity",
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  CONFIRMED: "Confirmed",
  WAITLIST: "Waitlist",
  CANCELLED: "Cancelled",
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  LEAD: "Lead Instructor",
  CO_INSTRUCTOR: "Co-Instructor",
  HELPER: "Helper",
}

export const MESSAGE_TAG_LABELS: Record<MessageTag, string> = {
  QUESTION: "Question",
  FEEDBACK: "Feedback",
  DECISION: "Decision",
  ACTION_ITEM: "Action Item",
}

export const REVIEW_ACTION_LABELS: Record<ReviewActionType, string> = {
  APPROVE: "Approved",
  REJECT: "Rejected",
  REQUEST_REVISION: "Revision Requested",
}

// ─── Utilities ──────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function calculateAge(dateOfBirth: Date | string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
