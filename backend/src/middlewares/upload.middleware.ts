import multer from "multer";
import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const IMPORT_FILE_SIZE_LIMIT_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMPORT_ZIP_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
];
const ALLOWED_IMPORT_CSV_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
];

const createImportUpload = (options: {
  allowedExtensions: RegExp;
  allowedMimeTypes: readonly string[];
  invalidTypeMessage: string;
}) =>
  multer({
    storage,
    limits: { fileSize: IMPORT_FILE_SIZE_LIMIT_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => {
      const hasAllowedExtension = options.allowedExtensions.test(
        file.originalname,
      );
      const isAllowedMime = options.allowedMimeTypes.includes(file.mimetype);

      if (!hasAllowedExtension || !isAllowedMime) {
        return callback(new Error(options.invalidTypeMessage));
      }

      return callback(null, true);
    },
  });

const importZipUpload = createImportUpload({
  allowedExtensions: /\.zip$/i,
  allowedMimeTypes: ALLOWED_IMPORT_ZIP_MIME_TYPES,
  invalidTypeMessage: "Only zip files are allowed",
});

const importCsvUpload = createImportUpload({
  allowedExtensions: /\.csv$/i,
  allowedMimeTypes: ALLOWED_IMPORT_CSV_MIME_TYPES,
  invalidTypeMessage: "Only csv files are allowed",
});

const uploadSingleFile = (
  uploadMiddleware: ReturnType<typeof multer>,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadMiddleware.single("file")(req, res, (error: unknown) => {
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

const importUpload = createImportUpload({
  allowedExtensions: /\.(zip|csv)$/i,
  allowedMimeTypes: [
    ...ALLOWED_IMPORT_ZIP_MIME_TYPES,
    ...ALLOWED_IMPORT_CSV_MIME_TYPES,
  ],
  invalidTypeMessage: "Only zip or csv files are allowed",
});

export const uploadAdminImportSourceFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadSingleFile(importCsvUpload, req, res, next);
};

export const uploadAdminImportZipFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  uploadSingleFile(importZipUpload, req, res, next);
};

export default upload;
