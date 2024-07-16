import AddButton from "@/app/components/customers-dashboard/AddButton";
import React from "react";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <div>
      <div>
        <h3>Plan</h3>
        <h4>plan name</h4>
        <p>Number of monthly classes</p>
        <h4>plan name</h4>
        <p>[25-min class x 5 times a week] x 4 weeks</p>
      </div>
      <div>
        <h3>Regular Classes</h3>
        <AddButton
          linkURL={`/customers/${customerId}/dashboard/regular-classes/add-regular-class`}
          btnText="Add Regular Class"
        />
      </div>
    </div>
  );
}

export default Page;
