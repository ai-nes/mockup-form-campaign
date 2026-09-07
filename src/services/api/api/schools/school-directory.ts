import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { getDirectorMarketIntelligence } from "@/services/api/market-intelligence";
import type { MarketRegionKey } from "@/services/api/market-intelligence/types";

import type {
  PrioritySchoolReport,
  SchoolDirectoryRecord,
  SchoolRegion,
  SchoolReportData,
} from "./types";

const DIRECTORY_FILE = path.join(
  process.cwd(),
  "docs",
  "danh_sach_truong_thpt_2025_clean.csv",
);

let directoryPromise: Promise<SchoolDirectoryRecord[]> | undefined;

const CENTRAL_PROVINCES = new Set([
  "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thành phố Huế", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng",
]);

const NORTHERN_PROVINCES = new Set([
  "Hà Nội", "Hải Phòng", "Quảng Ninh", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái", "Hòa Bình", "Hoà Bình", "Thái Nguyên", "Lạng Sơn", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh", "Hưng Yên", "Hải Dương", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình",
]);

function parseCsvRow(row: string) {
  const values: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"') {
      if (inQuotes && row[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

function isHighSchool(name: string) {
  return name.toLocaleUpperCase("vi-VN").includes("THPT");
}

function canonicalSchoolCode(value: string) {
  return value.trim().padStart(3, "0");
}

async function loadDirectory() {
  const file = await readFile(DIRECTORY_FILE, "utf8");
  return file
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map(parseCsvRow)
    .filter((row) => row.length >= 10 && row[5] && row[6] && isHighSchool(row[6]))
    .map<SchoolDirectoryRecord>((row) => ({
      id: `${row[1]}-${row[3]}-${canonicalSchoolCode(row[5])}`,
      provinceCode: row[1],
      province: row[2],
      districtCode: row[3],
      district: row[4],
      schoolCode: canonicalSchoolCode(row[5]),
      name: row[6],
      address: row[7],
      area: row[8],
      isBoardingSchool: Boolean(row[9]),
    }));
}

export async function getSchoolDirectory() {
  directoryPromise ??= loadDirectory();
  return directoryPromise;
}

export function getSchoolPotentialScore(school: SchoolDirectoryRecord) {
  const seed = [...school.id].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 100_000,
    17,
  );
  return 72 + (seed % 25);
}

function getSchoolRegion(province: string): SchoolRegion {
  if (NORTHERN_PROVINCES.has(province)) return "Miền Bắc";
  if (CENTRAL_PROVINCES.has(province)) return "Miền Trung";
  return "Miền Nam";
}

const MARKET_REGION_TO_SCHOOL_REGION: Record<MarketRegionKey, SchoolRegion> = {
  all: "Miền Nam",
  north: "Miền Bắc",
  central: "Miền Trung",
  highlands: "Miền Trung",
  south: "Miền Nam",
  mekong: "Miền Nam",
};

/**
 * Priority schools sourced from the Frappe market-intelligence overview, whose
 * ids are the canonical `provinceCode-wardCode-schoolCode` that
 * `get_director_school_detail` resolves. Returns `null` when the endpoint is
 * unavailable (unauthenticated, offline) so the caller can fall back to the
 * static directory — the disjoint CSV ids 404 on the detail page.
 */
async function getPrioritySchoolsFromMarket(): Promise<PrioritySchoolReport[] | null> {
  try {
    const overview = await getDirectorMarketIntelligence({
      includeSchools: true,
      schoolLimit: 60,
    });
    const rows: PrioritySchoolReport[] = [];
    for (const province of overview.provinces) {
      const region = MARKET_REGION_TO_SCHOOL_REGION[province.regionKey] ?? "Miền Nam";
      for (const school of province.highSchools) {
        if (!school.id) continue;
        const schoolCode = school.id.split("-").at(-1) ?? "";
        const potentialSeed =
          [...school.id].reduce((total, ch) => (total * 31 + ch.charCodeAt(0)) % 100_000, 17) % 25;
        rows.push({
          school: {
            id: school.id,
            provinceCode: school.id.split("-")[0] ?? province.code,
            province: province.name,
            districtCode: "",
            district: school.district ?? "",
            schoolCode,
            name: school.name,
            address: "",
            area: "",
            isBoardingSchool: false,
          },
          region,
          potentialScore: school.potentialScore ?? 72 + potentialSeed,
          grade12Students: school.grade12Students ?? 0,
          enrollmentForecast: school.enrollmentForecast ?? 0,
        });
      }
    }
    if (rows.length === 0) return null;
    return rows
      .sort(
        (a, b) =>
          b.potentialScore - a.potentialScore ||
          b.enrollmentForecast - a.enrollmentForecast,
      )
      .slice(0, 60);
  } catch {
    return null;
  }
}

export async function getSchoolReport(): Promise<SchoolReportData> {
  const [schools, marketPriorityList] = await Promise.all([
    getSchoolDirectory(),
    getPrioritySchoolsFromMarket(),
  ]);
  const provinceMap = new Map<string, { region: SchoolRegion; scores: number[] }>();
  const regionMap = new Map<SchoolRegion, number[]>();

  for (const school of schools) {
    const score = getSchoolPotentialScore(school);
    const region = getSchoolRegion(school.province);
    const province = provinceMap.get(school.province) ?? { region, scores: [] };
    province.scores.push(score);
    provinceMap.set(school.province, province);
    regionMap.set(region, [...(regionMap.get(region) ?? []), score]);
  }

  const average = (scores: number[]) => Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
  const provinces = [...provinceMap.entries()]
    .map(([province, value]) => ({ province, region: value.region, schools: value.scores.length, prioritySchools: value.scores.filter((score) => score >= 88).length, averagePotential: average(value.scores) }))
    .sort((a, b) => b.schools - a.schools);
  const regions = (["Miền Bắc", "Miền Trung", "Miền Nam"] as SchoolRegion[]).map((region) => {
    const scores = regionMap.get(region) ?? [];
    return { region, schools: scores.length, prioritySchools: scores.filter((score) => score >= 88).length, averagePotential: average(scores) };
  });
  const priorityList =
    marketPriorityList ??
    schools
      .map((school) => {
        const potentialScore = getSchoolPotentialScore(school);
        const seed = potentialScore + school.schoolCode.charCodeAt(0);
        return { school, region: getSchoolRegion(school.province), potentialScore, grade12Students: 360 + (seed % 540), enrollmentForecast: 12 + (seed % 31) };
      })
      .sort((a, b) => b.potentialScore - a.potentialScore || b.enrollmentForecast - a.enrollmentForecast)
      .slice(0, 60);
  const allScores = schools.map(getSchoolPotentialScore);

  return { totalSchools: schools.length, totalProvinces: provinces.length, prioritySchools: allScores.filter((score) => score >= 88).length, averagePotential: average(allScores), regions, provinces, priorityList };
}

export async function getSchoolById(id: string) {
  const schools = await getSchoolDirectory();
  return schools.find((school) => school.id === id) ?? null;
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "D")
    .toLocaleLowerCase("vi-VN");
}

export async function searchSchools(query?: string) {
  const normalizedQuery = normalizeForSearch(query?.trim() ?? "");
  const schools = await getSchoolDirectory();

  if (!normalizedQuery) return schools.slice(0, 30);

  return schools
    .filter((school) =>
      normalizeForSearch(
        [school.name, school.province, school.district, school.schoolCode].join(" "),
      ).includes(normalizedQuery),
    )
    .slice(0, 50);
}
