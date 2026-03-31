import { redirect } from "next/navigation";
import JobOfferDetail from "@/components/job-offers/JobOfferDetail";

async function getJobOffer(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/job-offers/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.jobOffer ?? null;
}

export default async function JobOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getJobOffer(id);

  if (!offer) {
    redirect("/job-offers");
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <JobOfferDetail offer={offer} />
    </main>
  );
}
