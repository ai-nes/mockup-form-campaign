import { notFound } from "next/navigation";
import { PublicFormPage } from "../_components/public-form-page";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function SingleCampaignFormPage({ params }: PageProps) {
  const { code } = await params;

  if (!code || typeof code !== "string" || code.trim() === "") {
    notFound();
  }

  return <PublicFormPage campaignCode={code.trim()} />;
}
