import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId") ?? undefined;
    const jobOffers = await prisma.jobOffer.findMany({
      where: profileId ? { profileId } : undefined,
      include: { profile: { select: { name: true } } },
      orderBy: { date_trouvee: "desc" },
    });
    return NextResponse.json({ jobOffers });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la récupération des offres" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const {
    profileId,
    titre,
    entreprise,
    salaire_min,
    salaire_max,
    lieu,
    mots_cles,
    description,
    lien,
  } = body as Record<string, unknown>;

  if (!profileId || typeof profileId !== "string") {
    return NextResponse.json({ error: "Le champ 'profileId' est requis" }, { status: 400 });
  }
  if (!titre || typeof titre !== "string" || !titre.trim()) {
    return NextResponse.json({ error: "Le champ 'titre' est requis" }, { status: 400 });
  }
  if (!entreprise || typeof entreprise !== "string" || !entreprise.trim()) {
    return NextResponse.json({ error: "Le champ 'entreprise' est requis" }, { status: 400 });
  }
  if (!lieu || typeof lieu !== "string" || !lieu.trim()) {
    return NextResponse.json({ error: "Le champ 'lieu' est requis" }, { status: 400 });
  }
  if (!lien || typeof lien !== "string" || !lien.trim()) {
    return NextResponse.json({ error: "Le champ 'lien' est requis" }, { status: 400 });
  }

  const safeMots = Array.isArray(mots_cles)
    ? (mots_cles as unknown[]).filter((m): m is string => typeof m === "string")
    : [];

  try {
    const jobOffer = await prisma.jobOffer.create({
      data: {
        profileId,
        titre: titre.trim(),
        entreprise: entreprise.trim(),
        salaire_min: typeof salaire_min === "number" ? salaire_min : null,
        salaire_max: typeof salaire_max === "number" ? salaire_max : null,
        lieu: lieu.trim(),
        mots_cles: safeMots,
        description: typeof description === "string" ? description : "",
        lien: lien.trim(),
      },
      include: { profile: { select: { name: true } } },
    });
    return NextResponse.json({ jobOffer }, { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2003") {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la création de l'offre" }, { status: 500 });
  }
}
