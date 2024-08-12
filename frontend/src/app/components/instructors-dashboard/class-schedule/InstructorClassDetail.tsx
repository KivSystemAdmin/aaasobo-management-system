import {
  formatDate,
  formatDayDate,
  formatTime,
  formatTimeWithAddedMinutes,
} from "@/app/helper/dateUtils";

const InstructorClassDetail = ({
  classDetail,
  timeZone,
}: {
  classDetail: InstructorClassDetail | null;
  timeZone: string;
}) => {
  if (!classDetail) {
    return <div>No class details available</div>;
  }

  const renderChildren = () => {
    const childrenToDisplay = classDetail.children;

    // Check if there are no children to display
    if (childrenToDisplay.length === 0) {
      return (
        <h3>
          {classDetail.status === "completed"
            ? "Attended Children"
            : "Attending Children"}
          :{" "}
          <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
            The registered children were absent.
          </span>
        </h3>
      );
    }

    return (
      <div>
        <h3>
          {classDetail.status === "booked"
            ? "Attending Children"
            : "Attended Children"}
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Date of Birth
              </th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                Personal Info
              </th>
            </tr>
          </thead>
          <tbody>
            {childrenToDisplay.map((child) => (
              <tr key={child.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.name}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.birthdate
                    ? formatDate(new Date(child.birthdate), timeZone)
                    : "N/A"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {child.personalInfo || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderClassURL = () => {
    if (classDetail.status === "booked") {
      return (
        <>
          <h3>
            Class URL:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              <a
                href={classDetail.classURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {classDetail.classURL}{" "}
              </a>
            </span>
          </h3>
          <h3>
            Meeting ID:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              {classDetail.meetingId}
            </span>
          </h3>
          <h3>
            Passcode:{" "}
            <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
              {classDetail.passcode}
            </span>
          </h3>
        </>
      );
    }
    return null;
  };

  const renderNotification = () => {
    if (classDetail.status === "booked") {
      return (
        <h3 style={{ fontWeight: "bold", color: "red" }}>
          ■ If you need to cancel a class, please contact our staff promptly via
          LINE.
        </h3>
      );
    }
    return null;
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", padding: "15px" }}>
      <h3>【{classDetail.status}】</h3>

      <h3>
        Date:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {formatDayDate(new Date(classDetail.dateTime), timeZone)}
        </span>
      </h3>

      <h3>
        Time:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {formatTime(new Date(classDetail.dateTime), timeZone)} -{" "}
          {formatTimeWithAddedMinutes(
            new Date(classDetail.dateTime),
            timeZone,
            25,
          )}
        </span>
      </h3>

      <h3>
        Guardian:{" "}
        <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>
          {classDetail.customerName}
        </span>
      </h3>

      {renderChildren()}

      {renderClassURL()}

      {renderNotification()}
    </div>
  );
};

export default InstructorClassDetail;
