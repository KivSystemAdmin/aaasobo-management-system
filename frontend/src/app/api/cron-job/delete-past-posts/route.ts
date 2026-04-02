import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deletePastMessageBoardPosts } from "@/lib/api/adminsApi";

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
    console.log("Cron job (deletePastPosts) started");
    await deletePastMessageBoardPosts(authorization); // Delete posts that are older than the threshold
    console.log("Cron job (deletePastPosts) executed successfully.");
    return NextResponse.json(
      { message: "Cron job (deletePastPosts) executed successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during cron job (deletePastPosts) execution:", error);
    return NextResponse.json(
      {
        error: "Cron job (deletePastPosts) failed",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
