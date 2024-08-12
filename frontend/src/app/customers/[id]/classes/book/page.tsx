"use client";

import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import BookClassForm from "@/app/components/customers-dashboard/classes/BookClassForm";
import { getClassesByCustomerId } from "@/app/helper/classesApi";

function Page({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const [instructors, setInstructors] = useState<Instructor[] | undefined>(
    undefined,
  );
  const [children, setChildren] = useState<Child[] | undefined>(undefined);
  const [classToRebook, setClassToRebook] = useState<ClassType | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const instructors = await getInstructors();
        setInstructors(instructors);
      } catch (error) {
        console.error("Failed to fetch instructors:", error);
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
        console.error("Failed to fetch children:", error);
      }
    };

    fetchChildrenByCustomerId(customerId);
  }, []);

  useEffect(() => {
    const fetchRebookableClassesByCustomerId = async (customerId: string) => {
      try {
        const classes: ClassType[] = await getClassesByCustomerId(customerId);
        const rebookableClasses = classes.filter(
          (eachClass) =>
            (eachClass.status === "canceledByCustomer" &&
              eachClass.isRebookable) ||
            (eachClass.status === "canceledByInstructor" &&
              eachClass.isRebookable),
        );
        const oldestRebookableClass = rebookableClasses.reduce(
          (oldest, current) => {
            return new Date(current.dateTime) < new Date(oldest.dateTime)
              ? current
              : oldest;
          },
        );
        setClassToRebook(oldestRebookableClass);
      } catch (error) {
        console.error("Failed to fetch rebookable classes:", error);
      }
    };

    fetchRebookableClassesByCustomerId(customerId);
  }, []);

  const isLoading = instructors === undefined || children === undefined;

  return (
    <div>
      <div>
        <h1>Book Class</h1>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <BookClassForm
          customerId={customerId}
          instructors={instructors}
          children={children}
          classToRebook={classToRebook}
        />
      )}
    </div>
  );
}

export default Page;
