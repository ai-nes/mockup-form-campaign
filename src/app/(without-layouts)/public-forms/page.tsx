"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronRight } from "@tailgrids/icons";
import { getPublicCampaigns } from "@/services/api/lead-mapping";
import type { PublicCampaignRecord } from "@/services/api/lead-mapping";
import { Badge } from "@/components/tailgrids/core/badge";

export default function PublicFormsSelectorPage() {
  const [campaigns, setCampaigns] = useState<PublicCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicCampaigns();
      setCampaigns(data || []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredCampaigns = useMemo(() => {
    if (!search) return campaigns;
    const lower = search.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        c.stable_code?.toLowerCase().includes(lower) ||
        c.title?.toLowerCase().includes(lower)
    );
  }, [campaigns, search]);

  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-text-primary">Danh sách Form Tuyển sinh</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Vui lòng chọn một chiến dịch để lấy link Form đăng ký tương ứng
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-[400px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm mã hoặc tên chiến dịch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-card-border rounded-xl outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            />
          </div>
          
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-text-secondary bg-white border border-card-border rounded-xl hover:text-text-primary hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col p-6 rounded-2xl border border-card-border bg-white shadow-sm h-[200px]">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 w-32 bg-border-primary/50 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-border-primary/50 rounded-full animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-border-primary/50 rounded animate-pulse mb-4" />
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-24 bg-border-primary/50 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-border-primary/50 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-border-primary/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-border-primary/50 rounded animate-pulse" />
                <div className="mt-auto pt-4 border-t border-card-border/50">
                  <div className="h-4 w-40 bg-border-primary/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-card-border shadow-sm text-center">
            <div className="size-16 rounded-full bg-background-gray-primary border border-border-primary/80 flex items-center justify-center mb-4 text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-text-primary mb-1.5">
              {search ? "Không tìm thấy chiến dịch phù hợp" : "Hiện chưa có form tuyển sinh nào"}
            </h3>
            <p className="text-[13px] text-text-secondary max-w-md mb-6 leading-relaxed">
              {search
                ? `Không có kết quả nào khớp với từ khóa "${search}". Vui lòng thử tìm kiếm với từ khóa khác.`
                : "Hệ thống CRM hiện chưa có chiến dịch nào đang mở nhận đăng ký hoặc máy chủ chưa sẵn sàng dữ liệu."}
            </p>
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-text-secondary bg-background-gray-primary rounded-lg hover:text-text-primary transition-colors"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            ) : (
              <button
                onClick={fetchCampaigns}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Thử tải lại dữ liệu
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map((campaign, idx) => {
              const code = campaign.stable_code || campaign.code || campaign.name;
              const title = campaign.title || campaign.name;
              const desc = campaign.description || "Đăng ký nhận thông tin và tư vấn";
              const isActive = campaign.status === "ACTIVE" || !campaign.status;
              
              return (
                <Link
                  key={code || idx}
                  href={`/public-forms/${encodeURIComponent(code)}`}
                  className="group flex flex-col p-6 rounded-2xl border border-card-border bg-background-white hover:border-primary-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="bg-primary-50 border border-primary-100 text-primary-700 px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-tight">
                        {code}
                      </div>
                      {isActive ? (
                        <Badge color="success" size="sm" className="font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 border border-green-200">Đang hoạt động</Badge>
                      ) : (
                        <Badge color="gray" size="sm" className="font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5">Ngừng nhận</Badge>
                      )}
                    </div>
                    <div className="size-8 rounded-full bg-background-gray-primary flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-primary-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-[17px] font-bold text-text-primary group-hover:text-primary-600 transition-colors leading-snug">
                    {title}
                  </h2>
                  
                  <div className="flex items-center gap-2.5 mt-2.5 text-[11px] font-semibold text-text-secondary flex-wrap">
                    {campaign.start_date && (
                      <div className="flex items-center gap-1.5 bg-background-gray-primary px-2 py-1.5 rounded-md text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {campaign.start_date.slice(5)} {campaign.end_date ? `→ ${campaign.end_date.slice(5)}` : ""}
                      </div>
                    )}
                    {(campaign.campus || campaign.platform) && (
                      <div className="flex items-center gap-1.5 bg-background-gray-primary px-2 py-1.5 rounded-md text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {campaign.campus || campaign.platform}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[13px] text-text-secondary mt-3.5 mb-5 line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                  
                  <div className="mt-auto pt-3.5 border-t border-card-border/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                      <span className="font-semibold text-text-secondary/70">UTM:</span>
                      <span className="font-mono font-medium text-text-secondary">{campaign.utm_campaign || campaign.utm_source || "—"}</span>
                    </div>
                    <span className="font-bold text-[12px] text-primary-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
                      Mở Form →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
