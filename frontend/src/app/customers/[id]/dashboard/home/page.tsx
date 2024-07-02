import styles from "./page.module.scss";
import UpcomingLessonsTable from "../../../../components/customers-dashboard/home/UpcomingLessonsTable";
import AddLessonButton from "@/app/components/customers-dashboard/home/AddLessonButton";

async function page({ params }: { params: { id: string } }) {
  const customerId = params.id;

  return (
    <div className={styles.page}>
      <div className={styles.page__header}>
        <h1 className={styles.page__title}>Lessons</h1>
      </div>
      <AddLessonButton customerId={customerId} />
      <UpcomingLessonsTable customerId={customerId} />
    </div>
  );
}

export default page;
