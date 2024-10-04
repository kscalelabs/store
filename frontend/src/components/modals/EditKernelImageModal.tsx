import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { components } from "@/gen/api";
import { Save } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (updatedData: Partial<KernelImageResponse>) => Promise<void>;
  kernelImage: KernelImageResponse;
}

export const EditKernelImageModal = ({
  isOpen,
  onOpenChange,
  onEdit,
  kernelImage,
}: Props) => {
  const [name, setName] = useState(kernelImage.name);
  const [description, setDescription] = useState(kernelImage.description || "");
  const [isPublic, setIsPublic] = useState(kernelImage.is_public);
  const [isOfficial, setIsOfficial] = useState(kernelImage.is_official);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: Partial<KernelImageResponse> = {
      name,
      description,
      is_public: isPublic,
      is_official: isOfficial,
    };
    await onEdit(updatedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Edit Kernel Image</DialogTitle>
          <DialogDescription className="text-gray-11">
            You can not edit the kernel image file itself (only the below
            details). Delete and re-upload to change file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-12"
              >
                Name
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
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isOfficial"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
                className="mr-2"
              />
              <Label
                htmlFor="isOfficial"
                className="text-sm font-medium text-gray-12"
              >
                Mark as official kernel image
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-9 text-gray-1 hover:bg-gray-12"
            >
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditKernelImageModal;
