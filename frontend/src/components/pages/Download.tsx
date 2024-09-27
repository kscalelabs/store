import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

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
  const [kernelImages, setKernelImages] = useState<KernelImageResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const { ref, inView } = useInView({
    threshold: 0,
  });

  const fetchKernelImages = async (cursor: string | null = null) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await auth.client.GET("/kernel-images/public", {
        params: { query: { cursor, limit: 20 } },
      });
      if (response.data) {
        setKernelImages((prev) => [...prev, ...response.data.kernel_images]);
        setNextCursor(response.data.next_cursor ?? null);
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

  useEffect(() => {
    if (inView && nextCursor) {
      fetchKernelImages(nextCursor);
    }
  }, [inView, nextCursor]);

  const filteredKernelImages = kernelImages.filter(
    (ki) =>
      ki.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "all" || ki.image_type === activeTab),
  );

  const handleUpload = async (
    file: File,
    name: string,
    imageType: string,
    description: string,
    isPublic: boolean,
  ) => {
    try {
      const response = await auth.client.POST("/kernel-images/upload", {
        body: {
          name,
          image_type: imageType as "dockerfile" | "singularity",
          file: await fileToBase64(file),
          description,
          is_public: isPublic,
        },
      });

      if (response.error) {
        console.error("Upload failed:", response.error);
        addErrorAlert(
          `Upload failed: ${response.error instanceof Error ? response.error.message : String(response.error)}`,
        );
      } else {
        console.log("Upload successful:", response.data);
        setKernelImages((prevKernelImages) => [
          response.data as KernelImageResponse,
          ...prevKernelImages,
        ]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      addErrorAlert(
        `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

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
            placeholder="Search kernel images"
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

      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="dockerfile">Dockerfile</TabsTrigger>
          <TabsTrigger value="singularity">Singularity</TabsTrigger>
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

      {nextCursor && <div ref={ref} style={{ height: "20px" }} />}

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
