import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SundayColorUpdateError,
  updateSundayColor,
} from "@/lib/api/calendarsApi";

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
    const yearParam = req.nextUrl.searchParams.get("year");
    if (yearParam !== null && !/^\d+$/.test(yearParam)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    const year = yearParam === null ? undefined : Number(yearParam);

    console.log("Cron job (updateSundayColor) started");
    const result = await updateSundayColor(authorization, year);
    console.log("Cron job (updateSundayColor) executed successfully.");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(
      "Error during cron job (updateSundayColor) execution:",
      error,
    );
    if (error instanceof SundayColorUpdateError) {
      return NextResponse.json(error.responseBody, { status: error.status });
    }

    return NextResponse.json(
      {
        error: "Cron job (updateSundayColor) failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
