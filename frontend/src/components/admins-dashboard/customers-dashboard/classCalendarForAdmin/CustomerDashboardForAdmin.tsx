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

  const customerProfile = await getCustomerById(customerId, cookie);
  const childProfiles = await getChildProfiles(customerId, cookie);

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
