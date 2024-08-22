const BASE_URL = "http://localhost:4000/admins";

// GET all instructors data
export const getAllInstructors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/instructor-list`);
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

// GET all customers data
export const getAllCustomers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/customer-list`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
};

// GET all children data
export const getAllChildren = async () => {
  try {
    const response = await fetch(`${BASE_URL}/child-list`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch children:", error);
    throw error;
  }
};

export const logoutAdmin = async () => {
  try {
    const response = await fetch(`${BASE_URL}/logout`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to logout:", error);
    throw error;
  }
};
