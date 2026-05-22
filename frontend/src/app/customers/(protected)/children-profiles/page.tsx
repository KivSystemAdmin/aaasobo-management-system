import ChildrenProfiles from "@/components/customers-dashboard/children-profiles/ChildrenProfiles";
import Breadcrumb from "@/components/elements/breadcrumb/Breadcrumb";
import { getChildProfiles, getCustomerById } from "@/lib/api/customersApi";
import { getAuthenticatedUserId } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

async function ChildrenProfilesPage() {
  const customerId = await getAuthenticatedUserId("customer");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const [customerProfile, childProfiles] = await Promise.all([
    getCustomerById(customerId, cookie),
    getChildProfiles(customerId, cookie),
  ]);

  return (
    <main>
      <Breadcrumb
        links={[
          { label: { ja: "お子さまプロフィール", en: "Children's Profiles" } },
        ]}
        className="profile"
      />
      <ChildrenProfiles
        customerId={customerId}
        childProfiles={childProfiles}
        terminationAt={customerProfile.terminationAt ?? null}
      />
    </main>
  );
}

export default ChildrenProfilesPage;
