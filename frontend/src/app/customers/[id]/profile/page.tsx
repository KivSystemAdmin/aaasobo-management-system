import CustomerProfile from "@/app/components/customers-dashboard/profile/CustomerProfile";
import styles from "./page.module.scss";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <>
      <div className={styles.pageTitle}>Customer Profile</div>
      <CustomerProfile customerId={customerId} />
    </>
  );
}

export default Page;
