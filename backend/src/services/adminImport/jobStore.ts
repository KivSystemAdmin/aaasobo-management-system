import { randomUUID } from "node:crypto";

const DEFAULT_TTL_MS = 60 * 60 * 1000;

interface NormalizedJobEntry {
  zipBuffer: Buffer;
  expiresAt: number;
}

const jobs = new Map<string, NormalizedJobEntry>();

function cleanupExpiredJobs(now = Date.now()) {
  for (const [jobId, entry] of jobs.entries()) {
    if (entry.expiresAt <= now) {
      jobs.delete(jobId);
    }
  }
}

export function storeNormalizedImportJob(zipBuffer: Buffer): string {
  cleanupExpiredJobs();
  const jobId = randomUUID();
  jobs.set(jobId, {
    zipBuffer,
    expiresAt: Date.now() + DEFAULT_TTL_MS,
  });
  return jobId;
}

export function getNormalizedImportJobZip(jobId: string): Buffer | null {
  cleanupExpiredJobs();
  const entry = jobs.get(jobId);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    jobs.delete(jobId);
    return null;
  }
  return entry.zipBuffer;
}
