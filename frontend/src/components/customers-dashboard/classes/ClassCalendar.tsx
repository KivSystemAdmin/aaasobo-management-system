import React from "react";
import styles from "./ClassCalendar.module.scss";
import ClassActions from "./classActions/ClassActions";
import CustomerCalendar from "./customerCalensar/CustomerCalendar";
import { getClasses, getCustomerById } from "@/lib/api/customersApi";
import WelcomeModalController from "./welcomeModalController/WelcomModalController";
import {
  getAllBusinessSchedules,
  getAllEvents,
  getMessageBoardPosts,
} from "@/lib/api/adminsApi";
import { getCookie } from "../../../proxy";
import MessageBoardPanel from "@/components/features/messageBoardPanel/MessageBoardPanel";
import { MessageTarget } from "@/types";

export default async function ClassCalendar({
  customerId,
  userSessionType,
  adminId,
}: {
  customerId: number;
  userSessionType: UserType;
  adminId?: number;
}) {
  // Get the cookies from the request headers
  const cookie = await getCookie();

  const [classes, customer, schedule, events, messageBoardPosts] =
    await Promise.all([
      getClasses(customerId, cookie),
      getCustomerById(customerId, cookie),
      getAllBusinessSchedules(cookie),
      getAllEvents(cookie),
      getMessageBoardPosts(cookie),
    ]);

  const createdAt = customer.createdAt;
  const hasSeenWelcomeModal = customer.hasSeenWelcome;
  const terminationAt = customer.terminationAt;

  const colorsForEvents: { event: string; color: string }[] = events.map(
    (e: EventColor) => ({
      event: e.Event,
      color: e["Color Code"],
    }),
  );
  const visiblePosts = messageBoardPosts.filter(
    (post) =>
      post.target === MessageTarget.customer ||
      post.target === MessageTarget.both,
  );

  return (
    <main className={styles.calendarContainer}>
      <MessageBoardPanel
        posts={visiblePosts}
        storageKey="customerClassCalendarMessageBoardOpenState"
        readMessageStorageKey={`readMessageNumber:customer:${customerId}`}
        adminId={adminId}
      />

      <ClassActions
        userSessionType={userSessionType}
        customerId={customerId}
        terminationAt={terminationAt}
        adminId={adminId}
      />

      <CustomerCalendar
        customerId={customerId}
        classes={classes}
        createdAt={createdAt}
        businessSchedule={schedule.organizedData}
        colorsForEvents={colorsForEvents}
        userSessionType={userSessionType}
      />

      {!hasSeenWelcomeModal && (
        <WelcomeModalController
          userSessionType={userSessionType}
          customerId={customerId}
        />
      )}
    </main>
  );
}
