import ChildrenProfiles from "@/components/customers-dashboard/children-profiles/ChildrenProfiles";
import { INVALID_CUSTOMER_ID } from "@/lib/messages/customerDashboard";
import Breadcrumb from "@/components/elements/breadcrumb/Breadcrumb";
import { getChildProfiles, getCustomerById } from "@/lib/api/customersApi";
import { getCookie } from "../../../../proxy";

async function ChildrenProfilesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const customerId = parseInt(params.id);

  if (isNaN(customerId)) {
    console.error(`Invalid customer ID: ID = ${customerId}`);
    throw new Error(INVALID_CUSTOMER_ID);
  }

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
