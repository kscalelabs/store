import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import React, { useState } from "react";
import { Alert, Button, Col, Form } from "react-bootstrap";
import { v4 as uuid } from "uuid";
import imageCompression from 'browser-image-compression';

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
    const auth = useAuthentication();
    const auth_api = new api(auth.api);
    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0];
            if (file) {
                setUploadStatus(null);
                if (file.size > MAX_FILE_SIZE) {
                    setFileError(
                        `File size should not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`,
                    );
                } else {
                    const options = {
                        maxSizeMB: .01, // Maximum size in MB
                        maxWidthOrHeight: 800, // Maximum width or height in pixels
                        useWebWorker: true, // Use multi-threading for compression
                    };
                    try {
                        const thecompressedFile = await imageCompression(file, options);
                        setCompressedFile(thecompressedFile);
                    } catch (error) {
                        console.error('Error compressing the image:', error);
                        setFileError('Error compressing the image');
                    }
                    setSelectedFile(file);
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
        if (!selectedFile || !compressedFile) {
            setUploadStatus("No file selected");
            return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        const compressedFormData = new FormData();
        compressedFormData.append("file", compressedFile);
        try {
            const robot_id = uuid();
            await auth_api.uploadImage(formData, robot_id + ".png");
            await auth_api.uploadImage(compressedFormData, "mini" + robot_id + ".png")
            onUploadSuccess(robot_id);
            setUploadStatus("File uploaded successfully");
        } catch (error) {
            setUploadStatus("Failed to upload file");
            console.error("Error uploading file:", error);
        }
    };

    return (
        <Col md="6">
            <div>
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
            </div>
        </Col>
    );
};

export default ImageUploadComponent;
