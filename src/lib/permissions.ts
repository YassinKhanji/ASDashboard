import { UserRole } from "@prisma/client"

export function canReviewProjects(role: UserRole): boolean {
  return role === "ADMIN" || role === "COMMITTEE"
}

export function canSubmitProjects(role: UserRole): boolean {
  return true // All roles can submit projects
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canManageRooms(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canDeleteProjects(role: UserRole): boolean {
  return role === "ADMIN"
}

export function canViewAllProjects(role: UserRole): boolean {
  return role === "ADMIN" || role === "COMMITTEE"
}

export function canEditProject(role: UserRole, isOwner: boolean, status: string): boolean {
  if (role === "ADMIN") return true
  if (isOwner && (status === "DRAFT" || status === "REJECTED")) return true
  return false
}

// Role labels
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  COMMITTEE: "Committee",
  INSTRUCTOR: "Instructor",
}
