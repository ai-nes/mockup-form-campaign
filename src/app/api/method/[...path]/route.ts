import { NextRequest, NextResponse } from "next/server";

const MOCK_PROVINCES = [
  { code: "HN", label: "Hà Nội", value: "Hà Nội" },
  { code: "HCM", label: "TP. Hồ Chí Minh", value: "TP. Hồ Chí Minh" },
  { code: "DN", label: "Đà Nẵng", value: "Đà Nẵng" },
  { code: "HP", label: "Hải Phòng", value: "Hải Phòng" },
  { code: "CT", label: "Cần Thơ", value: "Cần Thơ" },
  { code: "BD", label: "Bình Dương", value: "Bình Dương" },
  { code: "DNA", label: "Đồng Nai", value: "Đồng Nai" },
  { code: "TTH", label: "Thừa Thiên Huế", value: "Thừa Thiên Huế" },
  { code: "BN", label: "Bắc Ninh", value: "Bắc Ninh" },
  { code: "NA", label: "Nghệ An", value: "Nghệ An" },
  { code: "TH", label: "Thanh Hóa", value: "Thanh Hóa" },
];

const MOCK_MAJORS = [
  { code: "IT", label: "Công nghệ thông tin", value: "Công nghệ thông tin" },
  { code: "SE", label: "Kỹ thuật phần mềm", value: "Kỹ thuật phần mềm" },
  { code: "CS", label: "Khoa học máy tính", value: "Khoa học máy tính" },
  { code: "BA", label: "Quản trị kinh doanh", value: "Quản trị kinh doanh" },
  { code: "MKT", label: "Marketing & Truyền thông số", value: "Marketing & Truyền thông số" },
  { code: "GD", label: "Thiết kế đồ họa số", value: "Thiết kế đồ họa số" },
  { code: "BF", label: "Tài chính - Ngân hàng", value: "Tài chính - Ngân hàng" },
  { code: "AI", label: "Trí tuệ nhân tạo (AI)", value: "Trí tuệ nhân tạo (AI)" },
];

const MOCK_WARDS = [
  { code: "W1", label: "Phường Bến Nghé", value: "Phường Bến Nghé" },
  { code: "W2", label: "Phường Điện Biên", value: "Phường Điện Biên" },
  { code: "W3", label: "Phường Hải Châu I", value: "Phường Hải Châu I" },
  { code: "W4", label: "Phường Cầu Giấy", value: "Phường Cầu Giấy" },
  { code: "W5", label: "Phường Phú Hòa", value: "Phường Phú Hòa" },
  { code: "W6", label: "Phường An Khánh", value: "Phường An Khánh" },
  { code: "W7", label: "Phường Lạch Tray", value: "Phường Lạch Tray" },
];

const MOCK_SCHOOLS = [
  { code: "S1", label: "THPT Chu Văn An", value: "THPT Chu Văn An" },
  { code: "S2", label: "THPT Chuyên Lê Hồng Phong", value: "THPT Chuyên Lê Hồng Phong" },
  { code: "S3", label: "THPT Chuyên Hà Nội - Amsterdam", value: "THPT Chuyên Hà Nội - Amsterdam" },
  { code: "S4", label: "THPT Phan Châu Trinh", value: "THPT Phan Châu Trinh" },
  { code: "S5", label: "THPT Chuyên Hùng Vương", value: "THPT Chuyên Hùng Vương" },
  { code: "S6", label: "THPT Chuyên Lý Tự Trọng", value: "THPT Chuyên Lý Tự Trọng" },
  { code: "S7", label: "THPT Ngô Quyền", value: "THPT Ngô Quyền" },
  { code: "S8", label: "THPT Chuyên Quốc Học Huế", value: "THPT Chuyên Quốc Học Huế" },
  { code: "S9", label: "THPT Chuyên Lam Sơn", value: "THPT Chuyên Lam Sơn" },
];

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const methodPath = path.join("/");
  const targetBackend = process.env.NEXT_PUBLIC_FRAPPE_URL || "http://localhost:8001";
  const url = `${targetBackend.replace(/\/+$/, "")}/api/method/${methodPath}${req.nextUrl.search}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      if (!["host", "connection", "content-length"].includes(k.toLowerCase())) {
        headers[k] = v;
      }
    });

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    // When Frappe backend is not running or errors out:
    if (methodPath.includes("get_public_campaigns")) {
      // NO MOCK CAMPAIGNS - Return empty array if backend is down/no data
      return NextResponse.json({
        message: {
          total: 0,
          start: 0,
          page_length: 20,
          campaigns: [],
        },
      });
    }
    if (methodPath.includes("get_public_leads")) {
      return NextResponse.json({
        message: {
          total: 0,
          start: 0,
          page_length: 20,
          leads: [],
        },
      });
    }
    if (methodPath.includes("get_public_provinces")) {
      return NextResponse.json({ message: { items: MOCK_PROVINCES } });
    }
    if (methodPath.includes("get_public_wards")) {
      return NextResponse.json({ message: { items: MOCK_WARDS } });
    }
    if (methodPath.includes("get_public_high_schools")) {
      return NextResponse.json({ message: { items: MOCK_SCHOOLS } });
    }
    if (methodPath.includes("get_public_majors")) {
      return NextResponse.json({ message: { items: MOCK_MAJORS } });
    }
    if (methodPath.includes("create_public_lead")) {
      return NextResponse.json({
        message: {
          lead_code: `HS-2026-${Date.now().toString().slice(-6)}`,
          status: "success",
        },
      });
    }

    return NextResponse.json({ message: {} });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
