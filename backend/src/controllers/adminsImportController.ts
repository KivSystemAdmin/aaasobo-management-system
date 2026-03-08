import { Request, Response } from "express";
import {
  buildNormalizedPackageZip,
  executeNormalizedImportFiles,
  extractNormalizedFilesFromZip,
  getNormalizedImportJobZip,
  normalizeRawScheduleCsvToPackage,
  storeNormalizedImportJob,
  validateNormalizedImportFiles,
} from "../services/adminImport";

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

export const executeNormalizedImportController = async (
  req: Request,
  res: Response,
) => {
  try {
    const file = req.file;
    const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : "";

    let zipBuffer: Buffer | null = null;
    if (file) {
      zipBuffer = file.buffer;
    } else if (jobId) {
      zipBuffer = getNormalizedImportJobZip(jobId);
      if (!zipBuffer) {
        return res.status(404).json({
          message: `Normalized import package "${jobId}" was not found or expired`,
        });
      }
    }

    if (!zipBuffer) {
      return res.status(400).json({
        message:
          'Missing normalized package. Upload zip via field "file" or provide "jobId".',
      });
    }

    const files = await extractNormalizedFilesFromZip(zipBuffer);
    const validationResult = validateNormalizedImportFiles(files);

    if (!validationResult.isValid) {
      return res.status(400).json({
        message: "Normalized import validation failed",
        report: validationResult.report,
        issues: validationResult.issues,
      });
    }

    await executeNormalizedImportFiles(files);

    return res.status(200).json({
      message: "Normalized import executed successfully",
      imported: true,
      report: validationResult.report,
    });
  } catch (error) {
    console.error("Failed to execute normalized import", { error });
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Import execution failed",
    });
  }
};
