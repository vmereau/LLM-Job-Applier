import Link from "next/link";
import ProfileForm from "@/components/profile/ProfileForm";

export default function NewProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/profiles" className="text-sm text-blue-600 hover:underline">
            ← Retour aux profils
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau profil</h1>
          <p className="text-gray-500 mt-1">Créez un nouveau profil professionnel</p>
        </div>
        <ProfileForm initialData={null} profileId={null} />
      </div>
    </div>
  );
}
