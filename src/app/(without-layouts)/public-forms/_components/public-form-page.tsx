import { Card } from "@/components/tailgrids/core/card";
import { LeadForm } from "./lead-form";

export function PublicFormPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-background-gray-primary py-12 px-4 flex justify-center">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">Đăng ký Tư vấn Tuyển sinh</h1>
          <p className="mt-2 text-text-secondary">
            Vui lòng để lại thông tin, bộ phận tư vấn sẽ liên hệ với bạn sớm nhất.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm border-card-border bg-background-white">
          <LeadForm />
        </Card>
      </div>
    </div>
  );
}
