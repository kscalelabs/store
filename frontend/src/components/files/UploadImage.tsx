import imageCompression from "browser-image-compression";
import TCButton from "components/files/TCButton";
import { BACKEND_URL } from "constants/backend";
import { useTheme } from "hooks/theme";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Col, Modal } from "react-bootstrap";
import { FileWithPath, useDropzone } from "react-dropzone";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const MAX_FILE_SIZE = 25 * 1536 * 1536;
const MAX_FILE_MB = MAX_FILE_SIZE / 1024 / 1024;

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  imageId?: string | null;
}

const ImageUploadComponent: React.FC<ImageUploadProps> = ({ imageId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { theme } = useTheme();
  const validFileTypes = ["image/png", "image/jpeg", "image/jpg"];
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>();

  useEffect(() => {
    if (selectedFile) setImageUrl(URL.createObjectURL(selectedFile));
  }, [selectedFile]);

  useEffect(() => {
    if (imageId)
      setImageUrl(new URL(`/images/${imageId}/large`, BACKEND_URL).toString());
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
      setFileError(`File size should not exceed ${MAX_FILE_MB} MB`);
      setSelectedFile(null);
      return;
    }

    try {
      const theCompressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      setCompressedFile(theCompressedFile);
      setSelectedFile(file);
      setFileError(null);
    } catch (error) {
      console.error("Error compressing the image:", error);
      setFileError("Error compressing the image");
      setSelectedFile(null);
    }
    setShowModal(true);
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
    if (compressedFile === null) {
      setUploadStatus("No file selected");
      return;
    }

    // TODO: Make this work.
    // await auth.client.POST("/artifacts/upload", {
    //   body: {
    //     file: compressedFile,
    //   },
    // });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (imageUrl) {
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
    if (imageUrl) setInitialSetter(true);
  }, [showModal]);

  return (
    <Col md="6">
      <Modal show={showModal} onHide={onModalHide} centered>
        <Modal.Body>
          {imageUrl ? (
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
                  src={imageUrl}
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
                <TCButton
                  style={{ marginLeft: "1em" }}
                  onClick={handleDone}
                  variant="primary"
                >
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
            cursor: imageUrl ? "pointer" : "default",
          }}
          onClick={handleClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
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
              disabled={imageUrl ? false : true}
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
      <TCButton onClick={handleUpload} disabled={!imageUrl} className="my-3">
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
