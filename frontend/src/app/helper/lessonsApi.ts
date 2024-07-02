// GET lessons by customer id
export const getLessonsByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(`http://localhost:4000/lessons/${customerId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { lessons } = await response.json();
    return lessons;
  } catch (error) {
    console.error("Failed to fetch lessons:", error);
    throw error;
  }
};

// DELETE a lesson with lesson id
export const deleteLesson = async (lessonId: number) => {
  try {
    const response = await fetch(`http://localhost:4000/lessons/${lessonId}`, {
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
    console.error("Failed to delete lesson:", error);
    throw error;
  }
};

// POST lesson
export const addLesson = async (lessonData: {
  dateTime: string;
  instructorId: number;
  customerId: number;
  status: string;
}) => {
  try {
    const response = await fetch("http://localhost:4000/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lessonData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error. status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to add lesson:", error);
    throw error;
  }
};
