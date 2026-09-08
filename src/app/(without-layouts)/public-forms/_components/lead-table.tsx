"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getPublicLeads } from "@/services/api/lead-mapping";
import type { PublicLeadRecord } from "@/services/api/lead-mapping";
import {
  TableRoot,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/tailgrids/core/table";
import { Badge } from "@/components/tailgrids/core/badge";
import { MOCK_INITIAL_LEADS } from "@/services/api/lead-mapping/mock-leads";

interface LeadTableProps {
  campaignCode?: string;
  pendingLead?: PublicLeadRecord | null;
  refreshKey?: number;
}

type TimeSortDir = "desc" | "asc";

function formatDate(raw?: string): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    return `${time} ${date}`;
  } catch {
    return raw;
  }
}


/** Small sort arrow icon */
function SortIcon({ dir }: { dir: TimeSortDir | null }) {
  if (!dir) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline opacity-40 ml-1">
        <path d="M5 1L8 4H2L5 1Z" fill="currentColor" />
        <path d="M5 9L2 6H8L5 9Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline ml-1">
      {dir === "asc" ? (
        <path d="M5 1L8 5H2L5 1Z" fill="currentColor" />
      ) : (
        <path d="M5 9L2 5H8L5 9Z" fill="currentColor" />
      )}
    </svg>
  );
}

export function LeadTable({ campaignCode, pendingLead, refreshKey = 0 }: LeadTableProps) {
  const [leads, setLeads] = useState<PublicLeadRecord[]>(MOCK_INITIAL_LEADS);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort state
  const [timeSortDir, setTimeSortDir] = useState<TimeSortDir>("desc");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublicLeads(campaignCode);
      if (Array.isArray(data) && data.length > 0) {
        setLeads(data);
      } else {
        setLeads((prev) => (prev.length > 0 ? prev : MOCK_INITIAL_LEADS));
      }
    } catch {
      setLeads((prev) => (prev.length > 0 ? prev : MOCK_INITIAL_LEADS));
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [campaignCode]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  useEffect(() => {
    if (!pendingLead) return;
    setLeads((prev) => {
      const exists = prev.some(
        (l) =>
          (l.lead_code && l.lead_code === pendingLead.lead_code) ||
          (l.phone && l.phone === pendingLead.phone && l.student_name === pendingLead.student_name),
      );
      if (exists) return prev;
      return [{ ...pendingLead, createdAt: new Date().toISOString() }, ...prev];
    });
  }, [pendingLead]);

  // Sorted leads
  const displayLeads = useMemo(() => {
    const result = [...leads];

    // Sort by time
    result.sort((a, b) => {
      const tA = new Date(a.createdAt || a.creation || 0).getTime();
      const tB = new Date(b.createdAt || b.creation || 0).getTime();
      return timeSortDir === "desc" ? tB - tA : tA - tB;
    });

    return result;
  }, [leads, timeSortDir]);

  const toggleTimeSort = () => {
    setTimeSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const isEmpty = displayLeads.length === 0;

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 h-11">
        <div>
          <h2 className="text-base font-semibold text-text-primary whitespace-nowrap">Danh sách học sinh đăng ký</h2>
          <p className="text-xs text-text-secondary mt-0.5 whitespace-nowrap">
            {hasFetched && !loading
              ? `${displayLeads.length} / ${leads.length} học sinh`
              : "Đang tải…"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border-primary text-text-secondary hover:bg-background-gray-primary transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            aria-label="Làm mới danh sách"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-border-primary bg-background-white shadow-xs">
        <TableRoot className="w-full text-xs" containerClassName="max-h-[calc(100vh-240px)] overflow-y-auto lead-table-scroll">
          <TableHeader className="sticky top-0 z-10 bg-background-gray-primary">
            <TableRow className="bg-background-gray-primary">
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Mã Học sinh
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Họ và Tên
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Số điện thoại
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Email
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Tỉnh / Thành phố
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Quận / Huyện / Xã
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Trường THPT
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Ngành quan tâm
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap bg-background-gray-primary">
                Chiến dịch
              </TableHead>
              <TableHead
                className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] whitespace-nowrap cursor-pointer select-none hover:text-text-primary transition-colors bg-background-gray-primary"
                onClick={toggleTimeSort}
                title={timeSortDir === "desc" ? "Đang: Mới nhất trước → Bấm để đổi" : "Đang: Cũ nhất trước → Bấm để đổi"}
              >
                Thời gian
                <SortIcon dir={timeSortDir} />
              </TableHead>
              <TableHead className="px-3.5 py-3 text-text-secondary uppercase tracking-wider text-[11px] text-center whitespace-nowrap bg-background-gray-primary">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && !hasFetched ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: 11 }).map((_, j) => (
                    <TableCell key={j} className="px-3.5 py-3 whitespace-nowrap">
                      <div className="h-3.5 bg-border-primary/50 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-text-secondary whitespace-nowrap">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-30"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                    <span className="text-xs">Chưa có dữ liệu học sinh đăng ký</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayLeads.map((lead, idx) => (
                <TableRow
                  key={lead.lead_code || lead.name || `lead-${idx}`}
                  className="hover:bg-background-gray-primary/40 transition-colors"
                >
                  <TableCell className="px-3.5 py-3 font-mono text-[11px] font-medium text-text-secondary whitespace-nowrap">
                    {lead.lead_code || lead.name || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 font-semibold text-text-primary whitespace-nowrap text-xs">
                    {lead.student_name || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                    {lead.phone || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-secondary whitespace-nowrap">
                    {lead.email || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-secondary whitespace-nowrap truncate max-w-[150px]" title={lead.province}>
                    {lead.province || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-secondary whitespace-nowrap truncate max-w-[150px]" title={lead.ward}>
                    {lead.ward || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-primary font-medium whitespace-nowrap truncate max-w-[180px]" title={lead.high_school}>
                    {lead.high_school || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 whitespace-nowrap">
                    {lead.major ? (
                      <Badge
                        color={
                          lead.major.toLowerCase().includes("software") || lead.major.toLowerCase().includes("phần mềm")
                            ? "blue"
                            : lead.major.toLowerCase().includes("intelligence") || lead.major.toLowerCase().includes("trí tuệ")
                            ? "purple"
                            : lead.major.toLowerCase().includes("data") || lead.major.toLowerCase().includes("dữ liệu")
                            ? "cyan"
                            : lead.major.toLowerCase().includes("business") || lead.major.toLowerCase().includes("kinh doanh")
                            ? "orange"
                            : "primary"
                        }
                        size="sm"
                        className="font-medium text-[11px]"
                      >
                        {lead.major}
                      </Badge>
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-100 whitespace-nowrap">
                    {lead.campaign || "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-xs text-text-secondary whitespace-nowrap">
                    {mounted ? formatDate(lead.createdAt || lead.creation) : "—"}
                  </TableCell>
                  <TableCell className="px-3.5 py-3 text-center whitespace-nowrap">
                    <Badge color="blue" size="sm">
                      {lead.lead_status || "New"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableRoot>
      </div>
    </div>
  );
}
