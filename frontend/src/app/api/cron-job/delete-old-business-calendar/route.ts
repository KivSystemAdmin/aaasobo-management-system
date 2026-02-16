import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteOldBusinessCalendar } from "@/lib/api/calendarsApi";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Get the authorization header
  const authorization = req.headers.get("Authorization");

  if (
    !authorization ||
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Cron job (deleteOldBusinessCalendar) started");
    await deleteOldBusinessCalendar(authorization); // Delete business calendar older than 1 years (13 months to be safe)
    console.log("Cron job (deleteOldBusinessCalendar) executed successfully.");
    return NextResponse.json(
      {
        message: "Cron job (deleteOldBusinessCalendar) executed successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error during cron job (deleteOldBusinessCalendar) execution:",
      error,
    );
    return NextResponse.json(
      {
        error: "Cron job (deleteOldBusinessCalendar) failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
