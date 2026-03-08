import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteUnnecessaryPlans } from "@/lib/api/plansApi";

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
    console.log("Cron job (deleteUnnecessaryPlans) started");
    await deleteUnnecessaryPlans(authorization); // Delete customers who left the service more than 3 years ago
    console.log("Cron job (deleteUnnecessaryPlans) executed successfully.");
    return NextResponse.json(
      { message: "Cron job (deleteUnnecessaryPlans) executed successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "Error during cron job (deleteUnnecessaryPlans) execution:",
      error,
    );
    return NextResponse.json(
      {
        error: "Cron job (deleteUnnecessaryPlans) failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
