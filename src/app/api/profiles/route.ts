import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      include: { experiences: true, education: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la récupération des profils" }, { status: 500 });
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
    const profile = await prisma.profile.create({
      data: {
        name: name.trim(),
        email: email as string | undefined,
        phone: phone as string | undefined,
        location: location as string | undefined,
        title: title as string | undefined,
        summary: summary as string | undefined,
        skills: safeSkills,
        languages: safeLanguages,
        linkedinUrl: linkedinUrl as string | undefined,
        isActive: false,
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
    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 500 });
  }
}
