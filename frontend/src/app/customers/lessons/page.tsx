import LessonsTable from "../../components/lessons/LessonsTable";
import styles from "./LessonsPage.module.scss";

async function LessonsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.page__header}>
        <h1 className={styles.page__title}>Lessons</h1>
      </div>
      <LessonsTable />
    </div>
  );
}

export default LessonsPage;
