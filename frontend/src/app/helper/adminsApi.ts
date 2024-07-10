const BASE_URL = "http://localhost:4000/admins/dashboard";

// GET all instructors data
export const getAllInstructors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/instructors`);
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
