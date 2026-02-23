import { Request, Response } from "express";
import { normalizeRawScheduleCsvToPackage } from "../services/adminImportService";

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

    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Failed to normalize import source CSV", { error });
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Normalization failed",
    });
  }
};
