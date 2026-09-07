import Link from "next/link";
import { ChevronRight } from "@tailgrids/icons";

const DEMO_CAMPAIGNS = [
  {
    code: "CAM-2026-00001",
    title: "Lead API 2026 - Website",
    utm: "lead-api-website-2026",
    description: "Đăng ký tuyển sinh thông qua Website chính thức",
  },
  {
    code: "CAM-2026-00002",
    title: "Lead API 2026 - Facebook",
    utm: "lead-api-facebook-2026",
    description: "Khách hàng đăng ký thông qua mạng xã hội Facebook",
  },
  {
    code: "CAM-2026-00003",
    title: "Lead API 2026 - Open Day",
    utm: "lead-api-open-day-2026",
    description: "Học sinh tham gia sự kiện Open Day tại trường",
  },
  {
    code: "CAM-2026-00004",
    title: "Lead API 2026 - Scholarship",
    utm: "lead-api-scholarship-2026",
    description: "Đăng ký nhận thông tin xét tuyển Học bổng",
  },
];

export default function PublicFormsSelectorPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-text-primary">Danh sách Form Tuyển sinh</h1>
          <p className="mt-2 text-text-secondary">
            Vui lòng chọn một chiến dịch để lấy link Form đăng ký tương ứng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_CAMPAIGNS.map((campaign) => (
            <Link
              key={campaign.code}
              href={`/public-forms/${campaign.code}`}
              className="group flex flex-col p-6 rounded-2xl border border-card-border bg-background-white hover:border-primary-500 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-md text-xs font-semibold">
                  {campaign.code}
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-primary-500 transition-colors" />
              </div>
              
              <h2 className="text-lg font-bold text-text-primary group-hover:text-primary-600 transition-colors">
                {campaign.title}
              </h2>
              
              <p className="text-sm text-text-secondary mt-2 mb-4 line-clamp-2">
                {campaign.description}
              </p>
              
              <div className="mt-auto pt-4 border-t border-card-border/50 text-xs text-text-tertiary">
                UTM: <span className="font-medium text-text-secondary">{campaign.utm}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
