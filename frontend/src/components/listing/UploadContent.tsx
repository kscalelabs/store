// src/components/UploadContent.tsx
import { FC, useEffect } from "react";
import { XCircleFill } from "react-bootstrap-icons";
import ImageUploading, { ImageListType } from "react-images-uploading";

import { useAlertQueue } from "@/hooks/useAlertQueue";

interface UploadContentProps {
  images: ImageListType;
  onChange: (imageList: ImageListType) => void;
}

const UploadContent: FC<UploadContentProps> = ({ images, onChange }) => {
  const { addAlert } = useAlertQueue();
  const maxNumber = 10; // Set the maximum number of files allowed

  // Handle image pasting from the clipboard
  const handlePaste = (event: ClipboardEvent) => {
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return;

    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) {
          const newImageList = [
            ...images,
            { file, data_url: URL.createObjectURL(file) },
          ];
          onChange(newImageList);
          addAlert("Image pasted from clipboard!", "success");
        }
      }
    }
  };

  useEffect(() => {
    const pasteListener = (event: Event) =>
      handlePaste(event as ClipboardEvent);
    window.addEventListener("paste", pasteListener);
    return () => {
      window.removeEventListener("paste", pasteListener);
    };
  }, [images]);

  return (
    <ImageUploading
      multiple
      value={images}
      onChange={(imageList) => {
        onChange(imageList);
      }}
      maxNumber={maxNumber}
      dataURLKey="data_url"
    >
      {({ imageList, onImageUpload, onImageRemove, isDragging, dragProps }) => (
        <div>
          {/* Dropzone Area */}
          <div
            className={`
                border-2 border-dashed p-5 rounded-lg flex flex-col items-center justify-center h-64 transition-colors duration-300 hover:cursor-pointer hover:bg-gray-10 hover:border-gray-1
                ${
                  isDragging
                    ? "border-gray-1 bg-gray-10"
                    : "border-gray-5 bg-gray-11"
                }`}
            onClick={onImageUpload}
            {...dragProps}
          >
            <p className="text-gray-1">
              Click to select files or drag and drop images here
            </p>
          </div>

          {/* Display uploaded images below the dropzone */}
          <div className="mt-5 grid grid-cols-3 gap-4 w-full">
            {imageList.length > 0 ? (
              imageList.map((image, index) => (
                <div key={index} className="relative text-center">
                  <img
                    src={image["data_url"]}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg border border-gray-6"
                  />
                  <span
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600 transition-colors duration-200 cursor-pointer"
                    onClick={() => onImageRemove(index)}
                  >
                    <XCircleFill size={24} />
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-11 whitespace-nowrap">
                No images uploaded yet.
              </p>
            )}
          </div>
        </div>
      )}
    </ImageUploading>
  );
};

export default UploadContent;
