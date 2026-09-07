import {
  getSchools,
  type GetSchoolsParams,
  type SchoolListRecord,
} from "@/services/api/student-school-update";

import type { SchoolDirectoryRecord } from "./types";

export async function searchSchoolDirectory(
  query = "",
  limit = 20,
  filters: Pick<GetSchoolsParams, "province" | "ward"> = {},
): Promise<SchoolDirectoryRecord[]> {
  const response = await getSchools({
    search: query.trim() || undefined,
    limit,
    ...filters,
  });
  return response.schools.map(toSchoolDirectoryRecord);
}

function toSchoolDirectoryRecord(record: SchoolListRecord): SchoolDirectoryRecord {
  const fields = record.fields;
  const boardingType = fieldText(fields.boarding_type);

  return {
    id: record.name,
    provinceCode: fieldText(fields.province) ?? "",
    province: fieldText(fields.province) ?? "",
    districtCode: fieldText(fields.ward) ?? "",
    district: fieldText(fields.ward) ?? "",
    schoolCode: fieldText(fields.school_code) ?? record.name,
    name: fieldText(fields.school_name) ?? record.name,
    address: fieldText(fields.address) ?? "",
    area: fieldText(fields.school_area) ?? "",
    isBoardingSchool: boardingType === "Boarding School",
    phone: fieldText(fields.phone),
    email: fieldText(fields.email),
    schoolType: fieldText(fields.school_type),
    schoolTier: fieldText(fields.school_tier),
    boardingType,
    latitude: fieldNumber(fields.latitude),
    longitude: fieldNumber(fields.longitude),
  };
}

function fieldText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fieldNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
