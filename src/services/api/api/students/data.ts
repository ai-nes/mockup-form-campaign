import mockData from "./mock-data.json";
import { asMockFixture } from "../mock-fixture";
import type { Student360Data, StudentListItem } from "./types";

export const studentListData = asMockFixture<StudentListItem[]>(mockData.studentListData);
export const student360Data = asMockFixture<Student360Data>(mockData.student360Data);
