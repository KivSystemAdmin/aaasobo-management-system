import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import AvailabilityPageClient from "./AvailabilityPageClient";

export default async function Page() {
  const instructorId = await getAuthenticatedUserId("instructor");

  return <AvailabilityPageClient instructorId={instructorId} />;
}
