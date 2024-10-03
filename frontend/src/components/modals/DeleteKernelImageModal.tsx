import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  kernelImageName: string;
}

export const DeleteKernelImageModal = ({
  isOpen,
  onOpenChange,
  onDelete,
  kernelImageName,
}: Props) => {
  const handleDelete = async () => {
    await onDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-1 text-gray-12 border bodrder-gray-3 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle>Delete Kernel Image</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the kernel image &quot;
            {kernelImageName}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteKernelImageModal;
