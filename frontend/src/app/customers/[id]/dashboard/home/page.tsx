import UpcomingClassesTable from "../../../../components/customers-dashboard/home/UpcomingClassesTable";
import AddButton from "@/app/components/customers-dashboard/AddButton";

async function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <div>
      <div>
        <h1>Upcoming Classes</h1>
      </div>
      <AddButton
        linkURL={`/customers/${customerId}/dashboard/home/add-class`}
        btnText="Add Class"
      />
      <UpcomingClassesTable customerId={customerId} />
    </div>
  );
}

export default Page;
