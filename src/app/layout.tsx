import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Job Applier",
  description: "Trouvez des offres d'emploi adaptées à votre profil",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <nav className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <Link href="/" className="font-semibold text-gray-900 hover:text-blue-600">
              LLM Job Applier
            </Link>
            <Link href="/profiles" className="text-sm text-gray-600 hover:text-blue-600">
              Profils
            </Link>
            <Link href="/job-offers" className="text-sm text-gray-600 hover:text-blue-600">
              Offres
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
