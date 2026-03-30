import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">LLM Job Applier</h1>
        <p className="text-gray-600 text-lg mb-8">
          Votre assistant personnel pour trouver des offres d&apos;emploi adaptées à votre profil.
        </p>
        <Link
          href="/profiles"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Gérer mes profils →
        </Link>
      </div>
    </div>
  );
}
