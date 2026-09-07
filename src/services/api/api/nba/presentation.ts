import type { NbaRecommendation } from "./types";

export interface NbaFallbackFact {
  label: string;
  value: string;
}

export function actionCode(actionId: string): string {
  return actionId.trim().replace(/^ACT[-_]/i, "");
}

export function actionLabel(actionId: string): string {
  const labels: Record<string, string> = {
    ACTIVATE_WINBACK: "Kích hoạt lại quan tâm",
    SEND_REENGAGEMENT_MESSAGE: "Gửi tin nhắn tái kích hoạt",
    CALL_PARENT: "Gọi cho phụ huynh",
    ADD_TAG: "Thêm tag",
    ADVISE_CAREER: "Tư vấn nghề nghiệp",
    SEND_INFORMATION: "Gửi lại thông tin",
    INVITE_EVENT: "Mời tham dự sự kiện",
    REQUEST_DOCUMENTS: "Yêu cầu bổ sung hồ sơ",
    HANDOFF: "Chuyển giao phụ trách",
  };

  const code = actionCode(actionId).toUpperCase();
  return labels[code] ?? code.replaceAll("_", " ").toLowerCase();
}

export function formatNbaChannel(value: string | null): string {
  const channel = value?.trim();
  if (!channel || channel.toUpperCase() === "NONE") return "Chưa xác định";

  const labels: Record<string, string> = {
    CALL: "Gọi điện",
    EMAIL: "Email",
    MESSAGE: "Tin nhắn",
    SMS: "Tin nhắn SMS",
    ZALO: "Zalo",
    WHATSAPP: "WhatsApp",
  };

  return labels[channel.toUpperCase()] ?? channel;
}

export function getNbaFallbackFacts(
  payload: NbaRecommendation["aiPayload"],
): NbaFallbackFact[] {
  const facts: NbaFallbackFact[] = [];
  const readString = (keys: string[]) => {
    for (const key of keys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  const timingWindow = readString(["timing_window", "timingWindow"]);
  if (timingWindow) {
    facts.push({ label: "Khung thời điểm", value: timingWindow });
  }

  const signalBand = readString([
    "score_band",
    "scoreBand",
    "signal_band",
    "signalBand",
  ]);
  if (signalBand) {
    facts.push({ label: "Mức tín hiệu", value: signalBand });
  }

  const evidenceReferences =
    payload.evidence_references ?? payload.evidenceReferences;
  if (Array.isArray(evidenceReferences) && evidenceReferences.length > 0) {
    facts.push({
      label: "Dữ kiện tham chiếu",
      value: `${evidenceReferences.length} nguồn dữ kiện liên quan`,
    });
  }

  return facts;
}

export function formatNbaDateTime(value: string | null | undefined): string {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatNbaLifecycle(value: string): string {
  const labels: Record<string, string> = {
    proposed: "Mới",
    active: "Đang mở",
    expired: "Hết hạn",
    completed: "Hoàn tất",
    dismissed: "Đã bỏ qua",
  };

  return labels[value] ?? value;
}

export function formatNbaDecisionStatus(value: string): string {
  const labels: Record<string, string> = {
    pending: "Chờ quyết định",
    accepted: "Đã chấp nhận",
    rejected: "Đã từ chối",
    deferred: "Đã trì hoãn",
    dismissed: "Đã bỏ qua",
  };

  return labels[value] ?? value;
}

export function formatNbaExecutionStatus(value: string): string {
  const labels: Record<string, string> = {
    not_started: "Chưa thực hiện",
    queued: "Đang chờ",
    in_progress: "Đang thực hiện",
    completed: "Đã thực hiện",
    failed: "Thực hiện lỗi",
  };

  return labels[value] ?? value;
}
