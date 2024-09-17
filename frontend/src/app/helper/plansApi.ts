const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

// GET all plans data
export const getAllPlans = async () => {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/plans`);
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
