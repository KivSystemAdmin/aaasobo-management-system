import {
  getInstructor,
  getInstructorTagCatalog,
  getInstructorTags,
  getInstructorScheduleById,
  getInstructorSchedules,
  type InstructorScheduleWithSlots,
} from "@/lib/api/instructorsApi";
import type {
  InstructorSchedule,
  InstructorTagsResponse,
  TagCatalogResponse,
} from "@shared/schemas/instructors";
import InstructorDashboardClient from "@/components/admins-dashboard/instructors-dashboard/InstructorDashboardClient";
import AdminInstructorCalendar from "./instructor-schedule/AdminInstructorCalendar";
import { getCookie } from "../../../proxy";

export default async function InstructorDashboardForAdmin({
  adminId,
  instructorId,
  userSessionType,
}: {
  adminId: number;
  instructorId: number;
  userSessionType: UserType;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  let instructor: Instructor | string = "";
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
  const extractTokenLetters = (token: string) => {
    const parts = token.split("_");
    return parts[3] ? parts[3].toLowerCase() : "";
  };
  const tokenSpecificLetters = extractTokenLetters(blobReadWriteToken || "");

  let initialSchedules: InstructorSchedule[] = [];
  let initialSelectedScheduleId: number | null = null;
  let initialSelectedSchedule: InstructorScheduleWithSlots | null = null;
  let initialInstructorTags: InstructorTagsResponse | null = null;
  let initialTagCatalog: TagCatalogResponse["tags"] = [];

  try {
    const [
      instructorResult,
      schedulesResult,
      instructorTagsResult,
      tagCatalogResult,
    ] = await Promise.allSettled([
      getInstructor(instructorId, cookie),
      getInstructorSchedules(instructorId, cookie),
      getInstructorTags(instructorId, cookie),
      getInstructorTagCatalog(cookie),
    ]);

    if (instructorResult.status === "fulfilled") {
      if ("message" in instructorResult.value) {
        instructor = instructorResult.value.message;
      } else {
        instructor = instructorResult.value.instructor;
      }
    } else {
      console.error(
        "Failed to load instructor profile:",
        instructorResult.reason,
      );
    }

    if (schedulesResult.status === "fulfilled") {
      initialSchedules = schedulesResult.value.schedules;
    } else {
      console.error(
        "Failed to load instructor schedules:",
        schedulesResult.reason,
      );
    }

    if (instructorTagsResult.status === "fulfilled") {
      initialInstructorTags = instructorTagsResult.value;
    } else {
      console.error(
        "Failed to load instructor tags:",
        instructorTagsResult.reason,
      );
    }

    if (tagCatalogResult.status === "fulfilled") {
      initialTagCatalog = tagCatalogResult.value;
    } else {
      console.error(
        "Failed to load instructor tag catalog:",
        tagCatalogResult.reason,
      );
    }

    const activeSchedule = initialSchedules.find(
      (schedule) => schedule.effectiveTo === null,
    );
    if (activeSchedule) {
      initialSelectedScheduleId = activeSchedule.id;
      const scheduleDetailResponse = await getInstructorScheduleById(
        instructorId,
        activeSchedule.id,
        cookie,
      );
      initialSelectedSchedule = scheduleDetailResponse.schedule;
    }
  } catch (error) {
    console.error("Failed to load instructor dashboard data:", error);
  }

  return (
    <InstructorDashboardClient
      adminId={adminId}
      instructorId={instructorId}
      instructor={instructor}
      token={tokenSpecificLetters}
      userSessionType={userSessionType}
      initialSchedules={initialSchedules}
      initialSelectedScheduleId={initialSelectedScheduleId}
      initialSelectedSchedule={initialSelectedSchedule}
      initialInstructorTags={initialInstructorTags}
      initialTagCatalog={initialTagCatalog}
      classScheduleComponent={
        <AdminInstructorCalendar instructorId={instructorId} />
      }
    />
  );
}
