"use client";

import { useState, useEffect } from "react";
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
  lettreMotivation: string | null;
  profile: { id: string; name: string };
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

export default function JobOfferDetail({ offer: initial }: { offer: JobOffer }) {
  const [offer, setOffer] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [toggleError, setToggleError] = useState("");
  const [toggleLoading, setToggleLoading] = useState(false);
  const [favoriLoading, setFavoriLoading] = useState(false);
  const [favoriError, setFavoriError] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const [lettre, setLettre] = useState(initial.lettreMotivation ?? "");
  const [lettreSaved, setLettreSaved] = useState(false);
  const [lettreError, setLettreError] = useState("");
  const [lettreSaving, setLettreSaving] = useState(false);

  const [ignoreLoading, setIgnoreLoading] = useState(false);
  const [ignoreError, setIgnoreError] = useState("");

  // Passe automatiquement "nouveau" → "vu" à l'ouverture
  useEffect(() => {
    if (initial.statut === "nouveau") {
      patch({ statut: "vu" }).then((updated) => setOffer(updated)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(data: Partial<{ statut: StatutOffre; favori: boolean; notes: string; lettreMotivation: string | null }>) {
    const res = await fetch(`/api/job-offers/${offer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? "Erreur réseau");
    }
    const json = await res.json();
    return json.jobOffer as JobOffer;
  }

  async function handleToggleFavori() {
    setFavoriError("");
    setFavoriLoading(true);
    try {
      const updated = await patch({ favori: !offer.favori });
      setOffer(updated);
    } catch (e) {
      setFavoriError((e as Error).message);
    } finally {
      setFavoriLoading(false);
    }
  }

  async function handleToggleRepondu() {
    setToggleError("");
    setToggleLoading(true);
    try {
      const newStatut: StatutOffre = offer.statut === "repondu" ? "vu" : "repondu";
      const updated = await patch({ statut: newStatut });
      setOffer(updated);
    } catch (e) {
      setToggleError((e as Error).message);
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleToggleIgnore() {
    setIgnoreError("");
    setIgnoreLoading(true);
    try {
      const newStatut: StatutOffre = offer.statut === "ignore" ? "vu" : "ignore";
      const updated = await patch({ statut: newStatut });
      setOffer(updated);
    } catch (e) {
      setIgnoreError((e as Error).message);
    } finally {
      setIgnoreLoading(false);
    }
  }

  async function handleSaveNotes() {
    setNotesError("");
    setNotesSaved(false);
    setNotesSaving(true);
    try {
      const updated = await patch({ notes });
      setOffer(updated);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (e) {
      setNotesError((e as Error).message);
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleSaveLettre() {
    setLettreError("");
    setLettreSaved(false);
    setLettreSaving(true);
    try {
      const updated = await patch({ lettreMotivation: lettre || null });
      setOffer(updated);
      setLettre(updated.lettreMotivation ?? "");
      setLettreSaved(true);
      setTimeout(() => setLettreSaved(false), 2500);
    } catch (e) {
      setLettreError((e as Error).message);
    } finally {
      setLettreSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (!lettre) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.setFont("helvetica");
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(lettre, 170);
      let y = 20;
      for (const line of lines as string[]) {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 6;
      }
      const slug = offer.entreprise.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      doc.save(`lettre-${slug}.pdf`);
    } catch {
      setLettreError("Erreur lors de la génération du PDF.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Retour */}
      <Link href="/job-offers" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← Retour aux offres
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{offer.titre}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleFavori}
              disabled={favoriLoading}
              aria-label={offer.favori ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={offer.favori}
              className={`text-xl leading-none transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                offer.favori
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-400 hover:text-yellow-400"
              }`}
            >
              <span aria-hidden="true">{offer.favori ? "★" : "☆"}</span>
            </button>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[offer.statut]}`}>
              {STATUT_LABELS[offer.statut]}
            </span>
          </div>
        </div>
        {favoriError && <p className="text-red-600 text-xs mb-1">{favoriError}</p>}
        <p className="text-gray-600 mb-1">
          {offer.entreprise} · {offer.lieu}
        </p>
        {(offer.salaire_min !== null || offer.salaire_max !== null) && (
          <p className="text-gray-500 text-sm mb-2">
            {offer.salaire_min !== null ? `${offer.salaire_min.toLocaleString("fr")} €` : ""}
            {offer.salaire_min !== null && offer.salaire_max !== null ? " – " : ""}
            {offer.salaire_max !== null ? `${offer.salaire_max.toLocaleString("fr")} €` : ""}
          </p>
        )}
        <p className="text-xs text-gray-400 mb-4">
          Profil associé :{" "}
          <Link href={`/profiles/${offer.profile.id}`} className="text-blue-600 hover:underline">
            {offer.profile.name}
          </Link>{" "}
          · Trouvée le {new Date(offer.date_trouvee).toLocaleDateString("fr-FR")}
        </p>

        {/* Mots-clés */}
        {offer.mots_cles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {offer.mots_cles.map((m) => (
              <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {offer.description && (
          <div className="text-sm text-gray-700 whitespace-pre-line border-t border-gray-100 pt-4 mb-4">
            {offer.description}
          </div>
        )}

        {/* Lien */}
        <a
          href={offer.lien}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Voir l&apos;annonce originale →
        </a>
      </div>

      {/* Toggle répondu */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Candidature envoyée</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {offer.statut === "repondu"
                ? "Vous avez répondu à cette annonce."
                : "Marquer cette offre comme traitée."}
            </p>
          </div>
          <button
            onClick={handleToggleRepondu}
            disabled={toggleLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              offer.statut === "repondu"
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {toggleLoading
              ? "…"
              : offer.statut === "repondu"
              ? "✓ J'ai répondu"
              : "J'ai répondu à cette annonce"}
          </button>
        </div>
        {toggleError && <p className="text-red-600 text-xs mt-2">{toggleError}</p>}
      </div>

      {/* Ignorer */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Ignorer cette offre</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {offer.statut === "ignore"
                ? "Cette offre est marquée comme ignorée."
                : "Masquer cette offre sans y répondre."}
            </p>
          </div>
          <button
            onClick={handleToggleIgnore}
            disabled={ignoreLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              offer.statut === "ignore"
                ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:opacity-50`}
          >
            {ignoreLoading
              ? "…"
              : offer.statut === "ignore"
              ? "Remettre en vue"
              : "Ignorer"}
          </button>
        </div>
        {ignoreError && <p className="text-red-600 text-xs mt-2">{ignoreError}</p>}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <p className="font-medium text-gray-900 mb-3">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
          rows={5}
          placeholder="Ajouter des notes sur cette offre…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {notesSaved ? "✓ Notes sauvegardées" : notesError ? "" : ""}
            {notesError && <span className="text-red-600">{notesError}</span>}
          </span>
          <button
            onClick={handleSaveNotes}
            disabled={notesSaving}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {notesSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Lettre de motivation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="font-medium text-gray-900 mb-3">Lettre de motivation</p>
        <textarea
          value={lettre}
          onChange={(e) => { setLettre(e.target.value); setLettreSaved(false); }}
          rows={12}
          placeholder="La lettre de motivation apparaîtra ici après génération via /generate-cover-letter…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {lettreSaved ? "✓ Lettre sauvegardée" : ""}
            {lettreError && <span className="text-red-600">{lettreError}</span>}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!lettre}
              className="px-4 py-1.5 text-sm rounded-lg font-medium transition disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-100"
            >
              Télécharger PDF
            </button>
            <button
              onClick={handleSaveLettre}
              disabled={lettreSaving || lettre === ""}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {lettreSaving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
