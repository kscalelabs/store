import imageCompression from "browser-image-compression";
import TCButton from "components/files/TCButton";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Col } from "react-bootstrap";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { theme } = useTheme();
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const validFileTypes = ["image/png", "image/jpeg", "image/jpg"];

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleWindowDrop = async (event: DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer?.files[0];
      if (file) {
        handleFileChange(file);
      }
    };

    const handleWindowDragOver = (event: DragEvent) => {
      event.preventDefault();
      setDragOver(true);
    };

    const handleWindowDragLeave = () => {
      setDragOver(false);
    };

    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);

    return () => {
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
    };
  }, []);

  const handleFileChange = async (file: File) => {
    setUploadStatus(null);

    // Validate file type
    if (!validFileTypes.includes(file.type)) {
      setFileError("Only PNG, JPG, and JPEG files are allowed");
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File size should not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`,
      );
      setSelectedFile(null);
      return;
    }

    const options = {
      maxSizeMB: 0.2, // Maximum size in MB
      maxWidthOrHeight: 800, // Maximum width or height in pixels
      useWebWorker: true, // Use multi-threading for compression
    };

    try {
      const thecompressedFile = await imageCompression(file, options);
      setCompressedFile(thecompressedFile);
      setSelectedFile(file);
      setFileError(null);
    } catch (error) {
      console.error("Error compressing the image:", error);
      setFileError("Error compressing the image");
      setSelectedFile(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        handleFileChange(file);
      }
    }
  };

  const handleUpload = async () => {
    if (fileError) {
      setUploadStatus("Failed to upload file");
      return;
    }
    if (!selectedFile || !compressedFile) {
      setUploadStatus("No file selected");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    const compressedFormData = new FormData();
    compressedFormData.append("file", compressedFile);
    try {
      const image_id = await auth_api.uploadImage(formData);
      onUploadSuccess(image_id);
      setUploadStatus("File uploaded successfully");
    } catch (error) {
      setUploadStatus("Failed to upload file");
      console.error("Error uploading file:", error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Col md="6">
      <div
        className="mb-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: dragOver ? "2px dashed #000" : "2px dashed transparent",
          borderRadius: "5px",
        }}
      >
        <TCButton
          className="mb-3"
          onClick={triggerFileInput}
          variant={theme === "dark" ? "outline-light" : "outline-dark"}
        >
          {selectedFile ? selectedFile.name : "No file chosen"}
        </TCButton>
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileInputChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        {fileError && <Alert variant="danger">{fileError}</Alert>}
        <TCButton onClick={handleUpload} disabled={!selectedFile}>
          Upload
        </TCButton>
        {uploadStatus && (
          <Alert
            variant={
              uploadStatus.includes("successfully") ? "success" : "danger"
            }
            className="mt-3"
          >
            {uploadStatus}
          </Alert>
        )}
      </div>
    </Col>
  );
};

export default ImageUploadComponent;
