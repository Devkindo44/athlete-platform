import { redirect } from "next/navigation";
import { auth } from "./auth";

export type UserRole = "MEMBER" | "ATHLETE" | "COACH" | "ADMIN";

export function hasRole(
  userRole: string | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(
  allowedRoles: UserRole[],
  unauthorizedRedirectTo = "/"
) {
  const session = await requireSession();

  if (!hasRole(session.user.role, allowedRoles)) {
    redirect(unauthorizedRedirectTo);
  }

  return session;
}