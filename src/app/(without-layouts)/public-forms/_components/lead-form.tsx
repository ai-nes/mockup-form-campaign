"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/tailgrids/core/button";
import { Input } from "@/components/tailgrids/core/input";
import { 
  createPublicLead, 
  getPublicProvinces, 
  getPublicWards, 
  getPublicHighSchools, 
  getPublicMajors 
} from "@/services/api/lead-mapping";
import type { CreatePublicLeadPayload, LookupItem, PublicLeadRecord } from "@/services/api/lead-mapping";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectIndicator, SelectContent } from "@/components/tailgrids/core/select";
import { Label } from "@/components/tailgrids/core/label";

interface LeadFormProps {
  /** Called after a lead is successfully created, passing the submitted data */
  onLeadCreated?: (lead: PublicLeadRecord) => void;
  campaignCode?: string;
}

export function LeadForm({ onLeadCreated, campaignCode }: LeadFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePublicLeadPayload>>({
    student_name: "",
    phone: "",
    email: "",
    province: "",
    ward: "",
    high_school: "",
    major: "",
    source: "Promoter",
    assignment_priority: "normal",
    segments: ["Scholarship", "Grade 12"],
  });

  const [provinces, setProvinces] = useState<LookupItem[]>([]);
  const [wards, setWards] = useState<LookupItem[]>([]);
  const [highSchools, setHighSchools] = useState<LookupItem[]>([]);
  const [majors, setMajors] = useState<LookupItem[]>([]);

  useEffect(() => {
    getPublicProvinces()
      .then(setProvinces)
      .catch((err) => {
        console.error("Provinces API error:", err);
        toast.error("Không thể kết nối đến máy chủ để tải Tỉnh/Thành phố.");
      });
    getPublicMajors()
      .then(setMajors)
      .catch((err) => {
        console.error("Majors API error:", err);
      });
  }, []);

  useEffect(() => {
    if (!formData.province) return;

    getPublicWards(formData.province)
      .then(setWards)
      .catch((err) => {
        console.error("Wards API error:", err);
        toast.error("Lỗi khi tải danh sách Xã/Phường.");
      });
  }, [formData.province]);

  useEffect(() => {
    if (!formData.ward) return;

    getPublicHighSchools(formData.ward)
      .then(setHighSchools)
      .catch((err) => {
        console.error("High schools API error:", err);
        toast.error("Lỗi khi tải danh sách Trường học.");
      });
  }, [formData.ward]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof CreatePublicLeadPayload, val: string) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: val };
      if (name === "province") {
        next.ward = "";
        next.high_school = "";
        setWards([]);
        setHighSchools([]);
      }
      if (name === "ward") {
        next.high_school = "";
        setHighSchools([]);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name || !formData.phone) {
      toast.error("Vui lòng nhập Họ tên và Số điện thoại");
      return;
    }
    
    // validate 10 digits starting with 0
    if (!/^0\d{9}$/.test(formData.phone)) {
      toast.error("Số điện thoại không hợp lệ (cần 10 số và bắt đầu bằng 0)");
      return;
    }

    const currentCampaignCode = campaignCode || "CAM-2026-00001";

    setIsSubmitting(true);
    try {
      // Omit server-managed fields like lead_status from creation payload
      const { lead_status, ...payloadFields } = formData;
      const result = await createPublicLead({
        ...payloadFields,
        campaign_code: currentCampaignCode,
      } as CreatePublicLeadPayload);
      toast.success("Đăng ký thành công!");

      // Find friendly labels for display in table
      const selectedProvince = provinces.find((p) => (p.code || p.value) === formData.province)?.label || formData.province;
      const selectedWard = wards.find((w) => (w.code || w.value) === formData.ward)?.label || formData.ward;
      const selectedSchool = highSchools.find((s) => (s.code || s.value) === formData.high_school)?.label || formData.high_school;
      const selectedMajor = majors.find((m) => (m.code || m.value) === formData.major)?.label || formData.major;

      // Build the record for the table
      const newLead: PublicLeadRecord = {
        student_name: formData.student_name || "",
        campaign: currentCampaignCode,
        lead_status: "New",
        lead_code: result?.lead_code || result?.leadCode || `HS-2026-${Date.now().toString().slice(-6)}`,
        name: result?.name || result?.lead_code || `HS-2026-${Date.now().toString().slice(-6)}`,
        creation: new Date().toISOString().replace("T", " ").slice(0, 19),
        createdAt: new Date().toISOString(),
        phone: formData.phone,
        email: formData.email,
        province: selectedProvince,
        ward: selectedWard,
        high_school: selectedSchool,
        major: selectedMajor,
      };
      onLeadCreated?.(newLead);

      // Reset form
      setFormData({
        student_name: "",
        phone: "",
        email: "",
        province: "",
        ward: "",
        high_school: "",
        major: "",
        source: "Promoter",
        assignment_priority: "normal",
        segments: ["Scholarship", "Grade 12"],
      });
      setWards([]);
      setHighSchools([]);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Form Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-border-primary/60">
        <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">
          ✦
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary">Thông tin đăng ký</h2>
          <p className="text-[11px] text-text-secondary">Nhập đầy đủ thông tin bên dưới để được tư vấn</p>
        </div>
      </div>

      {/* Row 1: Họ và Tên & Số điện thoại */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">
            Họ và Tên <span className="text-red-500">*</span>
          </Label>
          <Input
            name="student_name"
            aria-label="Họ và Tên"
            placeholder="Nhập họ và tên"
            value={formData.student_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">
            Số điện thoại <span className="text-red-500">*</span>
          </Label>
          <Input
            name="phone"
            aria-label="Số điện thoại"
            type="tel"
            placeholder="0xxxxxxxxx"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Row 2: Email */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-text-primary">Email</Label>
        <Input
          name="email"
          aria-label="Email"
          type="email"
          placeholder="example@domain.com"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {/* Row 3: Tỉnh/Thành phố & Xã/Phường/Quận/Huyện */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">Tỉnh/Thành phố</Label>
          <Select
            aria-label="Tỉnh/Thành phố"
            placeholder="Chọn Tỉnh/Thành phố"
            value={formData.province || ""}
            onChange={(key) => handleSelectChange("province", key as string)}
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.code || p.value} id={p.code || p.value} textValue={p.label}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">Xã/Phường/Quận/Huyện</Label>
          <Select
            aria-label="Xã Phường Quận Huyện"
            placeholder="Chọn Quận/Huyện"
            value={formData.ward || ""}
            onChange={(key) => handleSelectChange("ward", key as string)}
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w.code || w.value} id={w.code || w.value} textValue={w.label}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Trường học & Ngành học */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">Trường THPT</Label>
          <Select
            aria-label="Trường THPT"
            placeholder="Chọn Trường THPT"
            value={formData.high_school || ""}
            onChange={(key) => handleSelectChange("high_school", key as string)}
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              {highSchools.map((hs) => (
                <SelectItem key={hs.code || hs.value} id={hs.code || hs.value} textValue={hs.label}>
                  {hs.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-text-primary">Ngành quan tâm</Label>
          <Select
            aria-label="Ngành học quan tâm"
            placeholder="Chọn Ngành học"
            value={formData.major || ""}
            onChange={(key) => handleSelectChange("major", key as string)}
          >
            <SelectTrigger>
              <SelectValue />
              <SelectIndicator />
            </SelectTrigger>
            <SelectContent>
              {majors.map((m) => (
                <SelectItem key={m.code || m.value} id={m.code || m.value} textValue={m.label}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full mt-2 font-semibold shadow-sm transition-all hover:opacity-95"
      >
        Gửi thông tin đăng ký
      </Button>
    </form>
  );
}

