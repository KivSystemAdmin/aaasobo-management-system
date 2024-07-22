import AddChildForm from "@/app/components/customers-dashboard/children-profiles/AddChildForm";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <div>
      <div>
        <h1>Add Child</h1>
      </div>
      <AddChildForm customerId={customerId} />
    </div>
  );
}

export default Page;
