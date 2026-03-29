import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createCustomer,
  generateAuthCookie,
} from "../../testUtils";

describe("GET /admins/customer-list", () => {
  it("succeed with multiple customers", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const customer1 = await createCustomer();
    const customer2 = await createCustomer();

    const response = await request(server)
      .get("/admins/customer-list")
      .set("Cookie", authCookie)
      .expect(200);

    const formatDateInJst = (date: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);

    expect(response.body.data).toEqual([
      {
        No: 1,
        ID: customer1.id,
        Customer: customer1.name,
        Children: "",
        Email: customer1.email,
        Prefecture: customer1.prefecture,
        "Start Date (JST)": formatDateInJst(customer1.createdAt),
      },
      {
        No: 2,
        ID: customer2.id,
        Customer: customer2.name,
        Children: "",
        Email: customer2.email,
        Prefecture: customer2.prefecture,
        "Start Date (JST)": formatDateInJst(customer2.createdAt),
      },
    ]);
  });
});
