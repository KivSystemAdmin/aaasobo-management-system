import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PerformanceSummary = {
  elapsedMs: number;
  daysPassed: number;
  completedClasses: number;
  cancelAttempts: number;
  cancelSuccess: number;
  cancelSkippedNoTarget: number;
  rebookAttempts: number;
  rebookSuccess: number;
  rebookSkippedNoSlot: number;
  rebookBusinessErrors: number;
  rebookableClassesAtEnd: number;
  latencyMinMs: number;
  latencyMaxMs: number;
  latencyAvgMs: number;
  latencyMedianMs: number;
  fetchLatencyAvgMs: number;
  completionLatencyAvgMs: number;
  cancelLatencyAvgMs: number;
  rebookLatencyAvgMs: number;
  errors: string[];
};

export async function writePerformanceReport(args: {
  config: Record<string, unknown>;
  summary: PerformanceSummary;
  outputPath: string;
}) {
  const lines: string[] = [];
  lines.push("# Performance Test Report");
  lines.push("");
  lines.push("## Config");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(args.config, null, 2));
  lines.push("```");
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- elapsed time (ms): ${args.summary.elapsedMs.toFixed(2)}`);
  lines.push(`- days passed: ${args.summary.daysPassed}`);
  lines.push(`- completed classes: ${args.summary.completedClasses}`);
  lines.push(`- cancel attempts: ${args.summary.cancelAttempts}`);
  lines.push(`- cancel success: ${args.summary.cancelSuccess}`);
  lines.push(
    `- cancel skipped (no target): ${args.summary.cancelSkippedNoTarget}`,
  );
  lines.push(`- rebook attempts: ${args.summary.rebookAttempts}`);
  lines.push(`- rebook success: ${args.summary.rebookSuccess}`);
  lines.push(`- rebook skipped (no slot): ${args.summary.rebookSkippedNoSlot}`);
  lines.push(`- rebook business errors: ${args.summary.rebookBusinessErrors}`);
  lines.push(
    `- rebookable classes at end: ${args.summary.rebookableClassesAtEnd}`,
  );
  lines.push(`- latency min (ms): ${args.summary.latencyMinMs.toFixed(2)}`);
  lines.push(`- latency max (ms): ${args.summary.latencyMaxMs.toFixed(2)}`);
  lines.push(`- latency average (ms): ${args.summary.latencyAvgMs.toFixed(2)}`);
  lines.push(
    `- latency median (ms): ${args.summary.latencyMedianMs.toFixed(2)}`,
  );
  lines.push(
    `- fetch latency average (ms): ${args.summary.fetchLatencyAvgMs.toFixed(2)}`,
  );
  lines.push(
    `- completion latency average (ms): ${args.summary.completionLatencyAvgMs.toFixed(2)}`,
  );
  lines.push(
    `- cancel latency average (ms): ${args.summary.cancelLatencyAvgMs.toFixed(2)}`,
  );
  lines.push(
    `- rebook latency average (ms): ${args.summary.rebookLatencyAvgMs.toFixed(2)}`,
  );
  lines.push("");

  lines.push("## Errors");
  lines.push("");
  if (args.summary.errors.length === 0) {
    lines.push("- none");
  } else {
    for (const error of args.summary.errors) {
      lines.push(`- ${error}`);
    }
  }

  const absolutePath = path.resolve(args.outputPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${lines.join("\n")}\n`, "utf8");

  return absolutePath;
}
