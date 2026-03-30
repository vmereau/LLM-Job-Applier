"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Experience = {
  _id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

type EducationItem = {
  _id: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

type ProfileData = {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  summary?: string;
  skills: string[];
  languages: string[];
  linkedinUrl?: string;
  experiences: Experience[];
  education: EducationItem[];
};

type Props = {
  initialData: ProfileData | null;
  profileId: string | null;
};

export default function ProfileForm({ initialData, profileId }: Props) {
  const router = useRouter();
  const empty: ProfileData = {
    name: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    summary: "",
    skills: [],
    languages: [],
    linkedinUrl: "",
    experiences: [],
    education: [],
  };

  const addId = <T extends object>(items: T[]): (T & { _id: string })[] =>
    items.map((item) => ({ _id: crypto.randomUUID(), ...item }));

  const [data, setData] = useState<ProfileData>(() => {
    if (!initialData) return empty;
    return {
      ...initialData,
      experiences: addId(initialData.experiences ?? []),
      education: addId(initialData.education ?? []),
    };
  });
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const update = (field: keyof ProfileData, value: unknown) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const addSkill = () => {
    if (skillInput.trim()) {
      update("skills", [...data.skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (i: number) =>
    update("skills", data.skills.filter((_, idx) => idx !== i));

  const addLang = () => {
    if (langInput.trim()) {
      update("languages", [...data.languages, langInput.trim()]);
      setLangInput("");
    }
  };

  const removeLang = (i: number) =>
    update("languages", data.languages.filter((_, idx) => idx !== i));

  const addExperience = () =>
    update("experiences", [
      ...data.experiences,
      { _id: crypto.randomUUID(), company: "", role: "", startDate: "", endDate: "", location: "", description: "" },
    ]);

  const updateExperience = (i: number, field: keyof Experience, value: string) => {
    const updated = [...data.experiences];
    updated[i] = { ...updated[i], [field]: value };
    update("experiences", updated);
  };

  const removeExperience = (i: number) =>
    update("experiences", data.experiences.filter((_, idx) => idx !== i));

  const addEducation = () =>
    update("education", [
      ...data.education,
      { _id: crypto.randomUUID(), institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" },
    ]);

  const updateEducation = (i: number, field: keyof EducationItem, value: string) => {
    const updated = [...data.education];
    updated[i] = { ...updated[i], [field]: value };
    update("education", updated);
  };

  const removeEducation = (i: number) =>
    update("education", data.education.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const url = profileId ? `/api/profiles/${profileId}` : "/api/profiles";
      const method = profileId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        if (!profileId) {
          router.push("/profiles");
        } else {
          setMessage({ type: "success", text: "Profil sauvegardé avec succès !" });
        }
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Erreur lors de la sauvegarde" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl p-6 shadow-sm border border-gray-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Import hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Import automatique :</strong> Utilisez la commande{" "}
        <code className="bg-blue-100 px-1 rounded">/import-profile</code> dans Claude Code en
        passant le chemin de votre CV PDF ou une URL LinkedIn pour importer automatiquement votre
        profil.
      </div>

      {/* Infos personnelles */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informations personnelles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom complet *</label>
            <input className={inputClass} value={data.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Titre / Poste actuel</label>
            <input className={inputClass} value={data.title ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Ex: Développeur Full Stack" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={data.email ?? ""} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input className={inputClass} value={data.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Localisation</label>
            <input className={inputClass} value={data.location ?? ""} onChange={(e) => update("location", e.target.value)} placeholder="Ex: Paris, France" />
          </div>
          <div>
            <label className={labelClass}>URL LinkedIn</label>
            <input className={inputClass} value={data.linkedinUrl ?? ""} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Résumé / À propos</label>
          <textarea className={inputClass} rows={4} value={data.summary ?? ""} onChange={(e) => update("summary", e.target.value)} placeholder="Décrivez votre profil professionnel..." />
        </div>
      </div>

      {/* Compétences */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Compétences</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.skills.map((s, i) => (
            <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              {s}
              <button type="button" onClick={() => removeSkill(i)} className="text-blue-600 hover:text-blue-900 ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputClass} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Ajouter une compétence..." />
          <button type="button" onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Ajouter</button>
        </div>
      </div>

      {/* Langues */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Langues</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.languages.map((l, i) => (
            <span key={i} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
              {l}
              <button type="button" onClick={() => removeLang(i)} className="text-green-600 hover:text-green-900 ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputClass} value={langInput} onChange={(e) => setLangInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLang())} placeholder="Ex: Français (natif), Anglais (C1)..." />
          <button type="button" onClick={addLang} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Ajouter</button>
        </div>
      </div>

      {/* Expériences */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Expériences professionnelles</h2>
          <button type="button" onClick={addExperience} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900">+ Ajouter</button>
        </div>
        <div className="space-y-4">
          {data.experiences.map((exp, i) => (
            <div key={exp._id} className="border border-gray-200 rounded-lg p-4 relative">
              <button type="button" onClick={() => removeExperience(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Entreprise *</label>
                  <input className={inputClass} value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Poste *</label>
                  <input className={inputClass} value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Lieu</label>
                  <input className={inputClass} value={exp.location ?? ""} onChange={(e) => updateExperience(i, "location", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Début</label>
                    <input className={inputClass} value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} placeholder="2022-03" />
                  </div>
                  <div>
                    <label className={labelClass}>Fin</label>
                    <input className={inputClass} value={exp.endDate ?? ""} onChange={(e) => updateExperience(i, "endDate", e.target.value)} placeholder="Présent" />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass}>Description</label>
                <textarea className={inputClass} rows={3} value={exp.description ?? ""} onChange={(e) => updateExperience(i, "description", e.target.value)} />
              </div>
            </div>
          ))}
          {data.experiences.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Aucune expérience ajoutée</p>
          )}
        </div>
      </div>

      {/* Formations */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Formations</h2>
          <button type="button" onClick={addEducation} className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-900">+ Ajouter</button>
        </div>
        <div className="space-y-4">
          {data.education.map((edu, i) => (
            <div key={edu._id} className="border border-gray-200 rounded-lg p-4 relative">
              <button type="button" onClick={() => removeEducation(i)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Établissement *</label>
                  <input className={inputClass} value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Diplôme</label>
                  <input className={inputClass} value={edu.degree ?? ""} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Domaine</label>
                  <input className={inputClass} value={edu.field ?? ""} onChange={(e) => updateEducation(i, "field", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Début</label>
                    <input className={inputClass} value={edu.startDate ?? ""} onChange={(e) => updateEducation(i, "startDate", e.target.value)} placeholder="2018" />
                  </div>
                  <div>
                    <label className={labelClass}>Fin</label>
                    <input className={inputClass} value={edu.endDate ?? ""} onChange={(e) => updateEducation(i, "endDate", e.target.value)} placeholder="2021" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.education.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Aucune formation ajoutée</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
        </button>
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
