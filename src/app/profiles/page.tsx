import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProfileList from "@/components/profile/ProfileList";

export default async function ProfilesPage() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, title: true, email: true, isActive: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes profils</h1>
            <p className="text-gray-500 mt-1">Gérez vos profils professionnels</p>
          </div>
          <Link
            href="/profiles/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
          >
            + Nouveau profil
          </Link>
        </div>
        <ProfileList profiles={profiles} />
      </div>
    </div>
  );
}
