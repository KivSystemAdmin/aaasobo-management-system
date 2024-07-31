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
  classURL: string;
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
    icon: string;
    classURL: string;
    nickname: string;
    meetingId: string;
    passcode: string;
  };
  classAttendance: { children: { id: number; name: string }[] };

  status: "booked" | "completed" | "cancelled";
  isRebookable: boolean;
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
  customerId?: number;
  name: string;
};

type Plan = {
  id: number;
  name: string;
  description: string;
};

type Subscriptions = {
  subscriptions: Subscription[];
};

type Subscription = {
  id: number;
  planId: number;
  customerId: number;
  startAt: string;
  endAt: string;
  plan: Plan;
};

type RecurringClasses = {
  recurringClasses: RecurringClass[];
};

type RecurringClass = {
  id: number;
  instructorId: number;
  subscription: Subscriptions;
  instructor: Instructor;
  recurringClassAttendance: RecurringClassAttendance[];
};

type RecurringClassAttendance = {
  childrenId: number;
  children: Child;
};
