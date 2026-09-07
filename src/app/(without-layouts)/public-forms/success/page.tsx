import Link from "next/link";
import { buttonStyles } from "@/components/tailgrids/core/button-styles";
import { cn } from "@/utils/cn";

export default function SuccessPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex justify-center items-center">
      <div className="w-full max-w-lg bg-background-white p-8 rounded-2xl shadow-sm border border-card-border text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary">Đăng ký thành công!</h1>
        
        <p className="text-text-secondary">
          Cảm ơn bạn đã để lại thông tin. Bộ phận tư vấn tuyển sinh của chúng tôi đã nhận được yêu cầu và sẽ liên hệ với bạn trong thời gian sớm nhất.
        </p>

        <div className="mt-4 pt-6 border-t border-card-border w-full">
          <Link
            href="/public-forms"
            className={cn(
              buttonStyles({ variant: "primary", appearance: "outline" }),
              "w-full",
            )}
          >
            Quay lại trang chiến dịch
          </Link>
        </div>
      </div>
    </div>
  );
}
