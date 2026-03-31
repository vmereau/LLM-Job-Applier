import JobOfferList from "@/components/job-offers/JobOfferList";

async function getJobOffers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/job-offers`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.jobOffers ?? [];
}

async function getProfiles() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/profiles`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.profiles ?? [];
}

export default async function JobOffersPage() {
  const [jobOffers, profiles] = await Promise.all([getJobOffers(), getProfiles()]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offres d&apos;emploi</h1>
        <span className="text-sm text-gray-500">{jobOffers.length} offre{jobOffers.length !== 1 ? "s" : ""}</span>
      </div>
      <JobOfferList jobOffers={jobOffers} profiles={profiles} />
    </main>
  );
}
