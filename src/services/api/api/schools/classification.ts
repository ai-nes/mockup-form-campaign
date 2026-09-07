import type { SchoolClassification } from "./types";

export const POTENTIAL_THRESHOLD = 60;
export const RELATIONSHIP_THRESHOLD = 60;

/** Nội dung chiến lược dùng chung cho ma trận phân loại trường. */
export const SCHOOL_CLASSIFICATION_STRATEGIES: Record<
  SchoolClassification,
  {
    summary: string;
    action: string;
    actionTitle: string;
    actionDetail: string;
  }
> = {
  "Trọng điểm": {
    summary: "Tiềm năng cao · Quan hệ mạnh",
    action: "Giữ và làm sâu quan hệ bằng thỏa thuận hợp tác dài hạn và chuỗi hoạt động cả năm.",
    actionTitle: "Giữ và làm sâu quan hệ",
    actionDetail: "Thỏa thuận hợp tác dài hạn, triển khai chuỗi hoạt động cả năm và ưu tiên suất học bổng.",
  },
  "Mở rộng": {
    summary: "Tiềm năng cao · Quan hệ yếu",
    action: "Đầu tư xây dựng quan hệ; bắt đầu bằng hoạt động chi phí thấp trước khi triển khai hoạt động lớn.",
    actionTitle: "Đầu tư xây dựng quan hệ",
    actionDetail: "Bắt đầu bằng hoạt động chi phí thấp, gây thiện cảm với giáo viên trước khi đề xuất hoạt động lớn.",
  },
  "Duy trì": {
    summary: "Tiềm năng thấp · Quan hệ mạnh",
    action: "Giữ mức tối thiểu, không mở rộng; ưu tiên hoạt động theo cụm để tiết kiệm nguồn lực.",
    actionTitle: "Giữ mức tối thiểu",
    actionDetail: "Không mở rộng đầu tư; tổ chức hoạt động theo cụm hoặc trực tuyến để chia sẻ chi phí.",
  },
  "Sàng lọc": {
    summary: "Tiềm năng thấp · Quan hệ yếu",
    action: "Giảm nguồn lực và đánh giá lại sau mỗi mùa; chỉ tham gia khi trường chủ động mời hoặc có lịch trình cụm.",
    actionTitle: "Giảm nguồn lực, đánh giá lại",
    actionDetail: "Chỉ tham gia khi trường chủ động mời hoặc khi có thể đi cùng lịch trình cụm.",
  },
};

export function classifySchool(potentialScore: number, relationshipScore: number): SchoolClassification {
  if (potentialScore >= POTENTIAL_THRESHOLD && relationshipScore >= RELATIONSHIP_THRESHOLD) return "Trọng điểm";
  if (potentialScore >= POTENTIAL_THRESHOLD) return "Mở rộng";
  if (relationshipScore >= RELATIONSHIP_THRESHOLD) return "Duy trì";
  return "Sàng lọc";
}
