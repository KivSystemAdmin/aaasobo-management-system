import {
  devices,
  expect,
  test,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { ADMIN_STATE } from "../global-setup";

type ClassRecord = {
  id: number;
  dateTime: string;
  status: string;
  customer?: { id: number };
  instructor?: { id: number };
  recurringClassId?: number | null;
  rebookableUntil?: string | null;
  classAttendance?: { children: { id: number }[] };
};

type ClassesResponse = { classes: ClassRecord[] };
type RecurringClassesResponse = {
  recurringClasses: Array<{
    id: number;
    dateTime: string;
    endAt?: string | null;
  }>;
};
type SchedulesResponse = {
  data: Array<{
    id: number;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>;
};

const monitoredErrors = new WeakMap<TestInfo, string[]>();
const stoppedMonitoring = new WeakSet<Page>();

function monitor(page: Page, testInfo: TestInfo) {
  const errors = monitoredErrors.get(testInfo) ?? [];
  page.on("console", (message) => {
    if (stoppedMonitoring.has(page)) return;
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    if (stoppedMonitoring.has(page)) return;
    return request.failure()?.errorText === "net::ERR_ABORTED"
      ? undefined
      : errors.push(
          `request: ${request.method()} ${request.url()} ${request.failure()?.errorText}`,
        );
  });
  monitoredErrors.set(testInfo, errors);
}

function stopMonitoring(page: Page) {
  stoppedMonitoring.add(page);
}

async function login(
  page: Page,
  role: "customer" | "instructor",
  index: number,
) {
  const prefix = role === "customer" ? "cu" : "in";
  const ref = `${prefix}${String(index).padStart(4, "0")}`;
  await page.goto(`/${role}s/login`);
  await page.locator("#email").fill(`${ref}@example.com`);
  await page.locator("#password").fill(`Temp-${ref}`);
  await page.getByRole("button", { name: /login|ログイン/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}s/(?!login)`), {
    timeout: 60_000,
  });
  await page.waitForLoadState("networkidle");
}

async function backend<T>(
  page: Page,
  endpoint: string,
  method = "GET",
): Promise<T> {
  const result = await page.evaluate(
    async ({ backendEndpoint, requestMethod }) => {
      const response = await fetch("/api/proxy", {
        method: requestMethod,
        headers:
          requestMethod === "GET"
            ? { "backend-endpoint": backendEndpoint }
            : {
                "backend-endpoint": backendEndpoint,
                "content-type": "application/json",
              },
        body: requestMethod === "GET" ? undefined : "{}",
      });
      const text = await response.text();
      let body: unknown = text;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        // Some mutation endpoints intentionally return plain text (for example, "OK").
      }
      return {
        ok: response.ok,
        status: response.status,
        body,
      };
    },
    { backendEndpoint: endpoint, requestMethod: method },
  );
  expect(result.ok, `${method} ${endpoint}: ${result.status}`).toBeTruthy();
  return result.body as T;
}

async function cancelFirstFutureClassThroughUi(page: Page) {
  const cancelable = page.getByRole("button", {
    name: /Cancel Classes|予約をキャンセル/i,
    exact: true,
  });
  await page.goto("/customers/classes");
  const welcomeButton = page.getByRole("button", { name: "Get Started" });
  if (await welcomeButton.isVisible()) await welcomeButton.click();
  await cancelable.click();
  await page.locator('input[type="checkbox"]').first().check();
  await page
    .getByRole("button", {
      name: /Cancel Classes \(1\)|予約をキャンセル \(1\)/i,
    })
    .click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(
    page.getByText(/successfully canceled|キャンセルが完了/i),
  ).toBeVisible();
}

function jstDateDaysFromNow(days: number) {
  const dateKey = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tokyo",
  });
  const result = new Date(`${dateKey}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function sundayInMonth(monthOffset: number, position: "first" | "last") {
  const [year, month] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Canada/Eastern" })
    .split("-")
    .map(Number);

  if (position === "first") {
    const date = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
    date.setUTCDate(date.getUTCDate() + ((7 - date.getUTCDay()) % 7));
    return date.toISOString().slice(0, 10);
  }

  const date = new Date(Date.UTC(year, month + monthOffset, 0));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}

async function setNoClassDay(page: Page, date: string) {
  const result = await page.evaluate(async (dateKey) => {
    const response = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "backend-endpoint": "/admins/business-schedule/update",
        "content-type": "application/json",
      },
      body: JSON.stringify({ startDate: dateKey, eventId: 2 }),
    });
    return { ok: response.ok, status: response.status };
  }, date);

  expect(result.ok, `set no-class event for ${date}: ${result.status}`).toBe(
    true,
  );
}

test.describe("critical class/date workflows", () => {
  test.afterEach(async ({}, testInfo) => {
    expect(
      monitoredErrors.get(testInfo) ?? [],
      "browser console and requests must stay clean",
    ).toEqual([]);
  });

  test("0. business calendar colors survive adjacent-month navigation", async ({
    browser,
  }, testInfo) => {
    const lastSundayThisMonth = sundayInMonth(0, "last");
    const firstSundayThirdMonth = sundayInMonth(2, "first");

    const adminContext = await browser.newContext({
      storageState: ADMIN_STATE,
      timezoneId: "Canada/Eastern",
    });
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/admins/dashboard");
    await setNoClassDay(adminPage, lastSundayThisMonth);
    await setNoClassDay(adminPage, firstSundayThirdMonth);
    await adminContext.close();

    const context = await browser.newContext({
      timezoneId: "Canada/Eastern",
    });
    const page = await context.newPage();
    monitor(page, testInfo);
    await login(page, "customer", 1);
    const welcomeButton = page.getByRole("button", { name: "Get Started" });
    if (await welcomeButton.isVisible()) await welcomeButton.click();

    const noClassColor = "rgb(250, 215, 205)";
    const lastSundayCell = page.locator(
      `td.fc-daygrid-day[data-date="${lastSundayThisMonth}"]`,
    );
    await expect(lastSundayCell).toHaveCSS("background-color", noClassColor);

    await page.getByRole("button", { name: "Next month" }).click();
    const firstSundayThirdMonthCell = page.locator(
      `td.fc-daygrid-day[data-date="${firstSundayThirdMonth}"]`,
    );
    await expect(firstSundayThirdMonthCell).toHaveCSS(
      "background-color",
      noClassColor,
    );

    await page.getByRole("button", { name: "Next month" }).click();
    await expect(firstSundayThirdMonthCell).toHaveCSS(
      "background-color",
      noClassColor,
    );

    await page.getByRole("button", { name: "Previous month" }).click();
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(lastSundayCell).toHaveCSS("background-color", noClassColor);

    await context.close();
  });

  test("1. regular classes retain recurrence, attendance, deadlines, and conflict protection", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      timezoneId: "Canada/Eastern",
    });
    const page = await context.newPage();
    monitor(page, testInfo);
    await login(page, "customer", 1);
    await page.goto("/customers/regular-classes");
    await expect(
      page.getByText(/regular class|定期クラス/i).first(),
    ).toBeVisible();
    await expect(
      page.locator('[aria-label^="Recurring class "]').first(),
    ).toBeVisible();
    const card = page.locator('[aria-label^="Recurring class "]').first();
    const oldRecurringClassId = Number(
      (await card.getAttribute("aria-label"))?.split(" ").at(-1),
    );
    const before = await backend<RecurringClassesResponse>(
      page,
      "/recurring-classes?subscriptionId=1&status=active",
    );
    expect(before.recurringClasses.map((item) => item.id)).toContain(
      oldRecurringClassId,
    );

    await card
      .getByRole("button", { name: /edit class|クラスを編集/i })
      .click();
    await page.locator('input[type="date"]').fill(jstDateDaysFromNow(8));
    await page
      .getByRole("button", { name: /Apply Changes|変更を適用/i })
      .click();
    await expect(
      page.getByRole("heading", {
        name: /Edit Regular Class Schedule|レギュラークラスのスケジュールを編集/i,
      }),
    ).toBeHidden();

    const activeAfter = await backend<RecurringClassesResponse>(
      page,
      "/recurring-classes?subscriptionId=1&status=active",
    );
    const historyAfter = await backend<RecurringClassesResponse>(
      page,
      "/recurring-classes?subscriptionId=1&status=history",
    );
    expect(activeAfter.recurringClasses).toHaveLength(
      before.recurringClasses.length,
    );
    expect(activeAfter.recurringClasses.map((item) => item.id)).not.toContain(
      oldRecurringClassId,
    );
    expect(historyAfter.recurringClasses.map((item) => item.id)).toContain(
      oldRecurringClassId,
    );
    const { classes } = await backend<ClassesResponse>(page, "/classes/1");
    const recurring = classes.filter((item) => item.recurringClassId);
    expect(recurring.length).toBeGreaterThan(20);
    expect(new Set(recurring.map((item) => item.dateTime)).size).toBe(
      recurring.length,
    );
    expect(
      recurring.every((item) => item.classAttendance?.children.length),
    ).toBeTruthy();
    expect(
      recurring
        .filter((item) => new Date(item.dateTime) > new Date())
        .every((item) => item.rebookableUntil),
    ).toBeTruthy();
    await page.reload();
    await expect(
      page.locator('[aria-label^="Recurring class "]').first(),
    ).toBeVisible();
    await context.close();
  });

  test("2. monthly generation is JST-correct and duplicate safe", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: ADMIN_STATE,
      timezoneId: "Asia/Tokyo",
    });
    const page = await context.newPage();
    monitor(page, testInfo);
    const month = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await page.goto("/admins/class-list");
      await page.getByRole("button", { name: "レギュラークラス生成" }).click();
      await page.locator("#yearMonth").selectOption({ value: month });
      await page.getByRole("button", { name: "生成する", exact: true }).click();
      await expect(page.getByText("クラスを生成しました。")).toBeVisible();
    }
    const { classes } = await backend<ClassesResponse>(page, "/classes");
    const keys = classes.map(
      (item) => `${item.customer?.id}:${item.instructor?.id}:${item.dateTime}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(
      classes.every((item) => {
        const jst = new Date(item.dateTime).toLocaleString("en-CA", {
          timeZone: "Asia/Tokyo",
          hour12: false,
        });
        return !jst.includes("24:30");
      }),
    ).toBeTruthy();
    await context.close();
  });

  test("3. cancellation persists across roles, reloads, mobile, and timezones", async ({
    browser,
  }, testInfo) => {
    const customer = await browser.newContext({
      timezoneId: "Canada/Eastern",
      viewport: { width: 390, height: 844 },
    });
    const page = await customer.newPage();
    monitor(page, testInfo);
    await login(page, "customer", 21);
    const { classes } = await backend<ClassesResponse>(page, "/classes/21");
    const target = classes.find(
      (item) =>
        new Date(item.dateTime) > new Date() && item.status === "booked",
    );
    expect(target).toBeTruthy();
    await cancelFirstFutureClassThroughUi(page);
    await page.reload();
    const { classes: after } = await backend<ClassesResponse>(
      page,
      "/classes/21",
    );
    expect(after.find((item) => item.id === target!.id)?.status).toBe(
      "canceledByCustomer",
    );

    const instructor = await browser.newContext({ timezoneId: "Asia/Tokyo" });
    const instructorPage = await instructor.newPage();
    monitor(instructorPage, testInfo);
    await login(instructorPage, "instructor", target!.instructor!.id);
    await instructorPage.goto("/instructors/availability");
    await expect(
      instructorPage.getByRole("heading", {
        name: "Instructor Schedule Calendar",
      }),
    ).toBeVisible();
    await instructorPage.waitForLoadState("networkidle");
    await instructorPage.reload();
    await instructorPage.waitForLoadState("networkidle");
    const { classes: crossRole } = await backend<ClassesResponse>(
      instructorPage,
      "/classes",
    );
    expect(crossRole.find((item) => item.id === target!.id)?.status).toBe(
      "canceledByCustomer",
    );
    await customer.close();
    await instructor.close();
  });

  test("3b. Mobile Safari profile cancellation persists after reload", async ({
    browser,
  }, testInfo) => {
    const { defaultBrowserType: _, ...mobileSafari } = devices["iPhone 13"];
    const context = await browser.newContext({
      ...mobileSafari,
      timezoneId: "UTC",
    });
    const page = await context.newPage();
    monitor(page, testInfo);
    await login(page, "customer", 22);
    const { classes } = await backend<ClassesResponse>(page, "/classes/22");
    const target = classes.find(
      (item) =>
        new Date(item.dateTime) > new Date() && item.status === "booked",
    );
    expect(target).toBeTruthy();

    await cancelFirstFutureClassThroughUi(page);
    await page.reload();
    const { classes: after } = await backend<ClassesResponse>(
      page,
      "/classes/22",
    );
    expect(after.find((item) => item.id === target!.id)?.status).toBe(
      "canceledByCustomer",
    );
    await context.close();
  });

  test("4. instructor schedule version creation persists half-open boundaries", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      storageState: ADMIN_STATE,
      timezoneId: "Asia/Tokyo",
    });
    const page = await context.newPage();
    monitor(page, testInfo);
    await page.goto("/admins/instructor-list/4");
    const before = await backend<SchedulesResponse>(
      page,
      "/instructors/4/schedules",
    );
    const unrelatedBefore = await backend<SchedulesResponse>(
      page,
      "/instructors/5/schedules",
    );
    const previouslyActive = before.data.find(
      (schedule) => schedule.effectiveTo === null,
    );
    expect(previouslyActive).toBeTruthy();

    await page.getByRole("button", { name: "スケジュール" }).click();
    await expect(page.getByText("スケジュール期間 (日本時間)")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "新しいスケジュールを作成" }),
    ).toBeVisible();
    const selector = page
      .getByText("スケジュール期間 (日本時間)")
      .locator("select");
    const optionCountBefore = await selector.locator("option").count();
    const effectiveFrom = jstDateDaysFromNow(14);
    await page
      .getByRole("button", { name: "新しいスケジュールを作成" })
      .click();
    await page.locator("#effectiveFrom").fill(effectiveFrom);
    await page
      .getByRole("button", { name: "スケジュールを作成", exact: true })
      .click();
    await expect(
      page.getByText("Schedule created successfully."),
    ).toBeVisible();
    await expect(selector.locator("option")).toHaveCount(optionCountBefore + 1);

    const after = await backend<SchedulesResponse>(
      page,
      "/instructors/4/schedules",
    );
    const unrelatedAfter = await backend<SchedulesResponse>(
      page,
      "/instructors/5/schedules",
    );
    expect(after.data).toHaveLength(before.data.length + 1);
    expect(
      after.data.find((schedule) => schedule.id === previouslyActive!.id)
        ?.effectiveTo,
    ).toContain(effectiveFrom);
    expect(
      after.data.find((schedule) => schedule.effectiveTo === null)
        ?.effectiveFrom,
    ).toContain(effectiveFrom);
    expect(unrelatedAfter.data).toEqual(unrelatedBefore.data);
    await page.reload();
    await expect(page.getByText("スケジュール期間 (日本時間)")).toBeVisible();
    await context.close();
  });

  test("5. availability and historical completion state remain role consistent", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ timezoneId: "Asia/Tokyo" });
    const page = await context.newPage();
    monitor(page, testInfo);
    await login(page, "instructor", 5);
    await page.goto("/instructors/availability");
    await expect(
      page.getByRole("heading", { name: "Instructor Schedule Calendar" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    const { classes } = await backend<ClassesResponse>(page, "/classes");
    const own = classes.filter((item) => item.instructor?.id === 5);
    expect(own.some((item) => item.status === "completed")).toBeTruthy();
    expect(own.some((item) => item.status === "booked")).toBeTruthy();
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page).toHaveURL(/\/instructors\/availability/);
    await page.waitForLoadState("networkidle");
    stopMonitoring(page);
    await context.close();
  });
});
