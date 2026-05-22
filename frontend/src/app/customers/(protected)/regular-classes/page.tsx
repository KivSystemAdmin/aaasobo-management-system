import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import RegularClassesPageClient from "./RegularClassesPageClient";

export default async function Page() {
  const customerId = await getAuthenticatedUserId("customer");

  return <RegularClassesPageClient customerId={customerId} />;
}
