import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type PerformanceSummary = {
  elapsedMs: number;
  daysPassed: number;
  completedClasses: number;
  latencyMinMs: number;
  latencyMaxMs: number;
  latencyAvgMs: number;
  latencyMedianMs: number;
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
  lines.push(`- latency min (ms): ${args.summary.latencyMinMs.toFixed(2)}`);
  lines.push(`- latency max (ms): ${args.summary.latencyMaxMs.toFixed(2)}`);
  lines.push(`- latency average (ms): ${args.summary.latencyAvgMs.toFixed(2)}`);
  lines.push(
    `- latency median (ms): ${args.summary.latencyMedianMs.toFixed(2)}`,
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
