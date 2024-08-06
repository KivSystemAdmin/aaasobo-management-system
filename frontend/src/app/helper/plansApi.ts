// GET all plans data
export const getAllPlans = async () => {
  try {
    const response = await fetch("http://localhost:4000/plans");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    throw error;
  }
};
