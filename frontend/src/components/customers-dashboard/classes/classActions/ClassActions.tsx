import styles from "./ClassActions.module.scss";
import CancelClassesActions from "./cancelClassesActions/CancelClassesActions";
import RebookingActions from "./rebookingActions/RebookingActions";

export default async function ClassActions({
  userSessionType,
  customerId,
  terminationAt,
  adminId,
}: {
  userSessionType: UserType;
  customerId: number;
  terminationAt: string | null;
  adminId?: number;
}) {
  return (
    <div className={styles.calendarHeaderContainer}>
      <div className={styles.calendarActions}>
        <div className={styles.calendarActions__container}>
          <CancelClassesActions
            customerId={customerId}
            userSessionType={userSessionType}
            terminationAt={terminationAt}
          />

          <RebookingActions
            customerId={customerId}
            userSessionType={userSessionType}
            terminationAt={terminationAt}
            adminId={adminId}
          />
        </div>
      </div>
    </div>
  );
}
