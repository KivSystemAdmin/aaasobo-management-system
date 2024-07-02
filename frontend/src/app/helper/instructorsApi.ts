// GET instructors data
export const getInstructors = async () => {
  try {
    const response = await fetch("http://localhost:4000/instructors");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    throw error;
  }
};
