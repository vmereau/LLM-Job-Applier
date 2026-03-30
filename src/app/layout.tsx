import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Job Applier",
  description: "Trouvez des offres d'emploi adaptées à votre profil",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
