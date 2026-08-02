import {
  type ImportExecuteResponse,
  type ImportNormalizeResponse,
} from "@shared/schemas/admins";

const FRONTEND_ORIGIN =
  process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "http://localhost:3000";

const PROXY_URL = `${FRONTEND_ORIGIN}/api/proxy`;

const normalizeErrorMessage = "Failed to normalize the source CSV";
const executeErrorMessage = "Failed to execute normalized import";
const downloadErrorMessage = "Failed to download normalized package";
const incrementalErrorMessage = "Failed to execute incremental import";

export interface AdminImportExecuteError extends Error {
  details?: unknown;
}

export const normalizeAdminImportSource = async (
  file: File,
): Promise<ImportNormalizeResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "backend-endpoint": "/admins/import/normalize",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : normalizeErrorMessage,
    );
  }

  return data as ImportNormalizeResponse;
};

export const downloadNormalizedImportPackage = async (
  jobId: string,
): Promise<Blob> => {
  const response = await fetch(
    `/api/admin-import/normalized/${jobId}/download`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(downloadErrorMessage);
  }

  return response.blob();
};

export const executeNormalizedImport = async ({
  jobId,
  file,
}: {
  jobId?: string;
  file?: File | null;
}): Promise<ImportExecuteResponse> => {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  } else if (jobId) {
    formData.append("jobId", jobId);
  } else {
    throw new Error(
      "Provide either a normalization job or normalized zip file.",
    );
  }

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "backend-endpoint": "/admins/import/execute",
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      typeof data?.message === "string" ? data.message : executeErrorMessage,
    ) as AdminImportExecuteError;
    error.details = data;
    throw error;
  }

  return data as ImportExecuteResponse;
};

export const executeIncrementalAdminImport = async (
  target: "customers" | "instructors",
  file: File,
): Promise<ImportExecuteResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "backend-endpoint": `/admins/import/incremental/${target}`,
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      typeof data?.message === "string"
        ? data.message
        : incrementalErrorMessage,
    ) as AdminImportExecuteError;
    error.details = data;
    throw error;
  }
  return data as ImportExecuteResponse;
};
