"use client";

import { useActionState } from "react";
import {
  saveMyAthleteProfile,
  type SaveAthleteProfileResult,
} from "@/features/athlete-profile/actions";

export type AthleteProfileFormInitialData = {
  id: number;
  sport: string;
  level: string | null;
  goal: string | null;
  bio: string | null;
};

type AthleteProfileFormProps = {
  initialData: AthleteProfileFormInitialData | null;
};

export function AthleteProfileForm({ initialData }: AthleteProfileFormProps) {
  const [state, formAction, isPending] = useActionState<
    SaveAthleteProfileResult | null,
    FormData
  >(async (_prevState, formData) => {
    return saveMyAthleteProfile(formData);
  }, null);

  return (
    <form
      key={initialData?.id ?? "new"}
      action={formAction}
      className="space-y-4 max-w-lg"
    >
      <input
        type="hidden"
        name="profileId"
        value={initialData?.id ?? ""}
      />

      <div>
        <label htmlFor="sport" className="block text-sm font-medium mb-1">
          Discipline sportive *
        </label>
        <input
          id="sport"
          name="sport"
          type="text"
          required
          defaultValue={initialData?.sport ?? ""}
          placeholder="Ex. Course à pied, Cyclisme, Natation..."
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="level" className="block text-sm font-medium mb-1">
          Niveau
        </label>
        <select
          id="level"
          name="level"
          defaultValue={initialData?.level ?? ""}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">Sélectionner un niveau</option>
          <option value="Débutant">Débutant</option>
          <option value="Intermédiaire">Intermédiaire</option>
          <option value="Confirmé">Confirmé</option>
          <option value="Compétition">Compétition</option>
        </select>
      </div>

      <div>
        <label htmlFor="goal" className="block text-sm font-medium mb-1">
          Objectif principal
        </label>
        <input
          id="goal"
          name="goal"
          type="text"
          defaultValue={initialData?.goal ?? ""}
          placeholder="Ex. Préparer un semi-marathon sous 1h35"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1">
          Présentation / Notes
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={initialData?.bio ?? ""}
          placeholder="Disponibilités, antécédents, contraintes matérielles..."
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state?.ok === true && (
        <p className="text-sm text-green-700" role="status">
          Profil athlète enregistré avec succès.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending
          ? "Enregistrement..."
          : initialData
          ? "Mettre à jour cette discipline"
          : "Ajouter cette discipline"}
      </button>
    </form>
  );
}