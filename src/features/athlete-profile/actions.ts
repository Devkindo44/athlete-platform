"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/prisma/db";
import { requireRole } from "@/features/auth/rbac";

export type SaveAthleteProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveMyAthleteProfile(
  formData: FormData
): Promise<SaveAthleteProfileResult> {
  const session = await requireRole(["ATHLETE", "COACH", "ADMIN"]);
  const userId = Number(session.user.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return {
      ok: false,
      error: "Session invalide : identifiant utilisateur manquant.",
    };
  }

  const rawProfileId = String(formData.get("profileId") ?? "").trim();
  const profileId = rawProfileId ? Number(rawProfileId) : null;

  if (rawProfileId && (!Number.isInteger(profileId) || Number(profileId) <= 0)) {
    return { ok: false, error: "Identifiant de profil invalide." };
  }

  const sport = String(formData.get("sport") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!sport) {
    return { ok: false, error: "La discipline sportive est obligatoire." };
  }

  try {
    if (profileId) {
      const existing = await db.orm.public.AthleteProfile
        .where({ id: profileId })
        .first();

      if (!existing) {
        return { ok: false, error: "Profil athlète introuvable." };
      }

      if (existing.userId !== userId) {
        return {
          ok: false,
          error: "Vous n'êtes pas autorisé à modifier ce profil.",
        };
      }

      await db.orm.public.AthleteProfile
        .where({ id: existing.id })
        .update({
          sport,
          level: level || null,
          goal: goal || null,
          bio: bio || null,
        });

      revalidatePath(`/coach-zone/${existing.id}`);
    } else {
      await db.orm.public.AthleteProfile.create({
        userId,
        sport,
        level: level || null,
        goal: goal || null,
        bio: bio || null,
      });
    }
  } catch {
    return {
      ok: false,
      error:
        "Impossible d'enregistrer le profil (vérifiez qu'une fiche pour cette discipline n'existe pas déjà).",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/coach-zone");

  return { ok: true };
}