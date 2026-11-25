import { db } from "@/prisma/db";
import { requireRole } from "@/features/auth/rbac";

export async function getMyAthleteProfiles() {
  const session = await requireRole(["ATHLETE", "COACH", "ADMIN"]);
  const userId = Number(session.user.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Identifiant utilisateur invalide dans la session.");
  }

  const profiles = await db.orm.public.AthleteProfile
    .where({ userId })
    .all();

  return [...profiles].sort((a, b) => Number(a.id) - Number(b.id));
}

export async function getAllAthleteProfilesWithUsers() {
  await requireRole(["COACH", "ADMIN"]);

  const profiles = await db.orm.public.AthleteProfile.all();

  if (profiles.length === 0) {
    return [];
  }

  const sortedProfiles = [...profiles].sort(
    (a, b) => Number(a.id) - Number(b.id)
  );

  const users = await db.orm.public.User.all();
  const usersById = new Map(users.map((u) => [u.id, u]));

  return sortedProfiles.map((profile) => {
    const user = usersById.get(profile.userId);
    return {
      ...profile,
      athleteName: user?.name ?? user?.username ?? "Athlète",
      athleteEmail: user?.email ?? "",
    };
  });
}

export async function getAthleteProfileById(profileId: number) {
  await requireRole(["COACH", "ADMIN"]);

  if (!Number.isInteger(profileId) || profileId <= 0) {
    return null;
  }

  const profile = await db.orm.public.AthleteProfile
    .where({ id: profileId })
    .first();

  if (!profile) {
    return null;
  }

  const user = await db.orm.public.User
    .where({ id: profile.userId })
    .first();

  return {
    ...profile,
    athleteName: user?.name ?? user?.username ?? "Athlète",
    athleteEmail: user?.email ?? "",
    athleteRole: user?.role ?? "ATHLETE",
  };
}