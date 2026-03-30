"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Profile = {
  id: string;
  name: string;
  title?: string | null;
  email?: string | null;
  isActive: boolean;
};

type Props = {
  profiles: Profile[];
};

export default function ProfileList({ profiles }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activate = async (id: string) => {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${id}/activate`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Erreur lors de l'activation");
      } else {
        router.refresh();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoadingId(null);
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg mb-4">Aucun profil créé</p>
        <Link
          href="/profiles/new"
          className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700"
        >
          + Créer un profil
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={`bg-white rounded-xl p-5 shadow-sm border flex items-center justify-between gap-4 ${
            profile.isActive ? "border-blue-400 ring-1 ring-blue-300" : "border-gray-100"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 truncate">{profile.name}</span>
              {profile.isActive && (
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  Actif
                </span>
              )}
            </div>
            {profile.title && <p className="text-sm text-gray-500 mt-0.5 truncate">{profile.title}</p>}
            {profile.email && <p className="text-xs text-gray-400 mt-0.5 truncate">{profile.email}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!profile.isActive && (
              <button
                onClick={() => activate(profile.id)}
                disabled={loadingId === profile.id}
                className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
              >
                {loadingId === profile.id ? "..." : "Activer"}
              </button>
            )}
            <Link
              href={`/profiles/${profile.id}`}
              className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Modifier
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
