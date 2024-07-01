type Events = {
  id: string;
  start: string;
  end: string;
};

type Instructors = {
  data: Instructor[];
};

type Instructor = {
  id: number;
  name: string;
  availabilities: Availability[];
};

type Availability = { dateTime: string };

type LessonType = {
  id: number;
  dateTime: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  instructor: {
    id: number;
    name: string;
  };
  status: "booked" | "completed" | "cancelled";
};

type Customer = {
  customer: {
    id: number;
    name: string;
    email: string;
    lesson: CustomersLesson[];
  };
};

type CustomersLesson = {
  id: number;
  instructorId: number;
  customerId: number;
  dateTime: string;
  status: "booked" | "completed" | "cancelled";
};
