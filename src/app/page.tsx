import { Suspense } from "react";
import Link from "next/link";
import { auth, signOut } from "@/features/auth/auth";

async function SessionStatus() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="space-y-3">
        <p>Non connecté.</p>
        <Link href="/login" className="underline">
          Aller sur la page de connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p>
        Connecté en tant que <strong>{session.user.email}</strong> (ID :{" "}
        <code>{session.user.id}</code>, Rôle : <code>{session.user.role}</code>)
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="underline">
          /dashboard (ATHLETE / COACH / ADMIN)
        </Link>
        <Link href="/coach-zone" className="underline">
          /coach-zone (COACH / ADMIN uniquement)
        </Link>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-100"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Athlete Platform</h1>

      <Suspense fallback={<p>Chargement de la session...</p>}>
        <SessionStatus />
      </Suspense>

      <div className="flex gap-4 pt-2 border-t text-sm">
        <Link href="/login" className="underline">
          Page /login
        </Link>
        <Link href="/api/auth/session" className="underline">
          Session JSON
        </Link>
      </div>
    </main>
  );
}