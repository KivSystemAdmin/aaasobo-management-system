import { getAllBusinessSchedules, getAllEvents } from "@/lib/api/adminsApi";
import { businessCalendarValidRange } from "@/lib/utils/calendarUtils";
import BusinessCalendarClient from "@/components/admins-dashboard/BusinessCalendarClient";
import { getCookie } from "../../../../proxy";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const params = await props.params;
  const instructorId = parseInt(params.id);
  if (isNaN(instructorId)) {
    throw new Error("Invalid instructorId");
  }

  // Get the cookies from the request headers
  const cookie = await getCookie();

  // Fetch all schedule and events data in parallel
  const [schedule, data] = await Promise.all([
    getAllBusinessSchedules(cookie),
    getAllEvents(cookie),
  ]);
  // Organize the event data by id and event name
  const events: BusinessEventType[] = [
    ...data.map((item: EventColor) => ({
      id: item.ID,
      name: item.Event,
      color: item["Color Code"],
    })),
  ].sort((a, b) => a.id - b.id);

  // Calculate the valid range (from 1 year ago to 1 year later) for the calendar
  const calendarValidRange = businessCalendarValidRange();

  return (
    <>
      <BusinessCalendarClient
        businessSchedule={schedule.organizedData}
        events={events}
        validRange={calendarValidRange}
      />
    </>
  );
};

export default Page;
