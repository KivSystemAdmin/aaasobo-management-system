import { Request, Response } from "express";
import {
  buildNormalizedPackageZip,
  normalizeRawScheduleCsvToPackage,
} from "../services/adminImportService";
import {
  getNormalizedImportJobZip,
  storeNormalizedImportJob,
} from "../services/adminImportJobStore";

export const normalizeImportSourceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ message: 'Missing file upload. Use field name "file".' });
    }

    const normalized = normalizeRawScheduleCsvToPackage(
      file.buffer.toString("utf-8"),
    );
    const zipBuffer = await buildNormalizedPackageZip(normalized.files);
    const jobId = storeNormalizedImportJob(zipBuffer);

    return res.status(200).json({
      jobId,
      ...normalized,
    });
  } catch (error) {
    console.error("Failed to normalize import source CSV", { error });
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Normalization failed",
    });
  }
};

export const downloadNormalizedImportPackageController = async (
  req: Request,
  res: Response,
) => {
  const { jobId } = req.params;
  const zipBuffer = getNormalizedImportJobZip(jobId);

  if (!zipBuffer) {
    return res.status(404).json({
      message: `Normalized import package "${jobId}" was not found or expired`,
    });
  }

  return res
    .status(200)
    .set("Content-Type", "application/zip")
    .set(
      "Content-Disposition",
      `attachment; filename="normalized-import-${jobId}.zip"`,
    )
    .send(zipBuffer);
};
