import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatutOffre } from "@prisma/client";

const STATUTS_VALIDES: string[] = Object.values(StatutOffre);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const jobOffer = await prisma.jobOffer.findUnique({
      where: { id },
      include: { profile: { select: { id: true, name: true } } },
    });
    if (!jobOffer) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }
    return NextResponse.json({ jobOffer });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la récupération de l'offre" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const { statut, notes, lettreMotivation } = body as Record<string, unknown>;

  if (statut !== undefined && (typeof statut !== "string" || !STATUTS_VALIDES.includes(statut))) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(", ")}` },
      { status: 400 }
    );
  }

  const data: { statut?: StatutOffre; notes?: string | null; lettreMotivation?: string | null } = {};
  if (statut !== undefined) data.statut = statut as StatutOffre;
  if (notes !== undefined) data.notes = typeof notes === "string" ? notes : null;
  if (lettreMotivation !== undefined) data.lettreMotivation = typeof lettreMotivation === "string" ? lettreMotivation : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  try {
    const jobOffer = await prisma.jobOffer.update({
      where: { id },
      data,
      include: { profile: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ jobOffer });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'offre" }, { status: 500 });
  }
}
