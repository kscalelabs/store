import { useState } from "react";

import { DeleteKernelImageModal } from "@/components/modals/DeleteKernelImageModal";
import { EditKernelImageModal } from "@/components/modals/EditKernelImageModal";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import axios from "axios";
import { Download, Edit, MoreVertical, Trash2 } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

interface Props {
  kernelImage: KernelImageResponse;
  onEdit: (
    kernelImageId: string,
    updatedData: Partial<KernelImageResponse>,
  ) => Promise<void>;
  onDelete: (kernelImageId: string) => Promise<void>;
}

const DownloadKernelImage = ({ kernelImage, onEdit, onDelete }: Props) => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDownload = async () => {
    if (!auth.isAuthenticated) {
      addErrorAlert("Please log in to download kernel images");
      return;
    }

    setIsDownloading(true);
    try {
      console.log(
        `Requesting download URL for kernel image ID: ${kernelImage.id}`,
      );
      const response = await axios.get(
        `/api/kernel-images/download/${kernelImage.id}`,
      );

      const presignedUrl = response.data;
      console.log(`Received presigned URL: ${presignedUrl}`);

      // Open the URL in a new tab
      window.open(presignedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading kernel image:", error);
      addErrorAlert("Error downloading kernel image");
    } finally {
      setIsDownloading(false);
    }
  };

  const canModify = auth.currentUser?.permissions?.some(
    (permission) => permission === "is_admin" || permission === "is_mod",
  );

  const handleEdit = async (updatedData: Partial<KernelImageResponse>) => {
    try {
      await onEdit(kernelImage.id, updatedData);
    } catch (error) {
      console.error("Error editing kernel image:", error);
      addErrorAlert("Error editing kernel image");
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(kernelImage.id);
    } catch (error) {
      console.error("Error deleting kernel image:", error);
      addErrorAlert("Error deleting kernel image");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <Card key={kernelImage.id}>
      <CardHeader className="space-y-2">
        <CardTitle className="flex justify-between items-center">
          {kernelImage.name}
          <div className="flex gap-1 items-center">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Kernel
            </Badge>
            {kernelImage.is_official && (
              <Badge variant="primary">Official</Badge>
            )}
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex flex-col gap-1 bg-gray-1">
                  <DropdownMenuItem
                    onClick={() => setIsEditModalOpen(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="cursor-pointer bg-red-500 text-gray-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardTitle>
        {kernelImage.description ? (
          <p className="text-sm text-muted-foreground">
            {kernelImage.description}
          </p>
        ) : (
          <div className="h-5" /> // Placeholder to maintain spacing
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-between text-sm text-gray-11">
          <span>Size: {(kernelImage.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>Downloads: {kernelImage.downloads}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleDownload}
          disabled={isDownloading || !auth.isAuthenticated}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading
            ? "Downloading..."
            : auth.isAuthenticated
              ? "Download"
              : "Sign In to Download"}
        </Button>
      </CardFooter>

      <EditKernelImageModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onEdit={handleEdit}
        kernelImage={kernelImage}
      />
      <DeleteKernelImageModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onDelete={handleDelete}
        kernelImageName={kernelImage.name}
      />
    </Card>
  );
};

export default DownloadKernelImage;
