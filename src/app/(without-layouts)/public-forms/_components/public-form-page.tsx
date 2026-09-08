"use client";
 
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/tailgrids/core/card";
import { LeadForm } from "./lead-form";
import { LeadTable } from "./lead-table";
import { getPublicCampaigns } from "@/services/api/lead-mapping";
import type { PublicLeadRecord, PublicCampaignRecord } from "@/services/api/lead-mapping";

export function PublicFormPage({ campaignCode }: { campaignCode?: string }) {
  const [pendingLead, setPendingLead] = useState<PublicLeadRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaign, setCampaign] = useState<PublicCampaignRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const currentCampaignCode = (campaignCode || "CAM-2026-00001").trim();

  const checkCampaign = useCallback(async () => {
    setLoading(true);
    setIsNotFound(false);
    try {
      const campaigns = await getPublicCampaigns(currentCampaignCode);
      if (Array.isArray(campaigns) && campaigns.length > 0) {
        // Find exact match if multiple returned
        const matched = campaigns.find(
          (c) =>
            c.stable_code?.toLowerCase() === currentCampaignCode.toLowerCase() ||
            c.name?.toLowerCase() === currentCampaignCode.toLowerCase() ||
            c.code?.toLowerCase() === currentCampaignCode.toLowerCase()
        ) || campaigns[0];

        setCampaign(matched);
        setIsNotFound(false);
      } else {
        setCampaign(null);
        setIsNotFound(true);
      }
    } catch {
      // If error or no data returned
      setCampaign(null);
      setIsNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [currentCampaignCode]);

  useEffect(() => {
    checkCampaign();
  }, [checkCampaign]);

  const handleLeadCreated = useCallback((lead: PublicLeadRecord) => {
    setPendingLead(lead);
    setRefreshKey((k) => k + 1);
  }, []);

  // 1. Loading State
  if (loading) {
    return (
      <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-full border-3 border-primary-500/20 border-t-primary-500 animate-spin" />
          <span className="text-sm font-medium text-text-secondary">Đang tải thông tin form...</span>
        </div>
      </div>
    );
  }

  // 2. No Form / Not Found State
  if (isNotFound || !campaign) {
    return (
      <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="max-w-md w-full bg-background-white border border-card-border rounded-2xl p-8 shadow-sm text-center flex flex-col items-center">
          <div className="size-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy Form tuyển sinh</h2>
          <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
            Mã chiến dịch <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{currentCampaignCode}</span> không tồn tại trên hệ thống hoặc hiện chưa mở đăng ký.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
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
              Xem danh sách chiến dịch
            </Link>

            <button
              onClick={checkCampaign}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-card-border bg-white text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal Form View (Found)
  const campaignTitle = campaign.title || campaign.name || "Đăng ký Tư vấn Tuyển sinh";

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
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{campaignTitle}</h1>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">
              Chiến dịch: <span className="font-semibold text-orange-600 font-mono">{currentCampaignCode}</span> • Vui lòng để lại thông tin để được tư vấn
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
