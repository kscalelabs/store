import TCButton from "components/files/TCButton";
import { APICalls } from "hooks/ApiCalls";
import { useTheme } from "hooks/theme";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Col } from "react-bootstrap";

interface URDFUploadProps {
  listingId: string;
}

const URDFUploadComponent = (props: URDFUploadProps) => {
  const { listingId } = props;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const { theme } = useTheme();
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / 1024 / 1024;
  const validFileTypes = ["application/gzip"];

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
      setFileError("Only .tar.gz archives are allowed");
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size should not exceed ${MAX_FILE_SIZE_MB} MB`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFileError(null);
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
    if (!selectedFile) {
      setUploadStatus("No file selected");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);

    const { error } = await APICalls.upload(selectedFile, {
      artifact_type: "urdf",
      listing_id: listingId,
    });

    if (error) {
      setUploadStatus("Failed to upload file");
      console.error("Error uploading file:", error);
    } else {
      setUploadStatus("File uploaded successfully");
      // onUploadSuccess(response.url);
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
          accept=".tar.gz"
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

export default URDFUploadComponent;
