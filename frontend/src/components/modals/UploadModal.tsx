import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, label: string, isOfficial: boolean) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState<string>("kernel");
  const [isOfficial, setIsOfficial] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUpload = () => {
    if (file) {
      onUpload(file, label, isOfficial);
      onClose();
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-2 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-12">
            Upload Resource
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-gray-12">File</Label>
            <div
              {...getRootProps()}
              className={`cursor-pointer text-gray-12 bg-gray-2 border-2 border-dashed border-gray-8 rounded-lg px-4 py-10 text-center ${
                isDragActive ? "border-blue-500" : ""
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">{file.name}</span>
                  <button onClick={removeFile} className="text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <p>
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag and drop a file here, or click to select a file"}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="label" className="text-sm font-medium text-gray-12">
              Resource Type
            </Label>
            <Select value={label} onValueChange={setLabel}>
              <SelectTrigger className="bg-gray-2 border-gray-3 text-gray-12">
                <SelectValue placeholder="Select a resource type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-2 border-gray-3">
                <SelectItem value="kernel" className="text-gray-12">
                  Kernel Image
                </SelectItem>
                <SelectItem value="urdf" className="text-gray-12">
                  URDF
                </SelectItem>
                <SelectItem value="ml" className="text-gray-12">
                  ML Model
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="official"
              className="text-sm font-medium text-gray-12 cursor-pointer"
            >
              Official Resource
            </Label>
            <Switch
              id="official"
              checked={isOfficial}
              onCheckedChange={setIsOfficial}
              className=""
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file}
            className="w-full sm:w-auto bg-primary-9 text-gray-1 hover:bg-gray-12"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Resource
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
