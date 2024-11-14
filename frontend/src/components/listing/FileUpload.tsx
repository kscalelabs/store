import {
  Dispatch,
  SetStateAction,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MouseEvent } from "react";
import {
  DropzoneOptions,
  DropzoneState,
  FileRejection,
  useDropzone,
} from "react-dropzone";

import { Input } from "@/components/ui/Input/Input";
import { buttonVariants } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { cn } from "@/lib/utils";
import { Trash2 as RemoveIcon } from "lucide-react";

type DirectionOptions = "rtl" | "ltr" | undefined;

type FileUploaderContextType = {
  dropzoneState: DropzoneState;
  isFileTooBig: boolean;
  removeFileFromSet: (index: number) => void;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  orientation: "horizontal" | "vertical";
  direction: DirectionOptions;
};

const FileUploaderContext = createContext<FileUploaderContextType | null>(null);

export const useFileUpload = () => {
  const context = useContext(FileUploaderContext);
  if (!context) {
    throw new Error("useFileUpload must be used within a FileUploaderProvider");
  }
  return context;
};

type FileUploaderProps = {
  value: File[] | null;
  reSelect?: boolean;
  onValueChange: (value: File[] | null) => void;
  dropzoneOptions: DropzoneOptions;
  orientation?: "horizontal" | "vertical";
};

export const FileUploader = forwardRef<
  HTMLDivElement,
  FileUploaderProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      dropzoneOptions,
      value,
      onValueChange,
      reSelect,
      orientation = "vertical",
      children,
      dir,
      ...props
    },
    ref,
  ) => {
    const { addErrorAlert } = useAlertQueue();

    const [isFileTooBig, setIsFileTooBig] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const {
      accept,
      maxSize = 4 * 1024 * 1024,
      multiple = true,
    } = dropzoneOptions;

    const direction: DirectionOptions = dir === "rtl" ? "rtl" : "ltr";

    const removeFileFromSet = useCallback(
      (i: number) => {
        if (!value) return;
        const newFiles = value.filter((_, index) => index !== i);
        onValueChange(newFiles);
      },
      [value, onValueChange],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!value) return;

        const moveNext = () => {
          const nextIndex = activeIndex + 1;
          setActiveIndex(nextIndex > value.length - 1 ? 0 : nextIndex);
        };

        const movePrev = () => {
          const nextIndex = activeIndex - 1;
          setActiveIndex(nextIndex < 0 ? value.length - 1 : nextIndex);
        };

        const prevKey =
          orientation === "horizontal"
            ? direction === "ltr"
              ? "ArrowLeft"
              : "ArrowRight"
            : "ArrowUp";

        const nextKey =
          orientation === "horizontal"
            ? direction === "ltr"
              ? "ArrowRight"
              : "ArrowLeft"
            : "ArrowDown";

        if (e.key === nextKey) {
          moveNext();
        } else if (e.key === prevKey) {
          movePrev();
        } else if (e.key === "Enter" || e.key === "Space") {
          if (activeIndex === -1) {
            dropzoneState.inputRef.current?.click();
          }
        } else if (e.key === "Delete" || e.key === "Backspace") {
          if (activeIndex !== -1) {
            removeFileFromSet(activeIndex);
            if (value.length - 1 === 0) {
              setActiveIndex(-1);
              return;
            }
            movePrev();
          }
        } else if (e.key === "Escape") {
          setActiveIndex(-1);
        }
      },
      [value, activeIndex, removeFileFromSet],
    );

    const onDrop = useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const files = acceptedFiles;

        if (!files) {
          addErrorAlert("There was an issue with the file.");
          return;
        }

        const newValues: File[] = value ? [...value] : [];

        if (reSelect) {
          newValues.splice(0, newValues.length);
        }

        files.forEach((file) => {
          newValues.push(file);
        });

        onValueChange(newValues);

        if (rejectedFiles.length > 0) {
          for (let i = 0; i < rejectedFiles.length; i++) {
            if (rejectedFiles[i].errors[0]?.code === "file-too-large") {
              addErrorAlert(
                `File is too large. The maximum size is ${maxSize / 1024 / 1024}MB.`,
              );
              break;
            }
            if (rejectedFiles[i].errors[0]?.message) {
              addErrorAlert(rejectedFiles[i].errors[0].message);
              break;
            }
          }
        }
      },
      [reSelect, value],
    );

    useEffect(() => {
      if (!value) return;
    }, [value]);

    const opts = dropzoneOptions
      ? dropzoneOptions
      : { accept, maxSize, multiple };

    const dropzoneState = useDropzone({
      ...opts,
      onDrop,
      onDropRejected: () => setIsFileTooBig(true),
      onDropAccepted: () => setIsFileTooBig(false),
    });

    return (
      <FileUploaderContext.Provider
        value={{
          dropzoneState,
          isFileTooBig,
          removeFileFromSet,
          activeIndex,
          setActiveIndex,
          orientation,
          direction,
        }}
      >
        <div
          ref={ref}
          tabIndex={0}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "grid w-full focus:outline-none overflow-hidden ",
            className,
            {
              "gap-2": value && value.length > 0,
            },
          )}
          dir={dir}
          {...props}
        >
          {children}
        </div>
      </FileUploaderContext.Provider>
    );
  },
);

FileUploader.displayName = "FileUploader";

export const FileUploaderContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { orientation } = useFileUpload();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn("w-full px-1")}
      ref={containerRef}
      aria-description="content file holder"
    >
      <div
        {...props}
        ref={ref}
        className={cn(
          "flex rounded-xl gap-1",
          orientation === "horizontal" ? "flex-raw flex-wrap" : "flex-col",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
});

FileUploaderContent.displayName = "FileUploaderContent";

export const FileUploaderItem = forwardRef<
  HTMLDivElement,
  { index: number } & React.HTMLAttributes<HTMLDivElement>
>(({ className, index, children, ...props }, ref) => {
  const { removeFileFromSet, activeIndex, direction } = useFileUpload();
  const isSelected = index === activeIndex;
  return (
    <div
      ref={ref}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-6 p-1 justify-between cursor-pointer",
        className,
        isSelected ? "bg-muted" : "",
      )}
      {...props}
    >
      <div className="font-medium leading-none tracking-tight flex items-center gap-1.5 h-full mr-6">
        {children}
      </div>
      <button
        type="button"
        className={cn("w-full", direction === "rtl" ? "top-1 left-1" : "top-1")}
        onClick={() => removeFileFromSet(index)}
      >
        <span className="sr-only">remove item {index}</span>
        <RemoveIcon className="w-4 h-4 hover:stroke-destructive duration-200 ease-in-out text-red-500" />
      </button>
    </div>
  );
});

FileUploaderItem.displayName = "FileUploaderItem";

export const FileInput = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { dropzoneState, isFileTooBig } = useFileUpload();
  const rootProps = dropzoneState.getRootProps();

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    rootProps.onClick?.(e);
  };

  return (
    <div ref={ref} {...props} className="relative w-full cursor-pointer">
      <div
        className={cn(
          `w-full rounded-lg duration-300 ease-in-out border-2 border-dashed
         ${
           dropzoneState.isDragAccept
             ? "border-green-500"
             : dropzoneState.isDragReject || isFileTooBig
               ? "border-red-500"
               : "border-gray-300"
         }`,
          className,
        )}
        {...rootProps}
        onClick={handleClick}
      >
        {children}
      </div>
      <Input ref={dropzoneState.inputRef} {...dropzoneState.getInputProps()} />
    </div>
  );
});

FileInput.displayName = "FileInput";

export const FileSubmitButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: "default" }),
        "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

FileSubmitButton.displayName = "FileSubmitButton";
