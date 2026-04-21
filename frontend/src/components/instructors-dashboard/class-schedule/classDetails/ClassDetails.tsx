"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/utils/dateUtils";
import ClassDetailsCard from "@/components/instructors-dashboard/class-schedule/classDetails/classDetailsCard/ClassDetailsCard";
import styles from "./ClassDetails.module.scss";
import Breadcrumb from "../../../elements/breadcrumb/Breadcrumb";
import ClassItem from "./classItem/ClassItem";
import ClassItemForAdmin from "./classItem/ClassItemForAdmin";

function ClassDetails({
  instructorId,
  classId,
  classDetails,
  classes,
  adminId,
  userSessionType,
  previousPage,
}: ClassDetailsProps) {
  const [isUpdatingData, setIsUpdatingData] = useState<boolean>(false);

  const firstClassDateTime = new Date(classes[0].dateTime);
  const classesDate = formatShortDate(
    firstClassDateTime,
    "en-US",
    "Asia/Tokyo",
  );

  // Set the breadcrumb href and labels based on the previous page
  let breadcrumbHref: string = "";
  let label1: string = "";
  let label2: string = "";
  switch (previousPage) {
    case "instructor-calendar": // Instructor dashboard calendar page
      breadcrumbHref = "/instructors/class-schedule";
      label1 = "Class Schedule";
      label2 = "Class Details";
      break;
    case "class-calendar": // Admin dashboard calendar page
      if (userSessionType === "admin" && adminId) {
        breadcrumbHref = "/admins/calendar";
        label1 = "Class Calendar";
        label2 = `Class Details Page (Instructor: ${classDetails.instructorName})`;
      }
      break;
    case "class-list": // Admin dashboard class list page
      if (userSessionType === "admin" && adminId) {
        breadcrumbHref = "/admins/class-list";
        label1 = "Class List";
        label2 = `Class Details Page (Instructor: ${classDetails.instructorName})`;
      }
      break;
    case "instructor-list": // Admin dashboard instructor list page
      if (userSessionType === "admin" && adminId) {
        breadcrumbHref = "/admins/instructor-list";
        label1 = "Instructor List";
        label2 = `Class Details Page (Instructor: ${classDetails.instructorName})`;
        // Set the active tab to the instructor calendar tab.
        localStorage.setItem("activeInstructorTab", "0");
      }
      break;
    default:
      breadcrumbHref = "/admins/login"; // Default to login page if no previous page is specified
      label1 = "Login";
      label2 = "Unknown";
      break;
  }

  return (
    <div className={styles.classDetails}>
      <Breadcrumb
        links={[{ href: breadcrumbHref, label: label1 }, { label: label2 }]}
      />

      <main className={styles.classDetails__container}>
        <div className={styles.classItems}>
          <h3 className={styles.classItems__title}>
            Classes on <span>{classesDate}</span> <span>(JP time)</span>
          </h3>
          <ul className={styles.classItems__list}>
            {classes.length > 0 ? (
              classes.map((classItem) =>
                userSessionType === "admin" && adminId ? (
                  <ClassItemForAdmin
                    key={classItem.id}
                    adminId={adminId}
                    instructorId={instructorId}
                    classItem={classItem}
                    classId={classId}
                    isUpdatingData={isUpdatingData}
                    setIsUpdatingData={setIsUpdatingData}
                    previousPage={previousPage}
                  />
                ) : (
                  <ClassItem
                    key={classItem.id}
                    classItem={classItem}
                    classId={classId}
                    instructorId={instructorId}
                    isUpdatingData={isUpdatingData}
                    setIsUpdatingData={setIsUpdatingData}
                  />
                ),
              )
            ) : (
              <p className={styles.classItems__noClasses}>No classes.</p>
            )}
          </ul>
        </div>

        <div className={styles.detailsCard}>
          <h3 className={styles.detailsCard__title}>Class Details</h3>
          <ClassDetailsCard classDetails={classDetails} />
        </div>
      </main>
    </div>
  );
}

export default ClassDetails;
