import CustomerProfile from "@/components/customers-dashboard/profile/CustomerProfile";
import Breadcrumb from "@/components/elements/breadcrumb/Breadcrumb";
import { getCustomerById } from "@/lib/api/customersApi";
import {
  authenticateUserSession,
  getAuthenticatedUserId,
} from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";

async function CustomerProfilePage() {
  await authenticateUserSession("customer");
  const customerId = await getAuthenticatedUserId("customer");

  // Get the cookies from the request headers
  const cookie = await getCookie();

  const customerProfile = await getCustomerById(customerId, cookie);

  return (
    <main>
      <Breadcrumb
        links={[{ label: { ja: "プロフィール", en: "Profile" } }]}
        className="profile"
      />
      <CustomerProfile customerProfile={customerProfile} />
    </main>
  );
}

export default CustomerProfilePage;
