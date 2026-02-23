"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/elements/modal/Modal";
import {
  downloadNormalizedImportPackage,
  executeNormalizedImport,
  normalizeAdminImportSource,
  type AdminImportExecuteError,
} from "@/lib/api/adminImportApi";
import {
  type ImportExecuteErrorResponse,
  type ImportExecuteResponse,
  type ImportNormalizeResponse,
} from "@shared/schemas/admins";
import styles from "./DataImportDashboard.module.scss";

export default function DataImportDashboard({ adminId }: { adminId: number }) {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [normalizedZipFile, setNormalizedZipFile] = useState<File | null>(null);
  const [normalizeResult, setNormalizeResult] =
    useState<ImportNormalizeResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<ImportExecuteResponse | null>(
    null,
  );
  const [executeIssues, setExecuteIssues] = useState<
    ImportExecuteErrorResponse["issues"]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [executeErrorMessage, setExecuteErrorMessage] = useState<string>("");
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isExecutingImport, setIsExecutingImport] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const normalizedRowsByFile = useMemo(() => {
    if (!normalizeResult) {
      return [];
    }

    return Object.entries(normalizeResult.report.normalizedRowsByFile).sort(
      ([a], [b]) => a.localeCompare(b),
    );
  }, [normalizeResult]);

  const executeRowsByFile = useMemo(() => {
    if (!executeResult) {
      return [];
    }

    return Object.entries(executeResult.report.rowsByFile).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [executeResult]);

  const handleNormalize = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sourceFile) {
      setErrorMessage("Please select a CSV file to normalize.");
      return;
    }

    setIsNormalizing(true);
    setErrorMessage("");
    setNormalizeResult(null);
    setExecuteResult(null);
    setExecuteErrorMessage("");
    setExecuteIssues([]);

    try {
      const result = await normalizeAdminImportSource(sourceFile);
      setNormalizeResult(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Normalization failed";
      setErrorMessage(message);
    } finally {
      setIsNormalizing(false);
    }
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadNormalizedZip = async () => {
    if (!normalizeResult?.jobId) {
      setErrorMessage("Run normalization first to download a package.");
      return;
    }

    setIsDownloadingZip(true);
    setErrorMessage("");
    try {
      const blob = await downloadNormalizedImportPackage(normalizeResult.jobId);
      triggerDownload(blob, `normalized-import-${normalizeResult.jobId}.zip`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      setErrorMessage(message);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const openExecuteModal = () => {
    if (!normalizedZipFile && !normalizeResult?.jobId) {
      setExecuteErrorMessage(
        "Provide a normalized zip file or run normalization first.",
      );
      return;
    }
    setExecuteErrorMessage("");
    setIsConfirmModalOpen(true);
  };

  const handleExecuteImport = async () => {
    setIsExecutingImport(true);
    setExecuteResult(null);
    setExecuteIssues([]);
    setExecuteErrorMessage("");

    try {
      const result = await executeNormalizedImport({
        file: normalizedZipFile,
        jobId: normalizedZipFile ? undefined : normalizeResult?.jobId,
      });
      setExecuteResult(result);
      setIsConfirmModalOpen(false);
    } catch (error) {
      const typedError = error as AdminImportExecuteError;
      const message =
        typedError instanceof Error
          ? typedError.message
          : "Import execution failed";
      setExecuteErrorMessage(message);

      const details = typedError.details as
        | ImportExecuteErrorResponse
        | undefined;
      if (details?.issues) {
        setExecuteIssues(details.issues);
      }
    } finally {
      setIsExecutingImport(false);
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1>Data Import</h1>
        <p className={styles.subText}>
          Normalize a raw CSV export, download the normalized zip, and execute a
          full destructive import.
        </p>
        <p className={styles.subText}>Admin ID: {adminId}</p>
      </header>

      <div className={styles.formSection}>
        <h2>1) Normalize raw CSV</h2>
        <form className={styles.form} onSubmit={handleNormalize}>
          <label className={styles.fileInputLabel} htmlFor="raw-import-file">
            Raw source CSV
          </label>
          <input
            id="raw-import-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setSourceFile(event.target.files?.[0] ?? null);
            }}
          />
          <button
            className={styles.normalizeButton}
            type="submit"
            disabled={isNormalizing}
          >
            {isNormalizing ? "Normalizing..." : "Run normalization"}
          </button>
        </form>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {normalizeResult && (
        <div className={styles.report}>
          <h2>Normalization Report</h2>
          <p>
            <strong>Job ID:</strong>{" "}
            <span className={styles.jobId}>{normalizeResult.jobId}</span>
          </p>
          <p>
            <strong>Raw rows:</strong> {normalizeResult.report.rawRows}
          </p>
          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              onClick={handleDownloadNormalizedZip}
              disabled={isDownloadingZip}
              type="button"
            >
              {isDownloadingZip ? "Downloading..." : "Download normalized zip"}
            </button>
          </div>

          <h3>Rows By File</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File</th>
                <th>Rows</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRowsByFile.map(([fileName, rowCount]) => (
                <tr key={fileName}>
                  <td>{fileName}</td>
                  <td>{rowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Generated Customer Emails</h3>
          {normalizeResult.report.generatedCustomerEmails.length === 0 ? (
            <p>None</p>
          ) : (
            <ul className={styles.list}>
              {normalizeResult.report.generatedCustomerEmails.map((item) => (
                <li key={`${item.row}:${item.generatedEmail}`}>
                  Row {item.row}: {item.customerName} ({item.generatedEmail})
                </li>
              ))}
            </ul>
          )}

          <h3>Warnings</h3>
          {normalizeResult.report.warnings.length === 0 ? (
            <p>None</p>
          ) : (
            <ul className={styles.list}>
              {normalizeResult.report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.formSection}>
        <h2>2) Execute import</h2>
        <form className={styles.form}>
          <label className={styles.fileInputLabel} htmlFor="normalized-zip-file">
            Normalized package zip (optional if you already normalized above)
          </label>
          <input
            id="normalized-zip-file"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => {
              setNormalizedZipFile(event.target.files?.[0] ?? null);
            }}
          />
          <button
            className={styles.executeButton}
            type="button"
            onClick={openExecuteModal}
          >
            Execute import
          </button>
        </form>
      </div>

      {executeErrorMessage && <p className={styles.error}>{executeErrorMessage}</p>}

      {executeIssues.length > 0 && (
        <div className={styles.report}>
          <h3>Validation Issues</h3>
          <ul className={styles.list}>
            {executeIssues.map((issue, index) => (
              <li key={`${issue.file}:${issue.row}:${issue.column}:${index}`}>
                [{issue.file}] row {issue.row ?? "-"}, column {issue.column ?? "-"}
                : {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {executeResult && (
        <div className={styles.report}>
          <h2>Import Result</h2>
          <p>{executeResult.message}</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File</th>
                <th>Imported Rows</th>
              </tr>
            </thead>
            <tbody>
              {executeRowsByFile.map(([fileName, rowCount]) => (
                <tr key={fileName}>
                  <td>{fileName}</td>
                  <td>{rowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        overlayClosable={true}
      >
        <div className={styles.confirmModal}>
          <h3>Confirm destructive import</h3>
          <p>
            This will fully reset existing import-target data and replace it with
            this package.
          </p>
          <p>
            Seed admins are preserved, but other data may be permanently removed.
          </p>
          <div className={styles.modalActions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isExecutingImport}
            >
              Cancel
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={handleExecuteImport}
              disabled={isExecutingImport}
            >
              {isExecutingImport ? "Importing..." : "Yes, execute import"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
