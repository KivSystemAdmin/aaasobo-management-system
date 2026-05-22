import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { createAdmin, createEvent, generateAuthCookie } from "../../testUtils";
import { prisma } from "../../setup";

describe("GET /admins/event-list", () => {
  it("succeed with multiple events", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const event1 = await createEvent();
    const event2 = await createEvent();
    const [event1NameJpn, event1NameEng] = event1.name.split(" / ");
    const [event2NameJpn, event2NameEng] = event2.name.split(" / ");

    const response = await request(server)
      .get("/admins/event-list")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toEqual([
      {
        No: 1,
        ID: event1.id,
        Event: event1.name,
        "Event (Japanese)": event1NameJpn,
        "Event (English)": event1NameEng,
        "Color Code": event1.color,
      },
      {
        No: 2,
        ID: event2.id,
        Event: event2.name,
        "Event (Japanese)": event2NameJpn,
        "Event (English)": event2NameEng,
        "Color Code": event2.color,
      },
    ]);
  });
});

describe("POST /admins/event-list/register", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const eventData = {
      eventNameJpn: "イベント",
      eventNameEng: `Event${new Date().getTime()}`,
      color: "#FF00FF",
    };

    await request(server)
      .post("/admins/event-list/register")
      .set("Cookie", authCookie)
      .send(eventData)
      .expect(201);

    const createdEvent = await prisma.event.findFirst({
      where: { name: `${eventData.eventNameJpn} / ${eventData.eventNameEng}` },
    });
    expect(createdEvent).toBeTruthy();
  });

  it("fail for unauthenticated request", async () => {
    const eventData = {
      eventNameJpn: "イベント",
      eventNameEng: `Event${new Date().getTime()}`,
      color: "#FF00FF",
    };

    await request(server)
      .post("/admins/event-list/register")
      .send(eventData)
      .expect(401);
  });
});

describe("PATCH /admins/event-list/update/:id", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const event = await createEvent();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const eventNameJpn = "更新イベント";
    const eventNameEng = `Updated Event ${new Date().getTime()}`;
    const updatedName = `${eventNameJpn} / ${eventNameEng}`;

    await request(server)
      .patch(`/admins/event-list/update/${event.id}`)
      .set("Cookie", authCookie)
      .send({ eventNameJpn, eventNameEng, color: event.color })
      .expect(200);

    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(updatedEvent?.name).toBe(updatedName);
  });

  it("fail for unauthenticated request", async () => {
    const event = await createEvent();

    await request(server)
      .patch(`/admins/event-list/update/${event.id}`)
      .send({
        eventNameJpn: "イベント",
        eventNameEng: "Event",
        color: event.color,
      })
      .expect(401);
  });

  it("rejects updates to protected default events by name", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const event = await createEvent({
      name: "お休み / No Class",
      color: "#111111",
    });

    await request(server)
      .patch(`/admins/event-list/update/${event.id}`)
      .set("Cookie", authCookie)
      .send({
        eventNameJpn: "更新イベント",
        eventNameEng: "Updated Event",
        color: "#222222",
      })
      .expect(403);

    const unchangedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(unchangedEvent?.name).toBe("お休み / No Class");
  });
});

describe("DELETE /admins/event-list/delete/:id", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const event = await createEvent();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .delete(`/admins/event-list/delete/${event.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    const deletedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });
    expect(deletedEvent).toBeNull();
  });

  it("fail for unauthenticated request", async () => {
    const event = await createEvent();

    await request(server)
      .delete(`/admins/event-list/delete/${event.id}`)
      .expect(401);
  });

  it("rejects deletes to protected default events by name", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const event = await createEvent({
      name: "お休み振替対象日 / No Class (Rebookable)",
      color: "#222222",
    });

    await request(server)
      .delete(`/admins/event-list/delete/${event.id}`)
      .set("Cookie", authCookie)
      .expect(403);

    expect(
      await prisma.event.findUnique({ where: { id: event.id } }),
    ).toBeTruthy();
  });
});
