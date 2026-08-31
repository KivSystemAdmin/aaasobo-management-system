import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  createClass,
  generateAuthCookie,
} from "../../testUtils";
import { getJstDayRange } from "../../../utils/dateUtils";

describe("GET /admins/class-list", () => {
  it("succeed with multiple classes", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const customer1 = await createCustomer();
    const customer2 = await createCustomer();
    const instructor1 = await createInstructor();
    const instructor2 = await createInstructor();

    // Create booked classes with instructor and dateTime within the 31-day window
    // Controller fetches classes from (now - 31 days) to (now + 32 days)
    const dateTime1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const dateTime2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const class1 = await createClass(customer1.id, instructor1.id, dateTime1);
    const class2 = await createClass(customer2.id, instructor2.id, dateTime2);

    const response = await request(server)
      .get("/admins/class-list")
      .set("Cookie", authCookie)
      .expect(200);

    // Convert UTC to JST for comparison (add 9 hours)
    const dateTimeJST1 = new Date(dateTime1.getTime() + 9 * 60 * 60 * 1000);
    const expectedDate1 = dateTimeJST1.toISOString().slice(0, 10);
    const expectedTime1 = dateTimeJST1.toISOString().slice(11, 16);
    const expectedDay1 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date(expectedDate1).getDay()
    ];

    const dateTimeJST2 = new Date(dateTime2.getTime() + 9 * 60 * 60 * 1000);
    const expectedDate2 = dateTimeJST2.toISOString().slice(0, 10);
    const expectedTime2 = dateTimeJST2.toISOString().slice(11, 16);
    const expectedDay2 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date(expectedDate2).getDay()
    ];

    expect(response.body.data).toEqual([
      {
        No: 1,
        ID: class1.id,
        "Date/Time (JST)": `${expectedDate1} ${expectedTime1}`,
        Day: expectedDay1,
        Instructor: instructor1.nickname,
        InstructorID: instructor1.id,
        Children: "",
        Customer: customer1.name,
        CustomerID: customer1.id,
        Status: "Booked",
        "Class Code": class1.classCode,
        "Is Free Trial": false,
        "Canceled At": null,
      },
      {
        No: 2,
        ID: class2.id,
        "Date/Time (JST)": `${expectedDate2} ${expectedTime2}`,
        Day: expectedDay2,
        Instructor: instructor2.nickname,
        InstructorID: instructor2.id,
        Children: "",
        Customer: customer2.name,
        CustomerID: customer2.id,
        Status: "Booked",
        "Class Code": class2.classCode,
        "Is Free Trial": false,
        "Canceled At": null,
      },
    ]);
  });

  it("returns only today's JST classes when today=true", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const customer = await createCustomer();
    const firstInstructor = await createInstructor();
    const secondInstructor = await createInstructor();
    const { startOfDay, endOfDay } = getJstDayRange(new Date());

    const secondInstructorClass = await createClass(
      customer.id,
      secondInstructor.id,
      new Date(startOfDay.getTime() + 60_000),
    );
    const firstInstructorClass = await createClass(
      customer.id,
      firstInstructor.id,
      new Date(startOfDay.getTime() + 120_000),
    );
    await createClass(
      customer.id,
      firstInstructor.id,
      new Date(startOfDay.getTime() - 1),
    );
    await createClass(
      customer.id,
      firstInstructor.id,
      new Date(endOfDay.getTime() + 1),
    );
    await createClass(customer.id);

    const response = await request(server)
      .get("/admins/class-list?today=true")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data.map(({ ID }: { ID: number }) => ID)).toEqual([
      firstInstructorClass.id,
      secondInstructorClass.id,
    ]);
  });

  it("sorts by instructor ID and class time with null values last", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const customer = await createCustomer();
    const firstInstructor = await createInstructor();
    const secondInstructor = await createInstructor();
    const baseTime = Date.now() + 24 * 60 * 60 * 1000;

    const secondInstructorClass = await createClass(
      customer.id,
      secondInstructor.id,
      new Date(baseTime),
    );
    const firstInstructorLaterClass = await createClass(
      customer.id,
      firstInstructor.id,
      new Date(baseTime + 60_000),
    );
    const firstInstructorEarlierClass = await createClass(
      customer.id,
      firstInstructor.id,
      new Date(baseTime - 60_000),
    );
    const unassignedScheduledClass = await createClass(
      customer.id,
      undefined,
      new Date(baseTime - 120_000),
    );
    const unassignedUnscheduledClass = await createClass(customer.id);

    const response = await request(server)
      .get("/admins/class-list?today=false")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data.map(({ ID }: { ID: number }) => ID)).toEqual([
      firstInstructorEarlierClass.id,
      firstInstructorLaterClass.id,
      secondInstructorClass.id,
      unassignedScheduledClass.id,
      unassignedUnscheduledClass.id,
    ]);
    expect(response.body.data.at(-1)).toMatchObject({
      InstructorID: null,
      "Date/Time (JST)": "Not Set",
    });
  });
});
