import { useState } from "react";
import { redirect } from "react-router-dom";

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
import { Download } from "lucide-react";
import { Edit, MoreVertical, Trash2 } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

interface Props {
  kernelImage: KernelImageResponse;
}

const DownloadKernelImage = ({ kernelImage }: Props) => {
  const { addErrorAlert, addAlert } = useAlertQueue();
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
      const response = await axios.get(
        `/api/kernel-images/download/${kernelImage.id}`,
      );

      const presignedUrl = response.data;

      redirect(presignedUrl);
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
      const response = await auth.client.PUT(
        "/kernel-images/edit/{kernel_image_id}",
        {
          params: {
            path: { kernel_image_id: kernelImage.id },
          },
          body: updatedData,
        },
      );
      if (response.error) {
        addErrorAlert(`Failed to update kernel image: ${response.error}`);
      } else {
        addAlert("Kernel image updated successfully", "success");
        // Update the kernelImage state or refetch the data
      }
    } catch (error) {
      console.error("Error updating kernel image:", error);
      addErrorAlert("Error updating kernel image");
    }
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    try {
      const response = await auth.client.DELETE(
        "/kernel-images/delete/{kernel_image_id}",
        {
          params: {
            path: { kernel_image_id: kernelImage.id },
          },
        },
      );
      if (response.error) {
        addErrorAlert(`Failed to delete kernel image: ${response.error}`);
      } else {
        addAlert("Kernel image deleted successfully", "success");
        // Remove the kernelImage from the list or refetch the data
      }
    } catch (error) {
      console.error("Error deleting kernel image:", error);
      addErrorAlert("Error deleting kernel image");
    }
    setIsDeleteModalOpen(false);
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
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
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
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleEdit}
        kernelImage={kernelImage}
      />
      <DeleteKernelImageModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        kernelImageName={kernelImage.name}
      />
    </Card>
  );
};

export default DownloadKernelImage;
