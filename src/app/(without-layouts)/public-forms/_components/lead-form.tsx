"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import type { CreatePublicLeadPayload, LookupItem } from "@/services/api/lead-mapping";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectIndicator, SelectContent } from "@/components/tailgrids/core/select";
import { Label } from "@/components/tailgrids/core/label";

function getCampaignCodeFromUrl() {
  return new URLSearchParams(window.location.search).get("code")?.trim() || "";
}

export function LeadForm() {
  const router = useRouter();
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

    const campaignCode = getCampaignCodeFromUrl();
    if (!campaignCode) {
      toast.error("Không tìm thấy mã chiến dịch trong URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPublicLead({
        ...formData,
        campaign_code: campaignCode,
      } as CreatePublicLeadPayload);
      toast.success("Đăng ký thành công!");
      router.push("/public-forms/success");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi thông tin.");
      setIsSubmitting(false); // Only stop loading if error. On success, keep loading state until navigation completes.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Họ và Tên <span className="text-red-500">*</span></Label>
          <Input
            name="student_name"
            aria-label="Họ và Tên"
            placeholder="Nhập họ và tên học sinh"
            value={formData.student_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Số điện thoại <span className="text-red-500">*</span></Label>
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

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input
            name="email"
            aria-label="Email"
            type="email"
            placeholder="example@domain.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Tỉnh/Thành phố</Label>
          <Select
            aria-label="Tỉnh/Thành phố"
            placeholder="Chọn tỉnh/thành phố"
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
        <div className="flex flex-col gap-2">
          <Label>Xã/Phường/Quận/Huyện</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Trường học</Label>
          <Select
            aria-label="Trường học"
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
        <div className="flex flex-col gap-2">
          <Label>Ngành học quan tâm</Label>
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

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Gửi thông tin đăng ký
      </Button>
    </form>
  );
}
