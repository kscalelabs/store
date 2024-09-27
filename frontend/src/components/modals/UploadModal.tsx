import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (
    file: File,
    name: string,
    imageType: string,
    description: string,
    isPublic: boolean,
  ) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [imageType, setImageType] = useState<string>("dockerfile");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setName(acceptedFiles[0].name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleUpload = useCallback(() => {
    if (file) {
      onUpload(file, name, imageType, description, isPublic);
      onClose();
    }
  }, [file, name, imageType, description, isPublic, onUpload, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Upload Kernel Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-8 hover:border-gray-12 hover:bg-gray-3 rounded-md px-4 py-6 text-center cursor-pointer"
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-between">
                <span>{file.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p>
                {isDragActive
                  ? "Drop the file here"
                  : "Click to select a file or drag and drop it here"}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-12">
              Kernel Image Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
            />
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="imageType"
              className="text-sm font-medium text-gray-12"
            >
              Image Type
            </Label>
            <Select value={imageType} onValueChange={setImageType}>
              <SelectTrigger className="bg-gray-2 border-gray-3 text-gray-12">
                <SelectValue placeholder="Select an image type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-2 border-gray-3">
                <SelectItem value="dockerfile" className="text-gray-12">
                  Dockerfile
                </SelectItem>
                <SelectItem value="singularity" className="text-gray-12">
                  Singularity
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-gray-12"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-2 border-gray-3 text-gray-12"
              rows={3}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2"
            />
            <Label
              htmlFor="isPublic"
              className="text-sm font-medium text-gray-12"
            >
              Make this kernel image public
            </Label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file}
            className="w-full sm:w-auto bg-primary-9 text-gray-1 hover:bg-gray-12"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload Kernel Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
