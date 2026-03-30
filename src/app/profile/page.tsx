import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const profile = await prisma.profile.findFirst({
    include: { experiences: true, education: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations professionnelles</p>
        </div>
        <ProfileForm initialData={profile} />
      </div>
    </div>
  );
}
