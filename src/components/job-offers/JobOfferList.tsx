"use client";

import { useState } from "react";
import Link from "next/link";

type StatutOffre = "nouveau" | "vu" | "repondu" | "ignore";

type JobOffer = {
  id: string;
  profileId: string;
  titre: string;
  entreprise: string;
  salaire_min: number | null;
  salaire_max: number | null;
  lieu: string;
  mots_cles: string[];
  description: string;
  lien: string;
  date_trouvee: string;
  statut: StatutOffre;
  favori: boolean;
  notes: string | null;
  profile: { name: string };
};

type Profile = {
  id: string;
  name: string;
};

const STATUT_LABELS: Record<StatutOffre, string> = {
  nouveau: "Nouveau",
  vu: "Vu",
  repondu: "Répondu",
  ignore: "Ignoré",
};

const STATUT_COLORS: Record<StatutOffre, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  vu: "bg-yellow-100 text-yellow-700",
  repondu: "bg-green-100 text-green-700",
  ignore: "bg-gray-100 text-gray-500",
};

export default function JobOfferList({
  jobOffers,
  profiles,
}: {
  jobOffers: JobOffer[];
  profiles: Profile[];
}) {
  const [filterStatut, setFilterStatut] = useState<StatutOffre | "">("");
  const [filterProfile, setFilterProfile] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filterFavoris, setFilterFavoris] = useState(false);

  const filtered = jobOffers.filter((o) => {
    if (filterStatut && o.statut !== filterStatut) return false;
    if (filterProfile && o.profileId !== filterProfile) return false;
    if (filterFavoris && !o.favori) return false;
    if (filterText) {
      const q = filterText.toLowerCase();
      const match =
        o.titre.toLowerCase().includes(q) ||
        o.entreprise.toLowerCase().includes(q) ||
        o.lieu.toLowerCase().includes(q) ||
        o.mots_cles.some((m) => m.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher (titre, entreprise, lieu, mots-clés)…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value as StatutOffre | "")}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUT_LABELS) as StatutOffre[]).map((s) => (
            <option key={s} value={s}>
              {STATUT_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={filterProfile}
          onChange={(e) => setFilterProfile(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les profils</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilterFavoris((v) => !v)}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
            filterFavoris
              ? "bg-yellow-50 border-yellow-400 text-yellow-700"
              : "bg-white border-gray-300 text-gray-600 hover:border-yellow-400 hover:text-yellow-700"
          }`}
        >
          {filterFavoris ? "★ Favoris" : "☆ Favoris"}
        </button>
      </div>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aucune offre trouvée.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((offer) => (
            <Link
              key={offer.id}
              href={`/job-offers/${offer.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 text-base leading-tight">{offer.titre}</h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  {offer.favori && (
                    <span aria-hidden="true" className="text-yellow-500 text-base leading-none select-none">★</span>
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[offer.statut]}`}
                  >
                    {STATUT_LABELS[offer.statut]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {offer.entreprise} · {offer.lieu}
              </p>
              {(offer.salaire_min !== null || offer.salaire_max !== null) && (
                <p className="text-sm text-gray-500 mb-2">
                  {offer.salaire_min !== null ? `${offer.salaire_min.toLocaleString("fr")} €` : ""}
                  {offer.salaire_min !== null && offer.salaire_max !== null ? " – " : ""}
                  {offer.salaire_max !== null ? `${offer.salaire_max.toLocaleString("fr")} €` : ""}
                </p>
              )}
              {offer.mots_cles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {offer.mots_cles.slice(0, 5).map((m, i) => (
                    <span key={`${m}-${i}`} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {m}
                    </span>
                  ))}
                  {offer.mots_cles.length > 5 && (
                    <span className="text-xs text-gray-400">+{offer.mots_cles.length - 5}</span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400">
                Profil : {offer.profile.name} ·{" "}
                {new Date(offer.date_trouvee).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
