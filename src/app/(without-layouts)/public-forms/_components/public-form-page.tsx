"use client";
 
import Link from "next/link";
import { useState, useCallback } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { LeadForm } from "./lead-form";
import { LeadTable } from "./lead-table";
import type { PublicLeadRecord } from "@/services/api/lead-mapping";

export function PublicFormPage({ campaignCode }: { campaignCode?: string }) {
  const [pendingLead, setPendingLead] = useState<PublicLeadRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLeadCreated = useCallback((lead: PublicLeadRecord) => {
    setPendingLead(lead);
    setRefreshKey((k) => k + 1);
  }, []);

  const currentCampaignCode = campaignCode || "CAM-2026-00001";

  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-6 px-4 sm:px-6 lg:px-8">
      {/* Back button & Page title */}
      <div className="max-w-[1750px] mx-auto mb-4">
        <div className="flex items-center justify-between relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border-primary bg-white text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors shadow-xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tất cả chiến dịch
          </Link>

          <div className="text-center flex-1 pr-24">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Đăng ký Tư vấn Tuyển sinh</h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Chiến dịch: <span className="font-semibold text-orange-600">{currentCampaignCode}</span> • Vui lòng để lại thông tin để được tư vấn
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full max-w-[1750px] mx-auto">
        {/* Left: Form - 460px/480px width gives spacious, non-truncated inputs and clean UI/UX */}
        <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 pt-0 lg:pt-[56px]">
          <Card className="p-5 sm:p-6 shadow-sm border-card-border bg-background-white sticky top-4">
            <LeadForm onLeadCreated={handleLeadCreated} campaignCode={currentCampaignCode} />
          </Card>
        </div>

        {/* Right: Table */}
        <div className="flex-1 min-w-0 w-full">
          <LeadTable
            campaignCode={currentCampaignCode}
            pendingLead={pendingLead}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
