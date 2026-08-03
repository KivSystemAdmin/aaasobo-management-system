import { prisma } from "../../prisma/prismaClient";
import type { EnrollmentStatusCustomer } from "../../../shared/schemas/admins";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function jstDateKey(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function formatJstTime(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(11, 16);
}

function displayRecurringEndAt(endAt: Date): Date {
  return new Date(endAt.getTime() - DAY_MS);
}

function isActivePeriod(
  today: string,
  startAt: Date | null,
  endAt: Date | null,
  exclusiveEnd: boolean,
): boolean {
  if (!startAt || jstDateKey(startAt) > today) return false;
  if (!endAt) return true;
  const displayedEnd = exclusiveEnd ? displayRecurringEndAt(endAt) : endAt;
  return today <= jstDateKey(displayedEnd);
}

export async function getEnrollmentStatus(
  now: Date = new Date(),
): Promise<EnrollmentStatusCustomer[]> {
  const today = jstDateKey(now);
  const customers = await prisma.customer.findMany({
    where: { terminationAt: null },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      subscription: {
        orderBy: [{ startAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          startAt: true,
          endAt: true,
          plan: { select: { name: true } },
          recurringClass: {
            select: {
              id: true,
              startAt: true,
              endAt: true,
              instructor: { select: { nickname: true } },
              recurringClassAttendance: {
                orderBy: { childrenId: "asc" },
                select: { children: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    subscriptions: customer.subscription
      .filter((subscription) =>
        isActivePeriod(today, subscription.startAt, subscription.endAt, false),
      )
      .map((subscription) => ({
        id: subscription.id,
        planName: subscription.plan.name,
        recurringClasses: subscription.recurringClass
          .filter((recurringClass) =>
            isActivePeriod(
              today,
              recurringClass.startAt,
              recurringClass.endAt,
              true,
            ),
          )
          .sort((a, b) => {
            const aStart = a.startAt?.getTime() ?? 0;
            const bStart = b.startAt?.getTime() ?? 0;
            const aJst = new Date(aStart + JST_OFFSET_MS);
            const bJst = new Date(bStart + JST_OFFSET_MS);
            return (
              aJst.getUTCDay() - bJst.getUTCDay() ||
              aJst.getUTCHours() * 60 +
                aJst.getUTCMinutes() -
                (bJst.getUTCHours() * 60 + bJst.getUTCMinutes()) ||
              a.id - b.id
            );
          })
          .map((recurringClass) => {
            const startAt = recurringClass.startAt!;
            const endTime = new Date(startAt.getTime() + 25 * 60 * 1000);
            const jstStart = new Date(startAt.getTime() + JST_OFFSET_MS);
            return {
              id: recurringClass.id,
              children: recurringClass.recurringClassAttendance.map(
                (attendance) => attendance.children.name,
              ),
              instructor: recurringClass.instructor?.nickname ?? "未割当",
              weekday: WEEKDAYS[jstStart.getUTCDay()],
              time: `${formatJstTime(startAt)}–${formatJstTime(endTime)}`,
              startDate: jstDateKey(startAt),
              endDate: recurringClass.endAt
                ? jstDateKey(displayRecurringEndAt(recurringClass.endAt))
                : "継続中",
            };
          }),
      })),
  }));
}
