import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@/features/auth/rbac";

async function DashboardContent() {
  const session = await requireRole(["ATHLETE", "COACH", "ADMIN"]);

  return (
    <div className="space-y-4">
      <p>
        Accès autorisé pour <strong>{session.user.email}</strong> avec le rôle{" "}
        <code>{session.user.role}</code>.
      </p>
      <Link href="/" className="underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Athlète</h1>
      <Suspense fallback={<p>Vérification des droits...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}