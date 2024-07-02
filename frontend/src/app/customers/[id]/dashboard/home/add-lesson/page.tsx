"use client";

import AddLessonForm from "@/app/components/customers-dashboard/home/AddLessonForm";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getInstructors } from "@/app/helper/instructorsApi";

function AddPage({ params }: { params: { id: string } }) {
  const customerId = params.id;
  const [instructors, setInstructors] = useState<Instructor[] | undefined>();

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

  return (
    <div className={styles.page}>
      <div className={styles.page__header}>
        <h1 className={styles.page__title}>Add Lesson</h1>
      </div>
      {instructors ? (
        <AddLessonForm instructors={instructors} customerId={customerId} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default AddPage;
