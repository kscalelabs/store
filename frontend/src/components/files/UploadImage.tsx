import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { useState } from "react";
import { Alert, Button, Col, Form } from "react-bootstrap";
import { v4 as uuid } from "uuid";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        setUploadStatus(null);
        if (file.size > MAX_FILE_SIZE) {
          setFileError(
            `File size should not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`,
          );
        } else {
          setSelectedFile(event.target.files[0]);
          setFileError(null);
        }
      } else {
        setFileError("No file selected");
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
    try {
      const robot_id = uuid();
      await auth_api.uploadImage(formData, robot_id + ".png");
      onUploadSuccess(robot_id);
      setUploadStatus("File uploaded successfully");
    } catch (error) {
      setUploadStatus("Failed to upload file");
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Col md="6">
      <Form>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Select Image</Form.Label>
          <Form.Control type="file" onChange={handleFileChange} accept=".png" />
        </Form.Group>
        {fileError && <Alert variant="danger">{fileError}</Alert>}
        <Button onClick={handleUpload} disabled={!selectedFile}>
          Upload
        </Button>
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
      </Form>
    </Col>
  );
};

export default ImageUploadComponent;
