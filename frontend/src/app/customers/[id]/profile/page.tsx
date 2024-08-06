import CustomerProfile from "@/app/components/customers-dashboard/profile/CustomerProfile";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return <CustomerProfile customerId={customerId} />;
}

export default Page;
