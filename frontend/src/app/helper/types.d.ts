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
  email: string;
  nickname: string;
  classLink: string;
  icon: string;
};

type Availability = { dateTime: string };

type ClassType = {
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
  classAttendance: { children: { id: number; name: string }[] };

  status: "booked" | "completed" | "cancelled";
};

type Customer = {
  customer: {
    id: number;
    name: string;
    email: string;
    class: CustomersClass[];
  };
};

type CustomersClass = {
  id: number;
  instructorId: number;
  customerId: number;
  dateTime: string;
  status: "booked" | "completed" | "cancelled";
};

type Child = {
  id: number;
  customerId: number;
  name: string;
};
