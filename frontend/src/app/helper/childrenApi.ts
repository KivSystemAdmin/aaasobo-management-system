const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:4000";

// GET children data by customer id
export const getChildrenByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(
      `${BACKEND_ORIGIN}/children?customerId=${customerId}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { children } = await response.json();
    return children;
  } catch (error) {
    console.error("Failed to fetch children data:", error);
    throw error;
  }
};

// GET a child data by the child's id
export const getChildById = async (id: string) => {
  try {
    const response = await fetch(`${BACKEND_ORIGIN}/children/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const child = await response.json();
    return child;
  } catch (error) {
    console.error("Failed to fetch child data:", error);
    throw error;
  }
};

// POST a new child data
export const addChild = async (
  childName: string,
  childBirthdate: string,
  childPersonalInfo: string,
  customerId: string,
) => {
  // Define the data to be sent to the server side.
  const childrenURL = `${BACKEND_ORIGIN}/children`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    name: childName,
    birthdate: childBirthdate,
    personalInfo: childPersonalInfo,
    customerId: Number(customerId),
  });

  const response = await fetch(childrenURL, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return data;
};

// PATCH a child date
export const editChild = async (
  childId: number,
  childName: string,
  childBirthedate: string,
  childInfo: string,
  customerId: string,
) => {
  // Define the data to be sent to the server side.
  const childrenURL = `${BACKEND_ORIGIN}/children/${childId}`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    name: childName,
    birthdate: childBirthedate,
    personalInfo: childInfo,
    customerId: Number(customerId),
  });

  const response = await fetch(childrenURL, {
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

// DELETE a child data by child id
export const deleteChild = async (childId: number) => {
  try {
    // Define the data to be sent to the server side.
    const childrenURL = `${BACKEND_ORIGIN}/children/${childId}`;
    const headers = { "Content-Type": "application/json" };

    const response = await fetch(childrenURL, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error);
    }
    const result = await response.json();

    return result;
  } catch (error) {
    console.error("Failed to delete the child profile:", error);
    throw error;
  }
};
