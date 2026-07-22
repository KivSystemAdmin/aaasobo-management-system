import { expect, test } from "@playwright/test";
import { markWelcomeSeen } from "../src/lib/api/customersApi";

test.describe("markWelcomeSeen", () => {
  const originalFetch = global.fetch;
  const originalFrontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN;
  const originalConsoleError = console.error;

  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_FRONTEND_ORIGIN = "http://frontend.test";
    console.error = () => undefined;
  });

  test.afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_FRONTEND_ORIGIN = originalFrontendOrigin;
    console.error = originalConsoleError;
  });

  test("reports success only after the backend accepts the update", async () => {
    let request:
      | { input: string | URL | Request; init?: RequestInit }
      | undefined;
    global.fetch = async (input, init) => {
      request = { input, init };
      return new Response(null, { status: 200, statusText: "OK" });
    };

    await expect(markWelcomeSeen(42)).resolves.toBe(true);
    expect(request).toEqual({
      input: "http://frontend.test/api/proxy",
      init: {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "backend-endpoint": "/customers/42/seen-welcome",
        },
      },
    });
  });

  test("reports failure when the backend rejects the update", async () => {
    global.fetch = async () =>
      new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      });

    await expect(markWelcomeSeen(42)).resolves.toBe(false);
  });

  test("reports failure when the update request cannot be completed", async () => {
    global.fetch = async () => {
      throw new Error("network unavailable");
    };

    await expect(markWelcomeSeen(42)).resolves.toBe(false);
  });
});
