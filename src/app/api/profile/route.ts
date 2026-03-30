import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst({
      include: { experiences: true, education: true },
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la récupération du profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

  const safeSkills = Array.isArray(skills) ? skills : [];
  const safeLanguages = Array.isArray(languages) ? languages : [];
  const safeExperiences = Array.isArray(experiences) ? experiences : [];
  const safeEducation = Array.isArray(education) ? education : [];

  type ExperienceInput = { company: string; role: string; location?: string; startDate: string; endDate?: string; description?: string };
  type EducationInput = { institution: string; degree?: string; field?: string; startDate?: string; endDate?: string; description?: string };

  const expData = safeExperiences.map(({ company, role, location: loc, startDate, endDate, description }: ExperienceInput) => ({
    company, role, location: loc, startDate, endDate, description,
  }));
  const eduData = safeEducation.map(({ institution, degree, field, startDate, endDate, description }: EducationInput) => ({
    institution, degree, field, startDate, endDate, description,
  }));

  try {
    const existing = await prisma.profile.findFirst();

    let profile;
    if (existing) {
      profile = await prisma.$transaction(async (tx) => {
        await tx.experience.deleteMany({ where: { profileId: existing.id } });
        await tx.education.deleteMany({ where: { profileId: existing.id } });
        return tx.profile.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            email: email as string | undefined,
            phone: phone as string | undefined,
            location: location as string | undefined,
            title: title as string | undefined,
            summary: summary as string | undefined,
            skills: safeSkills as string[],
            languages: safeLanguages as string[],
            linkedinUrl: linkedinUrl as string | undefined,
            experiences: { create: expData },
            education: { create: eduData },
          },
          include: { experiences: true, education: true },
        });
      });
    } else {
      profile = await prisma.profile.create({
        data: {
          name: name.trim(),
          email: email as string | undefined,
          phone: phone as string | undefined,
          location: location as string | undefined,
          title: title as string | undefined,
          summary: summary as string | undefined,
          skills: safeSkills as string[],
          languages: safeLanguages as string[],
          linkedinUrl: linkedinUrl as string | undefined,
          experiences: { create: expData },
          education: { create: eduData },
        },
        include: { experiences: true, education: true },
      });
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la sauvegarde du profil" }, { status: 500 });
  }
}
