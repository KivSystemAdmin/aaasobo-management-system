import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deletePastAdmins } from "@/lib/api/adminsApi";

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
    console.log("Cron job (deletePastAdmins) started");
    await deletePastAdmins(authorization); // Delete admins who left the service more than 3 years ago
    console.log("Cron job (deletePastAdmins) executed successfully.");
    return NextResponse.json(
      { message: "Cron job (deletePastAdmins) executed successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during cron job (deletePastAdmins) execution:", error);
    return NextResponse.json(
      {
        error: "Cron job (deletePastAdmins) failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
