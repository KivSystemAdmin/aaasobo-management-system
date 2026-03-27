import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const IMPORT_FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMPORT_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
];
const importUpload = multer({
  storage,
  limits: { fileSize: IMPORT_FILE_SIZE_LIMIT_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const hasZipExtension = /\.zip$/i.test(file.originalname);
    const isAllowedMime = ALLOWED_IMPORT_MIME_TYPES.includes(file.mimetype);

    if (!hasZipExtension || !isAllowedMime) {
      return callback(new Error("Only zip files are allowed"));
    }

    return callback(null, true);
  },
});

export const uploadAdminImportFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  importUpload.single("file")(req, res, (error: unknown) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        message: `Uploaded file exceeds max size of ${Math.floor(IMPORT_FILE_SIZE_LIMIT_BYTES / (1024 * 1024))}MB.`,
      });
    }
    if (error) {
      return res.status(400).json({
        message: "Invalid file upload.",
      });
    }
    return next();
  });
};

export default upload;
