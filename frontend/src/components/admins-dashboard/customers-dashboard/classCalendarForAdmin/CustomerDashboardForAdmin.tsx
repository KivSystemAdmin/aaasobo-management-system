import CustomerDashboardClient from "./CustomerDashboardClient";
import ClassCalendar from "@/components/customers-dashboard/classes/ClassCalendar";
import { getChildProfiles, getCustomerById } from "@/lib/api/customersApi";
import { getCookie } from "../../../../proxy";

export default async function CustomerDashboardForAdmin({
  adminId,
  customerId,
  userSessionType,
}: {
  adminId: number;
  customerId: number;
  userSessionType: UserType;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  const [customerProfileResult, childProfilesResult] = await Promise.allSettled(
    [getCustomerById(customerId, cookie), getChildProfiles(customerId, cookie)],
  );

  if (customerProfileResult.status === "rejected") {
    throw customerProfileResult.reason;
  }

  const customerProfile = customerProfileResult.value;
  const childProfiles =
    childProfilesResult.status === "fulfilled" ? childProfilesResult.value : [];

  return (
    <CustomerDashboardClient
      adminId={adminId}
      customerId={customerId}
      userSessionType={userSessionType}
      classCalendarComponent={
        <ClassCalendar
          customerId={customerId}
          userSessionType={userSessionType}
          adminId={adminId}
        />
      }
      customerProfile={customerProfile}
      childProfiles={childProfiles}
    />
  );
}
