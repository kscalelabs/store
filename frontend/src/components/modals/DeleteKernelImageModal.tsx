import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  kernelImageName: string;
}

export const DeleteKernelImageModal = ({
  isOpen,
  onClose,
  onDelete,
  kernelImageName,
}: Props) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border border-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Delete Kernel Image</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-11">
            Are you sure you want to delete the kernel image &quot;
            {kernelImageName}&quot;? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-9 text-gray-1 hover:bg-red-10"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteKernelImageModal;
