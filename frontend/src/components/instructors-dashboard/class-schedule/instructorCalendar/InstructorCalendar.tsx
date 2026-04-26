import { getMessageBoardPosts } from "@/lib/api/adminsApi";
import { getCookie } from "../../../../proxy";
import InstructorSlotScheduleClient from "./InstructorSlotScheduleClient";

async function InstructorCalendar({ instructorId }: { instructorId: number }) {
  const cookie = await getCookie();
  const messageBoardPosts = await getMessageBoardPosts(cookie);

  return (
    <InstructorSlotScheduleClient
      instructorId={instructorId}
      messageBoardPosts={messageBoardPosts}
    />
  );
}

export default InstructorCalendar;
