import { useEffect, useState } from "react";

import DownloadKernelImage from "@/components/DownloadKernelImage";
import LoadingArtifactCard from "@/components/listing/artifacts/LoadingArtifactCard";
import { UploadModal } from "@/components/modals/UploadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { Search, Upload } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

export default function DownloadsPage() {
  const auth = useAuthentication();
  const { addErrorAlert, addAlert } = useAlertQueue();
  const [kernelImages, setKernelImages] = useState<KernelImageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("is_public", isPublic.toString());
      formData.append("is_official", isOfficial.toString());

      const response = await auth.client.POST("/kernel-images/upload", {
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.error) {
        console.error("Upload failed:", response.error);
        addErrorAlert(
          `Upload failed: ${response.error instanceof Error ? response.error.message : String(response.error)}`,
        );
      } else {
        console.log("Upload successful:", response.data);
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

  const filteredKernelImages = kernelImages.filter(
    (ki) =>
      ki.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      activeTab === "kernel",
  );

  // Check if the user has admin or moderator permissions
  const canUpload =
    auth.currentUser?.permissions?.some(
      (permission) => permission === "is_admin" || permission === "is_mod",
    ) || false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 rounded-lg">
      <h1 className="text-3xl font-bold mb-2">K-Scale Downloads</h1>
      <p className="text-muted-foreground mb-6">
        View and download official K-Scale and community uploaded kernel images
      </p>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {canUpload && (
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        )}
      </div>

      <Tabs defaultValue="kernel" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kernel">Kernel Images</TabsTrigger>
          <TabsTrigger value="ml">ML</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKernelImages.map((kernelImage) => (
          <DownloadKernelImage key={kernelImage.id} kernelImage={kernelImage} />
        ))}
        {isLoading && (
          <>
            <LoadingArtifactCard />
            <LoadingArtifactCard />
            <LoadingArtifactCard />
          </>
        )}
      </div>

      {canUpload && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
