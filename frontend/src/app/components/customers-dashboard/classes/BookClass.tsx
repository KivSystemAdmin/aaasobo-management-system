import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";
import { getChildrenByCustomerId } from "@/app/helper/childrenApi";
import BookClassForm from "@/app/components/customers-dashboard/classes/BookClassForm";
import { getClassesByCustomerId } from "@/app/helper/classesApi";
import { formatFiveMonthsLaterEndOfMonth } from "@/app/helper/dateUtils";
import Breadcrumb from "../../Breadcrumb";
import SimpleLoading from "../../SimpleLoading";

function BookClass({
  customerId,
  isAdminAuthenticated,
}: {
  customerId: string;
  isAdminAuthenticated?: boolean;
}) {
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
  }, [customerId]);

  useEffect(() => {
    const fetchRebookableClassesByCustomerId = async (customerId: string) => {
      try {
        const classes: ClassType[] = await getClassesByCustomerId(customerId);
        const rebookableClasses = classes.filter((eachClass) => {
          const fiveMonthsLaterEndOfMonth = new Date(
            formatFiveMonthsLaterEndOfMonth(eachClass.dateTime, "Asia/Tokyo"),
          );

          const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }),
          );

          return (
            (eachClass.status === "canceledByCustomer" &&
              eachClass.isRebookable) ||
            (eachClass.status === "canceledByInstructor" &&
              eachClass.isRebookable &&
              now <= fiveMonthsLaterEndOfMonth)
          );
        });

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
  }, [customerId]);

  const breadcrumbLinks = [
    { href: `/customers/${customerId}/classes`, label: "Class Calendar" },
    { label: "Book Class" },
  ];

  const isLoading = instructors === undefined || children === undefined;

  return (
    <>
      {isLoading ? (
        <SimpleLoading />
      ) : (
        <>
          <Breadcrumb links={breadcrumbLinks} />
          <BookClassForm
            customerId={customerId}
            instructors={instructors}
            classToRebook={classToRebook}
            isAdminAuthenticated={isAdminAuthenticated}
          >
            {children}
          </BookClassForm>
        </>
      )}
    </>
  );
}

export default BookClass;
