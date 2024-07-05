const BASE_URL = "http://localhost:4000/instructors";

export type Response<T> = T | { message: string };

export type Availability = {
  dateTime: string;
};

export type RecurringAvailability = {
  rrule: string;
};

// GET instructors data
export const getInstructors = async () => {
  try {
    const response = await fetch(BASE_URL);
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

export const getInstructor = async (
  id: number,
): Promise<Response<{ instructor: Instructor }>> => {
  const data: Response<{ instructor: Instructor }> = await fetch(
    `${BASE_URL}/${id}`,
  ).then((res) => res.json());

  if ("instructor" in data) {
    data.instructor.availabilities = data.instructor.availabilities.sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );
  }
  return data;
};

export const addAvailability = async (
  id: number,
  dateTime: string,
): Promise<Response<{ availability: Availability }>> => {
  return await fetch(`${BASE_URL}/${id}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "slot",
      dateTime,
    }),
  }).then((res) => res.json());
};

export const addRecurringAvailability = async (
  id: number,
  dateTime: string,
): Promise<Response<{ recurringAvailability: RecurringAvailability }>> => {
  return await fetch(`${BASE_URL}/${id}/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "recurring",
      dateTime,
    }),
  }).then((res) => res.json());
};

export const deleteAvailability = async (
  id: number,
  dateTime: string,
): Promise<Response<{ availability: Availability }>> => {
  return await fetch(`${BASE_URL}/${id}/availability`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "slot", dateTime }),
  }).then((res) => res.json());
};

export const deleteRecurringAvailability = async (
  id: number,
  dateTime: string,
): Promise<Response<{ recurringAvailability: RecurringAvailability }>> => {
  return await fetch(`${BASE_URL}/${id}/availability`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "recurring", dateTime }),
  }).then((res) => res.json());
};
