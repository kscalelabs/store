import { useCallback, useEffect, useState } from "react";

import DownloadKernelImage from "@/components/DownloadKernelImage";
import LoadingArtifactCard from "@/components/listing/artifacts/LoadingArtifactCard";
import { UploadKernelImageModal } from "@/components/modals/UploadKerenlImageModal";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { Upload } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

export default function DownloadsPage() {
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();
  const [kernelImages, setKernelImages] = useState<KernelImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("kernel");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchKernelImages = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await auth.client.GET("/kernel-images/public", {});
      if (response.data) {
        setKernelImages(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch kernel images:", error);
      addErrorAlert("Failed to fetch kernel images");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKernelImages();
  }, []);

  const handleUpload = async (
    file: File,
    name: string,
    description: string,
    isPublic: boolean,
    isOfficial: boolean,
  ) => {
    try {
      // Convert File to base64 string
      const fileBase64 = await fileToBase64(file);

      // Remove the data URL prefix if present
      const base64Content = fileBase64.split(",")[1] || fileBase64;

      // Create the request body object with the correct types
      const requestBody = {
        name,
        file: base64Content,
        is_public: isPublic,
        is_official: isOfficial,
        description: description || null, // Handle empty description
      };

      const response = await auth.client.POST("/kernel-images/upload", {
        body: requestBody,
        headers: {
          "Content-Type": "application/json", // Changed to JSON
        },
      });

      if (response.error) {
        console.error("Upload failed:", response.error);
        addErrorAlert(
          `Upload failed: ${response.error instanceof Error ? response.error.message : String(response.error)}`,
        );
      } else {
        addAlert("Kernel image uploaded successfully", "success");
        setKernelImages((prevKernelImages) => [
          response.data as KernelImageResponse,
          ...prevKernelImages,
        ]);
        setIsUploadModalOpen(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      addErrorAlert("Upload failed");
    }
  };

  const handleEdit = useCallback(
    async (
      kernelImageId: string,
      updatedData: Partial<KernelImageResponse>,
    ) => {
      try {
        const response = await auth.client.PUT(
          "/kernel-images/edit/{kernel_image_id}",
          {
            params: {
              path: { kernel_image_id: kernelImageId },
            },
            body: updatedData as Record<string, never>,
          },
        );
        if (response.error) {
          addErrorAlert(`Failed to update kernel image: ${response.error}`);
        } else {
          addAlert("Kernel image updated successfully", "success");
          setKernelImages((prevImages) =>
            prevImages.map((img) =>
              img.id === kernelImageId ? { ...img, ...updatedData } : img,
            ),
          );
        }
      } catch (error) {
        console.error("Error updating kernel image:", error);
        addErrorAlert("Error updating kernel image");
      }
    },
    [auth.client, addErrorAlert, addAlert],
  );

  const handleDelete = useCallback(
    async (kernelImageId: string) => {
      try {
        const response = await auth.client.DELETE(
          "/kernel-images/delete/{kernel_image_id}",
          {
            params: {
              path: { kernel_image_id: kernelImageId },
            },
          },
        );
        if (response.error) {
          addErrorAlert(`Failed to delete kernel image: ${response.error}`);
        } else {
          addAlert("Kernel image deleted successfully", "success");
          setKernelImages((prevImages) =>
            prevImages.filter((img) => img.id !== kernelImageId),
          );
        }
      } catch (error) {
        console.error("Error deleting kernel image:", error);
        addErrorAlert("Error deleting kernel image");
      }
    },
    [auth.client, addErrorAlert, addAlert],
  );

  // Check if the user has admin or moderator permissions
  const canUpload =
    auth.currentUser?.permissions?.some(
      (permission) => permission === "is_admin" || permission === "is_mod",
    ) || false;

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        {canUpload && (
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        )}
      </div>

      <Tabs defaultValue="kernel" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kernel">Kernel Images</TabsTrigger>
          <TabsTrigger value="ml">ML Weights</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <LoadingArtifactCard />
            <LoadingArtifactCard />
            <LoadingArtifactCard />
          </>
        ) : (
          kernelImages.map((kernelImage) => (
            <DownloadKernelImage
              key={kernelImage.id}
              kernelImage={kernelImage}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {canUpload && (
        <UploadKernelImageModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </Container>
  );
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
