"use client";

import React, { ChangeEvent, DragEvent, useRef, useState } from "react";
import styles from "./Uploader.module.scss";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

type UploaderProps = {
  label?: string;
};

function Uploader({ label }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] as File;
    const url = URL.createObjectURL(e.target.files?.[0] as File);
    setFile(selectedFile);
    setFileName(url);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0] as File;
    const url = URL.createObjectURL(e.dataTransfer.files?.[0] as File);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(droppedFile);
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
    }
    setFile(droppedFile);
    setFileName(url);
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className={styles.dragDrop}>
      {label && <p className={styles.label}>Instructor profile image</p>}
      <div
        className={`${styles.documentUploader} ${isDragging ? styles.dragging : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <PhotoIcon width={50} height={50} color="#ccc" />
        <div className={styles.uploadInfo}>
          <div>
            <p>Drop instructor&apos;s profile image here, or&nbsp;</p>
          </div>
          <label htmlFor="icon" className={styles.uploadBtn}>
            Browse
            <input
              type="file"
              id="icon"
              name="icon"
              ref={fileInputRef}
              accept=".png,.jpg"
              onChange={handleFileChange}
              hidden
            />
          </label>
        </div>
        <p>Supports: JPG and PNG formats (up to 5MB)</p>
      </div>

      {file && (
        <div className={styles.successFile}>
          <div className={styles.successFileInfo}>
            <Image
              src={fileName}
              width={50}
              height={50}
              alt="Uploaded content"
            />
            <p>{file.name}</p>
          </div>
          <p className={styles.fileActions} onClick={handleRemoveFile}>
            ×
          </p>
        </div>
      )}
    </section>
  );
}

export default Uploader;
