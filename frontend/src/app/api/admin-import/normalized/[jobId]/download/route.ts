import { NextRequest, NextResponse } from "next/server";
import { getCookie } from "@/proxy";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const params = await context.params;
    const jobId = params.jobId?.trim();

    if (!jobId) {
      return NextResponse.json({ message: "jobId is required" }, { status: 400 });
    }

    const cookie = await getCookie();
    const response = await fetch(
      `${process.env.BACKEND_ORIGIN}/admins/import/normalized/${encodeURIComponent(jobId)}/download`,
      {
        method: "GET",
        headers: {
          Cookie: cookie,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { message: text || "Failed to download normalized package" },
        { status: response.status },
      );
    }

    const fileBytes = await response.arrayBuffer();
    const disposition =
      response.headers.get("Content-Disposition") ??
      `attachment; filename="normalized-import-${jobId}.zip"`;

    return new Response(fileBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": disposition,
      },
    });
  } catch (error) {
    console.error("Failed to proxy normalized package download", { error });
    return NextResponse.json(
      { message: "Failed to download normalized package" },
      { status: 500 },
    );
  }
}
