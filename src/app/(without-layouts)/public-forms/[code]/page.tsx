import { notFound, redirect } from "next/navigation";

const DEMO_CAMPAIGNS = [
  {
    code: "CAM-2026-00001",
    title: "Lead API 2026 - Website",
    utm: "lead-api-website-2026",
  },
  {
    code: "CAM-2026-00002",
    title: "Lead API 2026 - Facebook",
    utm: "lead-api-facebook-2026",
  },
  {
    code: "CAM-2026-00003",
    title: "Lead API 2026 - Open Day",
    utm: "lead-api-open-day-2026",
  },
  {
    code: "CAM-2026-00004",
    title: "Lead API 2026 - Scholarship",
    utm: "lead-api-scholarship-2026",
  },
];

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function SingleCampaignFormPage({ params }: PageProps) {
  const { code } = await params;
  const selectedCampaign = DEMO_CAMPAIGNS.find((c) => c.code === code);

  if (!selectedCampaign) {
    notFound();
  }

  redirect(`/?code=${encodeURIComponent(selectedCampaign.code)}`);
}
