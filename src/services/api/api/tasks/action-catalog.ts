export interface TaskActionCatalogEntry {
  displayName: string;
  description: string;
}

export type TaskActionBadgeColor =
  | "gray"
  | "success"
  | "cyan"
  | "blue"
  | "violet"
  | "purple"
  | "rose"
  | "orange";

export interface TaskActionMetadata extends TaskActionCatalogEntry {
  color: TaskActionBadgeColor;
}

export type TaskActionCategory =
  | "CONTACT"
  | "INFORMATION"
  | "ENGAGEMENT"
  | "APPLICATION"
  | "CONVERSION"
  | "PARENT"
  | "RECOVERY"
  | "INTERNAL";

const TASK_ACTION_CATEGORY_COLORS: Record<
  TaskActionCategory,
  TaskActionBadgeColor
> = {
  CONTACT: "blue",
  INFORMATION: "cyan",
  ENGAGEMENT: "violet",
  APPLICATION: "orange",
  CONVERSION: "success",
  PARENT: "rose",
  RECOVERY: "purple",
  INTERNAL: "gray",
};

const TASK_ACTION_CODES_BY_CATEGORY: Record<
  TaskActionCategory,
  readonly string[]
> = {
  CONTACT: [
    "CALL",
    "SEND_ZALO",
    "SEND_EMAIL",
    "SEND_SMS",
    "VIDEO_CALL",
    "CALL_BACK",
    "REASSIGN_ADVISOR",
    "ESCALATE_SUPERVISOR",
  ],
  INFORMATION: [
    "SEND_MAJOR_INFO",
    "SEND_PROGRAM_INFO",
    "SEND_TUITION_INFO",
    "SEND_SCHOLARSHIP_INFO",
    "SEND_PROMOTION_INFO",
    "SEND_ADMISSION_INFO",
    "SEND_DORM_INFO",
    "SEND_CAREER_INFO",
    "SEND_BROCHURE",
    "SEND_MAJOR_VIDEO",
    "SEND_RELEVANT_FAQ",
  ],
  ENGAGEMENT: [
    "INVITE_OPEN_DAY",
    "INVITE_CAMPUS_TOUR",
    "INVITE_WEBINAR",
    "INVITE_WORKSHOP",
    "INVITE_CLASS_EXPERIENCE",
    "INVITE_STEM_EVENT",
    "INVITE_MOCK_TEST",
    "BOOK_1ON1_CONSULTATION",
    "SEND_PERSONALIZED_CONTENT",
    "SEND_TESTIMONIAL",
  ],
  APPLICATION: [
    "REMIND_APPLICATION",
    "REMIND_COMPLETE_APPLICATION",
    "REQUEST_MISSING_DOCUMENT",
    "GUIDE_NEXT_STEP",
    "CHECK_APPLICATION",
    "SEND_APPLICATION_CHECKLIST",
    "REMIND_APPLICATION_DEADLINE",
    "ASSIST_APPLICATION_FEE",
    "CONFIRM_APPLICATION_RECEIVED",
  ],
  CONVERSION: [
    "ADVISE_MAJOR",
    "ADVISE_TUITION",
    "ADVISE_SCHOLARSHIP",
    "ADVISE_CAREER",
    "ADVISE_PARENT",
    "COMPARE_MAJORS",
    "COMPARE_CAMPUSES",
    "SEND_OFFER",
    "REMIND_ENROLLMENT_DEADLINE",
    "INVITE_CAMPUS_VISIT",
    "ESCALATE_HIGH_INTENT",
  ],
  PARENT: [
    "CONTACT_PARENT",
    "SEND_PARENT_TUITION",
    "SEND_PARENT_SCHOLARSHIP",
    "SEND_TRAINING_ROADMAP",
    "SEND_PARENT_CAREER_INFO",
    "INVITE_PARENT_EVENT",
    "BOOK_PARENT_CONSULTATION",
    "SEND_FINANCIAL_PLAN",
  ],
  RECOVERY: [
    "FOLLOW_UP_SILENT_LEAD",
    "REENGAGE_LEAD",
    "ASK_DECISION_REASON",
    "SEND_OBJECTION_CONTENT",
    "ESCALATE_TO_SENIOR",
    "SCHEDULE_LATER_FOLLOWUP",
    "ADD_TO_NURTURE",
    "MARK_NOT_READY",
    "MARK_LOST",
    "ACTIVATE_WINBACK",
  ],
  INTERNAL: [
    "CREATE_TASK",
    "ASSIGN_LEAD",
    "REASSIGN_LEAD",
    "CREATE_REMINDER",
    "CREATE_APPOINTMENT",
    "CREATE_CAMPAIGN",
    "UPDATE_LEAD_STATUS",
    "UPDATE_LEAD_SCORE",
    "ADD_TAG",
    "CREATE_NOTE",
    "ESCALATE_CASE",
    "REQUEST_SUPERVISOR_REVIEW",
  ],
};

const TASK_ACTION_COLORS: Record<string, TaskActionBadgeColor> = Object.entries(
  TASK_ACTION_CODES_BY_CATEGORY,
).reduce<Record<string, TaskActionBadgeColor>>(
  (colorByCode, [category, actionCodes]) => {
    actionCodes.forEach((actionCode) => {
      colorByCode[actionCode] =
        TASK_ACTION_CATEGORY_COLORS[category as TaskActionCategory];
    });
    return colorByCode;
  },
  {},
);

/**
 * Vietnamese labels for the canonical CRM action codes.
 * Keep this catalog aligned with docs/nba-admin/79-crm-action-codes.md.
 */
export const TASK_ACTION_CATALOG: Record<string, TaskActionCatalogEntry> = {
  CALL: {
    displayName: "Gọi điện",
    description: "Gọi trực tiếp để tư vấn hoặc cập nhật tiến độ hồ sơ.",
  },
  SEND_ZALO: {
    displayName: "Nhắn tin Zalo",
    description: "Nhắn tin cho lead qua Zalo theo nội dung phù hợp.",
  },
  SEND_EMAIL: {
    displayName: "Gửi email",
    description: "Gửi email để cung cấp thông tin hoặc liên hệ lại với hồ sơ.",
  },
  SEND_SMS: {
    displayName: "Gửi tin nhắn SMS",
    description: "Gửi tin nhắn SMS để thông báo hoặc nhắc việc.",
  },
  VIDEO_CALL: {
    displayName: "Gọi video",
    description: "Tổ chức buổi tư vấn trực tuyến có hình ảnh.",
  },
  CALL_BACK: {
    displayName: "Gọi lại",
    description:
      "Gọi lại theo yêu cầu hoặc sau khi cuộc gọi trước chưa hoàn tất.",
  },
  REASSIGN_ADVISOR: {
    displayName: "Đổi tư vấn viên",
    description: "Đổi người tư vấn đang phụ trách hồ sơ.",
  },
  ESCALATE_SUPERVISOR: {
    displayName: "Chuyển lên quản lý",
    description: "Chuyển hồ sơ lên quản lý để xử lý hoặc quyết định.",
  },
  SEND_MAJOR_INFO: {
    displayName: "Gửi thông tin ngành",
    description: "Gửi thông tin tổng quan về ngành học quan tâm.",
  },
  SEND_PROGRAM_INFO: {
    displayName: "Gửi thông tin chương trình",
    description: "Gửi nội dung về chương trình đào tạo và lộ trình học.",
  },
  SEND_TUITION_INFO: {
    displayName: "Gửi thông tin học phí",
    description: "Gửi mức học phí, các khoản liên quan và cách thanh toán.",
  },
  SEND_SCHOLARSHIP_INFO: {
    displayName: "Gửi thông tin học bổng",
    description: "Gửi điều kiện, giá trị và quy trình đăng ký học bổng.",
  },
  SEND_PROMOTION_INFO: {
    displayName: "Gửi thông tin ưu đãi",
    description: "Gửi các chính sách ưu đãi hoặc hỗ trợ đang áp dụng.",
  },
  SEND_ADMISSION_INFO: {
    displayName: "Gửi thông tin tuyển sinh",
    description: "Gửi điều kiện, phương thức và mốc thời gian tuyển sinh.",
  },
  SEND_DORM_INFO: {
    displayName: "Gửi thông tin ký túc xá",
    description: "Gửi thông tin về ký túc xá, chi phí và đăng ký chỗ ở.",
  },
  SEND_CAREER_INFO: {
    displayName: "Gửi thông tin nghề nghiệp",
    description: "Gửi thông tin về cơ hội việc làm sau khi học.",
  },
  SEND_BROCHURE: {
    displayName: "Gửi tài liệu giới thiệu",
    description: "Gửi tài liệu giới thiệu trường hoặc chương trình.",
  },
  SEND_MAJOR_VIDEO: {
    displayName: "Gửi video giới thiệu ngành",
    description: "Gửi video giới thiệu ngành học.",
  },
  SEND_RELEVANT_FAQ: {
    displayName: "Gửi câu hỏi thường gặp",
    description: "Gửi các câu hỏi thường gặp theo mối quan tâm của hồ sơ.",
  },
  INVITE_OPEN_DAY: {
    displayName: "Mời ngày hội tuyển sinh",
    description: "Mời học sinh dự ngày hội tuyển sinh.",
  },
  INVITE_CAMPUS_TOUR: {
    displayName: "Mời tham quan cơ sở",
    description: "Mời học sinh hoặc phụ huynh tham quan cơ sở.",
  },
  INVITE_WEBINAR: {
    displayName: "Mời hội thảo trực tuyến",
    description: "Mời tham dự hội thảo trực tuyến phù hợp.",
  },
  INVITE_WORKSHOP: {
    displayName: "Mời hội thảo",
    description: "Mời tham dự buổi hội thảo chuyên đề.",
  },
  INVITE_CLASS_EXPERIENCE: {
    displayName: "Mời trải nghiệm lớp học",
    description:
      "Mời học sinh tham dự một buổi học thử hoặc trải nghiệm lớp học.",
  },
  INVITE_STEM_EVENT: {
    displayName: "Mời sự kiện STEM",
    description: "Mời tham dự hoạt động STEM phù hợp với mối quan tâm.",
  },
  INVITE_MOCK_TEST: {
    displayName: "Mời thi thử",
    description: "Mời tham gia kỳ thi thử hoặc bài đánh giá năng lực.",
  },
  BOOK_1ON1_CONSULTATION: {
    displayName: "Đặt lịch tư vấn riêng",
    description: "Đặt một buổi tư vấn riêng với học sinh.",
  },
  SEND_PERSONALIZED_CONTENT: {
    displayName: "Gửi nội dung phù hợp",
    description: "Gửi nội dung được chọn theo nhu cầu của hồ sơ.",
  },
  SEND_TESTIMONIAL: {
    displayName: "Gửi câu chuyện sinh viên",
    description: "Gửi câu chuyện hoặc trải nghiệm của sinh viên phù hợp.",
  },
  REMIND_APPLICATION: {
    displayName: "Nhắc nộp hồ sơ",
    description: "Nhắc học sinh bắt đầu hoặc gửi hồ sơ đăng ký.",
  },
  REMIND_COMPLETE_APPLICATION: {
    displayName: "Nhắc hoàn tất hồ sơ",
    description: "Nhắc hoàn thiện các bước còn thiếu của hồ sơ.",
  },
  REQUEST_MISSING_DOCUMENT: {
    displayName: "Yêu cầu bổ sung giấy tờ",
    description: "Yêu cầu bổ sung giấy tờ hoặc thông tin còn thiếu.",
  },
  GUIDE_NEXT_STEP: {
    displayName: "Hướng dẫn bước tiếp theo",
    description: "Hướng dẫn thao tác tiếp theo trong quy trình hồ sơ.",
  },
  CHECK_APPLICATION: {
    displayName: "Kiểm tra hồ sơ",
    description: "Kiểm tra tình trạng, tính đầy đủ hoặc tính hợp lệ của hồ sơ.",
  },
  SEND_APPLICATION_CHECKLIST: {
    displayName: "Gửi danh sách hồ sơ",
    description: "Gửi danh sách giấy tờ và việc cần chuẩn bị.",
  },
  REMIND_APPLICATION_DEADLINE: {
    displayName: "Nhắc hạn hồ sơ",
    description: "Nhắc mốc thời hạn nộp hoặc hoàn thiện hồ sơ.",
  },
  ASSIST_APPLICATION_FEE: {
    displayName: "Hỗ trợ lệ phí hồ sơ",
    description: "Hướng dẫn hoặc hỗ trợ xử lý lệ phí hồ sơ.",
  },
  CONFIRM_APPLICATION_RECEIVED: {
    displayName: "Xác nhận đã nhận hồ sơ",
    description: "Xác nhận hồ sơ đã được tiếp nhận và đang xử lý.",
  },
  ADVISE_MAJOR: {
    displayName: "Tư vấn chọn ngành",
    description: "Tư vấn ngành dựa trên sở thích, năng lực và mục tiêu.",
  },
  ADVISE_TUITION: {
    displayName: "Tư vấn học phí",
    description: "Giải thích chi phí học tập và phương án tài chính.",
  },
  ADVISE_SCHOLARSHIP: {
    displayName: "Tư vấn học bổng",
    description: "Tư vấn học bổng phù hợp và cách đăng ký.",
  },
  ADVISE_CAREER: {
    displayName: "Tư vấn nghề nghiệp",
    description: "Kết nối lựa chọn ngành với mục tiêu nghề nghiệp.",
  },
  ADVISE_PARENT: {
    displayName: "Tư vấn cho phụ huynh",
    description: "Giải đáp mối quan tâm của phụ huynh về việc nhập học.",
  },
  COMPARE_MAJORS: {
    displayName: "So sánh ngành",
    description: "Cung cấp nội dung so sánh giữa các ngành đang cân nhắc.",
  },
  COMPARE_CAMPUSES: {
    displayName: "So sánh cơ sở",
    description: "Cung cấp thông tin so sánh giữa các cơ sở đào tạo.",
  },
  SEND_OFFER: {
    displayName: "Gửi đề nghị nhập học",
    description: "Gửi đề nghị nhập học và các quyền lợi đi kèm.",
  },
  REMIND_ENROLLMENT_DEADLINE: {
    displayName: "Nhắc hạn nhập học",
    description: "Nhắc thời hạn xác nhận hoặc hoàn tất thủ tục nhập học.",
  },
  INVITE_CAMPUS_VISIT: {
    displayName: "Mời đến tham quan cơ sở",
    description: "Mời hồ sơ đến tham quan cơ sở hoặc gặp tư vấn viên.",
  },
  ESCALATE_HIGH_INTENT: {
    displayName: "Chuyển lead tiềm năng cao",
    description: "Chuyển hồ sơ có khả năng đăng ký cao cho người phù hợp.",
  },
  CONTACT_PARENT: {
    displayName: "Liên hệ phụ huynh",
    description: "Trao đổi với phụ huynh về nhu cầu, tiến độ hoặc quyết định.",
  },
  SEND_PARENT_TUITION: {
    displayName: "Gửi thông tin học phí cho phụ huynh",
    description: "Gửi thông tin học phí và phương án thanh toán cho phụ huynh.",
  },
  SEND_PARENT_SCHOLARSHIP: {
    displayName: "Gửi thông tin học bổng cho phụ huynh",
    description: "Gửi chính sách và điều kiện học bổng cho phụ huynh.",
  },
  SEND_TRAINING_ROADMAP: {
    displayName: "Gửi lộ trình đào tạo",
    description: "Gửi lộ trình học tập và các giai đoạn đào tạo.",
  },
  SEND_PARENT_CAREER_INFO: {
    displayName: "Gửi thông tin nghề nghiệp cho phụ huynh",
    description: "Gửi thông tin đầu ra và cơ hội phát triển sau chương trình.",
  },
  INVITE_PARENT_EVENT: {
    displayName: "Mời phụ huynh dự sự kiện",
    description: "Mời phụ huynh dự sự kiện tư vấn hoặc kết nối.",
  },
  BOOK_PARENT_CONSULTATION: {
    displayName: "Đặt lịch với phụ huynh",
    description: "Đặt lịch trao đổi với phụ huynh và tư vấn viên.",
  },
  SEND_FINANCIAL_PLAN: {
    displayName: "Gửi phương án tài chính",
    description: "Gửi phương án chi trả phù hợp với gia đình.",
  },
  FOLLOW_UP_SILENT_LEAD: {
    displayName: "Liên hệ lại lead chưa phản hồi",
    description: "Liên hệ lại với lead đã lâu chưa phản hồi.",
  },
  REENGAGE_LEAD: {
    displayName: "Kết nối lại với lead",
    description: "Bắt đầu lại cuộc trao đổi với lead đang ngừng tương tác.",
  },
  ASK_DECISION_REASON: {
    displayName: "Hỏi lý do chưa quyết định",
    description:
      "Tìm hiểu nguyên nhân khiến hồ sơ chưa quyết định bước tiếp theo.",
  },
  SEND_OBJECTION_CONTENT: {
    displayName: "Gửi thông tin giải đáp băn khoăn",
    description: "Gửi thông tin để giải đáp băn khoăn cụ thể.",
  },
  ESCALATE_TO_SENIOR: {
    displayName: "Chuyển tư vấn viên cấp cao",
    description: "Chuyển hồ sơ cần kinh nghiệm xử lý chuyên sâu hơn.",
  },
  SCHEDULE_LATER_FOLLOWUP: {
    displayName: "Hẹn liên hệ lại",
    description: "Hẹn thời điểm phù hợp để liên hệ lại.",
  },
  ADD_TO_NURTURE: {
    displayName: "Đưa vào chuỗi chăm sóc",
    description: "Đưa hồ sơ vào chuỗi chăm sóc theo từng giai đoạn.",
  },
  MARK_NOT_READY: {
    displayName: "Đánh dấu chưa sẵn sàng",
    description: "Ghi nhận hồ sơ hiện chưa sẵn sàng cho bước chuyển đổi.",
  },
  MARK_LOST: {
    displayName: "Đánh dấu không tiếp tục",
    description: "Ghi nhận hồ sơ không tiếp tục theo đuổi.",
  },
  ACTIVATE_WINBACK: {
    displayName: "Khôi phục tương tác với lead cũ",
    description: "Liên hệ lại với lead cũ để đưa họ trở lại quá trình tư vấn.",
  },
  CREATE_TASK: {
    displayName: "Tạo task",
    description: "Task do người dùng tạo để theo dõi một việc cụ thể.",
  },
  ASSIGN_LEAD: {
    displayName: "Giao lead",
    description: "Giao lead cho người hoặc nhóm phụ trách.",
  },
  REASSIGN_LEAD: {
    displayName: "Chuyển người phụ trách lead",
    description: "Đổi người hoặc nhóm đang phụ trách lead.",
  },
  CREATE_REMINDER: {
    displayName: "Tạo nhắc việc",
    description: "Tạo lời nhắc cho một mốc hoặc hành động trong tương lai.",
  },
  CREATE_APPOINTMENT: {
    displayName: "Tạo lịch hẹn",
    description: "Tạo lịch hẹn giữa hồ sơ và người phụ trách.",
  },
  CREATE_CAMPAIGN: {
    displayName: "Tạo chiến dịch",
    description: "Tạo chiến dịch cho một nhóm hồ sơ hoặc mục tiêu.",
  },
  UPDATE_LEAD_STATUS: {
    displayName: "Cập nhật trạng thái lead",
    description: "Cập nhật trạng thái nghiệp vụ của lead.",
  },
  UPDATE_LEAD_SCORE: {
    displayName: "Cập nhật điểm tiềm năng",
    description: "Cập nhật điểm tiềm năng của lead.",
  },
  ADD_TAG: {
    displayName: "Gắn nhãn",
    description: "Gắn nhãn để phân loại và theo dõi hồ sơ.",
  },
  CREATE_NOTE: {
    displayName: "Thêm ghi chú",
    description: "Thêm ghi chú vào hồ sơ.",
  },
  ESCALATE_CASE: {
    displayName: "Chuyển hồ sơ xử lý",
    description: "Chuyển hồ sơ hoặc vụ việc sang người phụ trách khác.",
  },
  REQUEST_SUPERVISOR_REVIEW: {
    displayName: "Yêu cầu quản lý xem xét",
    description: "Gửi yêu cầu để quản lý xem xét hướng xử lý.",
  },
};

export const TASK_ACTION_CATEGORY_LABELS: Record<
  TaskActionCategory,
  string
> = {
  CONTACT: "Liên hệ",
  INFORMATION: "Cung cấp thông tin",
  ENGAGEMENT: "Tăng tương tác",
  APPLICATION: "Hồ sơ ứng tuyển",
  CONVERSION: "Thúc đẩy quyết định",
  PARENT: "Phụ huynh",
  RECOVERY: "Tái kết nối",
  INTERNAL: "Vận hành nội bộ",
};

export interface TaskActionOption extends TaskActionCatalogEntry {
  code: string;
  category: TaskActionCategory;
  categoryLabel: string;
}

/** Ordered options for task creation, grouped by the CRM action categories. */
export const TASK_ACTION_OPTIONS: readonly TaskActionOption[] = Object.entries(
  TASK_ACTION_CODES_BY_CATEGORY,
).flatMap(([category, actionCodes]) =>
  actionCodes.map((code) => ({
    code,
    category: category as TaskActionCategory,
    categoryLabel:
      TASK_ACTION_CATEGORY_LABELS[category as TaskActionCategory],
    ...TASK_ACTION_CATALOG[code],
  })),
);

export function getTaskActionMetadata(
  actionCode?: string,
): TaskActionMetadata | undefined {
  const normalizedCode = actionCode?.trim().toUpperCase();
  const action = normalizedCode
    ? TASK_ACTION_CATALOG[normalizedCode]
    : undefined;

  return action && normalizedCode
    ? {
        ...action,
        color: TASK_ACTION_COLORS[normalizedCode] ?? "gray",
      }
    : undefined;
}
