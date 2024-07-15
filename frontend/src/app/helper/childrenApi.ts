// GET children data by customer id
export const getChildrenByCustomerId = async (customerId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/children?customerId=${customerId}`,
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
    const response = await fetch(`http://localhost:4000/children/${id}`);
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
export const addChild = async (childName: string, customerId: string) => {
  // Define the data to be sent to the server side.
  const childrenURL = "http://localhost:4000/children";
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    name: childName,
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
  customerId: string,
) => {
  // Define the data to be sent to the server side.
  const childrenURL = `http://localhost:4000/children/${childId}`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({
    name: childName,
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
    const childrenURL = `http://localhost:4000/children/${childId}`;
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
