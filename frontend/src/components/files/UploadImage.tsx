import imageCompression from "browser-image-compression";
import TCButton from "components/files/TCButton";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useTheme } from "hooks/theme";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Col, Modal } from "react-bootstrap";
import { FileWithPath, useDropzone } from "react-dropzone";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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
  const { theme } = useTheme();
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const validFileTypes = ["image/png", "image/jpeg", "image/jpg"];
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

    try {
      const thecompressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      setCompressedFile(thecompressedFile);
      setSelectedFile(file);
      setFileError(null);
    } catch (error) {
      console.error("Error compressing the image:", error);
      setFileError("Error compressing the image");
      setSelectedFile(null);
    }
  };

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFileChange(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "image/jpg": [] },
    maxSize: MAX_FILE_SIZE,
  });

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

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedFile) {
      setShowModal(true);
    } else {
      triggerFileInput();
    }
  };

  const onModalHide = () => {
    setShowModal(false);
  };

  const [initialSetter, setInitialSetter] = useState(false);

  const handleImageLoaded = (
    event: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    imgRef.current = event.currentTarget;
    if (event.currentTarget && initialSetter) {
      setInitialSetter(false);
      setCrop({
        height: imgRef.current.height,
        unit: "px",
        width: imgRef.current.width,
        x: 0,
        y: 0,
      });
    }
  };

  const handleCropComplete = (crop: Crop) => {
    setCompletedCrop(crop);
  };

  const handleDone = async () => {
    if (completedCrop && imgRef.current) {
      const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
      setSelectedFile(croppedImage);
      setShowModal(false);
    }
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: Crop,
  ): Promise<File> => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      );
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas is empty");
          reject();
          return;
        }
        const file = new File([blob], selectedFile!.name, {
          type: selectedFile!.type,
        });
        resolve(file);
      }, "image/jpeg");
    });
  };

  useEffect(() => {
    if (selectedFile) setInitialSetter(true);
  }, [showModal]);

  return (
    <Col md="6">
      <Modal show={showModal} onHide={onModalHide} centered>
        <Modal.Body>
          {selectedFile ? (
            <>
              <ReactCrop
                crop={crop}
                aspect={1}
                onChange={(c) => {
                  console.log(c);
                  setCrop(c);
                }}
                onComplete={handleCropComplete}
              >
                <img
                  src={URL.createObjectURL(selectedFile)}
                  onLoad={handleImageLoaded}
                  alt="Crop preview"
                />
              </ReactCrop>
              <div className="d-flex justify-content-end mt-3">
                <TCButton
                  onClick={onModalHide}
                  variant="secondary"
                  className="mr-2"
                >
                  Close
                </TCButton>
                <TCButton onClick={handleDone} variant="primary">
                  Done
                </TCButton>
              </div>
            </>
          ) : (
            <p>No file selected</p>
          )}
        </Modal.Body>
      </Modal>
      <div
        {...getRootProps({ onClick: (event) => event.preventDefault() })}
        style={{
          border: isDragActive ? "2px dashed #000" : "2px dashed transparent",
          borderRadius: "5px",
          textAlign: "center",
        }}
        className="m-0"
      >
        <input
          {...getInputProps()}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <div
          style={{
            height: "200px",
            border: "2px solid #ddd",
            borderRadius: "5px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "10px",
            overflow: "hidden",
            cursor: selectedFile ? "pointer" : "default",
          }}
          onClick={handleClick}
        >
          {selectedFile ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            <p>No file selected</p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              minWidth: "100px",
              width: "20%",
              marginRight: "15px",
            }}
          >
            <TCButton
              onClick={(event) => {
                event.stopPropagation();
                setShowModal(true);
              }}
              disabled={selectedFile ? false : true}
              variant={theme === "dark" ? "outline-light" : "outline-dark"}
            >
              Edit
            </TCButton>
          </div>
          <TCButton
            onClick={triggerFileInput}
            variant={theme === "dark" ? "outline-light" : "outline-dark"}
          >
            {" "}
            Select Image{" "}
          </TCButton>
        </div>
        {fileError && <Alert variant="danger">{fileError}</Alert>}
      </div>
      <TCButton
        onClick={handleUpload}
        disabled={!selectedFile}
        className="my-3"
      >
        Upload
      </TCButton>
      {uploadStatus && (
        <Alert
          variant={uploadStatus.includes("successfully") ? "success" : "danger"}
          className="mt-3"
        >
          {uploadStatus}
        </Alert>
      )}
    </Col>
  );
};

export default ImageUploadComponent;
