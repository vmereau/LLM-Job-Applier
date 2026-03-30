import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const profile = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.profile.updateMany({ data: { isActive: false } });
      return tx.profile.update({
        where: { id },
        data: { isActive: true },
        include: { experiences: true, education: true },
      });
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'activation du profil" }, { status: 500 });
  }
}
