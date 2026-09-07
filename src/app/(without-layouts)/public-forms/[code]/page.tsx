import { Card } from "@/components/tailgrids/core/card";
import { LeadForm } from "../_components/lead-form";
import Link from "next/link";
import { ArrowLeft } from "@tailgrids/icons";
import { notFound } from "next/navigation";

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

  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Navigation back */}
        <div>
          <Link 
            href="/public-forms" 
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách Form
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">Đăng ký Tư vấn Tuyển sinh</h1>
          <p className="mt-2 text-text-secondary">
            Chiến dịch: <span className="font-semibold text-text-primary">{selectedCampaign.title}</span>
          </p>
        </div>

        {/* Form Container */}
        <Card className="p-6 sm:p-8 shadow-sm border-card-border bg-background-white">
          <LeadForm campaignCode={selectedCampaign.code} campaignTitle={selectedCampaign.title} />
        </Card>

        <div className="text-center text-sm text-text-tertiary pb-8">
          Mã form public dành cho: <span className="font-medium text-text-secondary">{selectedCampaign.code}</span>
        </div>
      </div>
    </div>
  );
}
