import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: { experiences: true, education: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la récupération du profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
  }

  const {
    name,
    email,
    phone,
    location,
    title,
    summary,
    skills,
    languages,
    linkedinUrl,
    experiences,
    education,
  } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Le champ 'name' est requis" }, { status: 400 });
  }

  const safeSkills = Array.isArray(skills) ? (skills as string[]) : [];
  const safeLanguages = Array.isArray(languages) ? (languages as string[]) : [];
  const safeExperiences = Array.isArray(experiences) ? experiences : [];
  const safeEducation = Array.isArray(education) ? education : [];

  type ExperienceInput = { company: string; role: string; location?: string; startDate: string; endDate?: string; description?: string };
  type EducationInput = { institution: string; degree?: string; field?: string; startDate?: string; endDate?: string; description?: string };

  try {
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    const profile = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.experience.deleteMany({ where: { profileId: id } });
      await tx.education.deleteMany({ where: { profileId: id } });
      return tx.profile.update({
        where: { id },
        data: {
          name: (name as string).trim(),
          email: email as string | undefined,
          phone: phone as string | undefined,
          location: location as string | undefined,
          title: title as string | undefined,
          summary: summary as string | undefined,
          skills: safeSkills,
          languages: safeLanguages,
          linkedinUrl: linkedinUrl as string | undefined,
          experiences: {
            create: safeExperiences.map(({ company, role, location: loc, startDate, endDate, description }: ExperienceInput) => ({
              company, role, location: loc, startDate, endDate, description,
            })),
          },
          education: {
            create: safeEducation.map(({ institution, degree, field, startDate, endDate, description }: EducationInput) => ({
              institution, degree, field, startDate, endDate, description,
            })),
          },
        },
        include: { experiences: true, education: true },
      });
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du profil" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }
    await prisma.profile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la suppression du profil" }, { status: 500 });
  }
}
