import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile/ProfileForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { experiences: true, education: true },
  });

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/profiles" className="text-sm text-blue-600 hover:underline">
            ← Retour aux profils
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 mt-1">Modifier le profil</p>
        </div>
        <ProfileForm initialData={profile} profileId={profile.id} />
      </div>
    </div>
  );
}
