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
import InstructorCalendar from "../../instructors-dashboard/class-schedule/instructorCalendar/InstructorCalendar";
import InstructorDashboardClient from "@/components/admins-dashboard/instructors-dashboard/InstructorDashboardClient";
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

  let instructor = null;
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
    const [instructorData, schedulesResponse, instructorTags, tagCatalog] =
      await Promise.all([
        getInstructor(instructorId, cookie),
        getInstructorSchedules(instructorId, cookie),
        getInstructorTags(instructorId, cookie),
        getInstructorTagCatalog(cookie),
      ]);

    if ("message" in instructorData) {
      instructor = instructorData.message;
    } else {
      instructor = instructorData.instructor;
    }

    initialSchedules = schedulesResponse.schedules;
    initialInstructorTags = instructorTags;
    initialTagCatalog = tagCatalog;

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
    console.error("Failed to load instructor schedules:", error);
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
        <InstructorCalendar
          adminId={adminId}
          instructorId={instructorId}
          userSessionType={userSessionType}
        />
      }
    />
  );
}
