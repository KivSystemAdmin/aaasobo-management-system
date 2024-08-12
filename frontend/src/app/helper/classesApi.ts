// GET classes by customer id
export const getClassesByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(`http://localhost:4000/classes/${customerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { classes } = await response.json();
    return classes;
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    throw error;
  }
};

// DELETE a class with class id
export const deleteClass = async (classId: number) => {
  try {
    const response = await fetch(`http://localhost:4000/classes/${classId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to delete class:", error);
    throw error;
  }
};

// POST class
export const bookClass = async (classData: {
  classId: number;
  dateTime: string;
  instructorId: number;
  customerId: number;
  childrenIds: number[];
  status: string;
  recurringClassId: number;
}) => {
  try {
    const response = await fetch("http://localhost:4000/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(classData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error. status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to add class:", error);
    throw error;
  }
};

// GET a class by id
export const getClassById = async (classId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/classes/class/${classId}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const classData = await response.json();
    return classData;
  } catch (error) {
    console.error("Failed to fetch a class:", error);
    throw error;
  }
};

// PATCH a class date
export const editClass = async (editedClass: {
  classId: number;
  dateTime?: string;
  instructorId?: number;
  childrenIds: number[];
  status?:
    | "booked"
    | "completed"
    | "canceledByCustomer"
    | "canceledByInstructor";
  isRebookable?: boolean;
}) => {
  // Define the data to be sent to the server side.
  const classURL = `http://localhost:4000/classes/${editedClass.classId}`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify(editedClass);

  const response = await fetch(classURL, {
    method: "PATCH",
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return data;
};

// Fetch classes data for displaying on a calendar using userId
export const fetchClassesForCalendar = async (
  userId: number,
  userType: "instructor" | "customer",
) => {
  try {
    const response = await fetch(
      `http://localhost:4000/classes/calendar/${userType}/${userId}`,
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data.classes;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

// Cancel a class: Change the state of the class from 'booked' to 'canceledByCustomer'
export const cancelClass = async (classId: number) => {
  const classURL = `http://localhost:4000/classes/${classId}/cancel`;

  try {
    const response = await fetch(classURL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      "Failed to cancel class:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
};

export const getClassesByInstructorId = async (instructorId: number) => {
  try {
    const response = await fetch(
      `http://localhost:4000/instructors/${instructorId}/classes`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { classes } = await response.json();
    return classes;
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    throw error;
  }
};

// POST create monthly classes
export const createMonthlyClasses = async (data: {
  year: number;
  month: string;
}) => {
  try {
    const response = await fetch(
      "http://localhost:4000/classes/create-classes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error. status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create the monthly classes:", error);
    throw error;
  }
};
