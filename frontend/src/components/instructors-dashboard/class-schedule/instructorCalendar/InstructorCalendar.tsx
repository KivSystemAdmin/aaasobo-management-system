import {
  getCalendarClasses,
  getInstructorProfile,
} from "@/lib/api/instructorsApi";
import { getValidRange } from "@/lib/utils/calendarUtils";
import InstructorCalendarClient from "./InstructorCalendarClient";
import {
  getAllBusinessSchedules,
  getAllEvents,
  getMessageBoardPosts,
} from "@/lib/api/adminsApi";
import { getCookie } from "../../../../proxy";

async function InstructorCalendar({
  adminId,
  instructorId,
  userSessionType,
}: {
  adminId?: number;
  instructorId: number;
  userSessionType?: UserType;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  const [classes, profile, schedule, events, messageBoardPosts] =
    await Promise.all([
      getCalendarClasses(instructorId, cookie),
      getInstructorProfile(instructorId, cookie),
      getAllBusinessSchedules(cookie),
      getAllEvents(cookie),
      getMessageBoardPosts(cookie),
    ]);

  const instructorCalendarEvents = classes;
  const createdAt: string = profile.createdAt;
  const validRange = getValidRange(createdAt, 3);

  const colorsForEvents: { event: string; color: string }[] = events
    .map((e: EventColor) => ({
      event: e.Event,
      color: e["Color Code"],
    }))
    .filter((e: { event: string; color: string }) => e.color !== "#FFFFFF"); // Filter out events with white color (#FFFFFF)

  return (
    <InstructorCalendarClient
      adminId={adminId}
      instructorId={instructorId}
      userSessionType={userSessionType}
      instructorCalendarEvents={instructorCalendarEvents}
      validRange={validRange}
      businessSchedule={schedule.organizedData}
      colorsForEvents={colorsForEvents}
      messageBoardPosts={messageBoardPosts}
    />
  );
}

export default InstructorCalendar;
