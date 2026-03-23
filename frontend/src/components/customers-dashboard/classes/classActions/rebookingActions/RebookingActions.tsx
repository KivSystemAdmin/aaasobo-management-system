import { getChildProfiles, getRebookableClasses } from "@/lib/api/customersApi";
import RebookingModalController from "./rebookingModalController/RebookingModalController";
import RebookingForm from "./rebookingForm/RebookingForm";
import { getInstructorProfiles } from "@/lib/api/instructorsApi";
import { getCookie } from "../../../../../proxy";

export default async function RebookingActions({
  userSessionType,
  customerId,
  terminationAt,
  adminId,
}: {
  userSessionType?: UserType;
  customerId: number;
  terminationAt: string | null;
  adminId?: number;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  const [rebookableClasses, instructorProfiles, childProfiles] =
    await Promise.all([
      getRebookableClasses(customerId, cookie),
      getInstructorProfiles(cookie),
      getChildProfiles(customerId, cookie),
    ]);

  const hasChildProfile = childProfiles.length > 0;

  return (
    <RebookingModalController
      rebookableClasses={rebookableClasses}
      hasChildProfile={hasChildProfile}
      userSessionType={userSessionType}
      terminationAt={terminationAt}
      modalContent={
        <RebookingForm
          customerId={customerId}
          rebookableClasses={rebookableClasses}
          instructorProfiles={instructorProfiles}
          childProfiles={childProfiles}
          userSessionType={userSessionType}
          adminId={adminId}
        />
      }
    />
  );
}
