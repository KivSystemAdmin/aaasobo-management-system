"use client";

import AddClassForm from "@/app/components/customers-dashboard/home/AddClassForm";
import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const [instructors, setInstructors] = useState<Instructor[] | undefined>([]);
  const [children, setChildren] = useState<Child[] | undefined>([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors();
        setInstructors(instructors);
      } catch (error) {
        console.error(error);
      }
    };

    fetchInstructors();
  }, []);

  useEffect(() => {
    const fetchChildrenByCustomerId = async (customerId: string) => {
      try {
        const children = await getChildrenByCustomerId(customerId);
        setChildren(children);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChildrenByCustomerId(customerId);
  }, []);

  return (
    <div>
      <div>
        <h1>Add Class</h1>
      </div>
      {instructors && children ? (
        <AddClassForm
          customerId={customerId}
          instructors={instructors}
          children={children}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default Page;
