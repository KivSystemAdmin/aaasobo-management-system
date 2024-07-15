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
export const addClass = async (classData: {
  dateTime: string;
  instructorId: number;
  customerId: number;
  childrenIds: number[];
  status: string;
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
  dateTime: string;
  instructorId: number;
  childrenIds: number[];
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
