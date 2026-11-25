import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/features/auth/rbac";

async function CoachZoneContent() {
  const session = await requireRole(["COACH", "ADMIN"], "/");

  return (
    <div className="space-y-4">
      <p>
        Espace Coach / Admin actif pour <strong>{session.user.email}</strong> (
        <code>{session.user.role}</code>).
      </p>
      <Link href="/" className="underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

export default function CoachZonePage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Zone Coach</h1>
      <Suspense fallback={<p>Vérification des droits...</p>}>
        <CoachZoneContent />
      </Suspense>
    </main>
  );
}