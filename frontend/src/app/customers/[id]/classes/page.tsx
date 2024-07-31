"use client";

import UpcomingClassesTable from "@/app/components/customers-dashboard/classes/UpcomingClassesTable";
import RedirectButton from "@/app/components/RedirectButton";
import { getClassesByCustomerId } from "@/app/helper/classesApi";
import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const [classes, setClasses] = useState<ClassType[] | undefined>(undefined);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const fetchedClasses = await getClassesByCustomerId(customerId);
        setClasses(fetchedClasses);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      }
    };

    fetchClasses();
  }, [customerId]);

  return (
    <div>
      <div>
        <h1>Class Calendar</h1>
      </div>

      <RedirectButton
        linkURL={`/customers/${customerId}/classes/book`}
        btnText="Book Class"
        Icon={PlusIcon}
        className="bookBtn"
      />

      {classes ? (
        // TODO: Display the customer's classes using the calendar component
        <UpcomingClassesTable customerId={customerId} classes={classes} />
      ) : (
        <div>Loading ...</div>
      )}
    </div>
  );
}

export default Page;
