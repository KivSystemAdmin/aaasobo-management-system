import { formatDateTime } from "@/app/helper/dateUtils";
import { useRouter } from "next/navigation";

function UpcomingClassesTable({
  customerId,
  classes,
}: {
  customerId: string;
  classes: ClassType[];
}) {
  const router = useRouter();

  const showClassDetails = (classId: number) => {
    router.push(`/customers/${customerId}/classes/${classId}`);
  };

  return classes ? (
    <div>
      {classes.map((eachClass) => {
        const classStartJapanTime = formatDateTime(
          new Date(eachClass.dateTime),
          "Asia/Tokyo",
        );

        return (
          <div key={eachClass.id}>
            <button
              onClick={() => {
                showClassDetails(eachClass.id);
              }}
            >
              [{eachClass.status}] {classStartJapanTime} :{" "}
              {eachClass.classAttendance.children
                .map((child) => child.name)
                .join(", ")}
            </button>
            <br />
          </div>
        );
      })}
    </div>
  ) : (
    <div>Loading ...</div>
  );
}

export default UpcomingClassesTable;
