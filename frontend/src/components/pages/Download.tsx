import { useEffect, useState } from "react";

import DownloadArtifact from "@/components/listing/artifacts/DownloadArtifact";
import LoadingArtifactCard from "@/components/listing/artifacts/LoadingArtifactCard";
import { UploadModal } from "@/components/modals/UploadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { Search, Upload } from "lucide-react";

type ArtifactInfo = components["schemas"]["SingleArtifactResponse"];
type UploadArtifactResponse = components["schemas"]["UploadArtifactResponse"];

export default function DownloadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [artifacts, setArtifacts] = useState<ArtifactInfo[] | null>(null);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const response = await auth.client.GET("/artifacts/list/{listing_id}", {
        params: { path: { listing_id: "none" } },
      });
      if (response.data) {
        setArtifacts(response.data.artifacts);
      }
    } catch (error) {
      console.error("Failed to fetch artifacts:", error);
      addErrorAlert("Failed to fetch artifacts");
    }
  };

  const filteredArtifacts = artifacts?.filter(
    (artifact) =>
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "all" || artifact.artifact_label === activeTab),
  );

  const handleUpload = async (
    file: File,
    name: string,
    label: string,
    description: string,
    isOfficial: boolean,
  ) => {
    try {
      const response = await auth.client.POST("/artifacts/upload", {
        body: {
          file: await fileToBase64(file),
          name,
          description,
          label: label as "kernel" | "ml" | null,
          is_official: isOfficial,
        },
      });

      if (response.error) {
        console.error("Upload failed:", response.error);
        addErrorAlert(
          `Upload failed: ${response.error instanceof Error ? response.error.message : String(response.error)}`,
        );
      } else {
        console.log("Upload successful:", response.data);
        const uploadResponse = response.data as UploadArtifactResponse;
        if (uploadResponse.artifacts && uploadResponse.artifacts.length > 0) {
          setArtifacts((prevArtifacts) => [
            ...(prevArtifacts || []),
            ...uploadResponse.artifacts,
          ]);
        }
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
        View and download official K-Scale and community uploaded kernel images,
        URDFs, ML models, and more
      </p>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources"
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
          <TabsTrigger value="image">Kernel Images</TabsTrigger>
          <TabsTrigger value="ml">ML Models</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifacts === null ? (
          <>
            <LoadingArtifactCard />
            <LoadingArtifactCard />
            <LoadingArtifactCard />
          </>
        ) : filteredArtifacts && filteredArtifacts.length > 0 ? (
          filteredArtifacts.map((artifact) => (
            <DownloadArtifact key={artifact.artifact_id} artifact={artifact} />
          ))
        ) : (
          <p className="col-span-3 text-center text-muted-foreground mt-8">
            No resources found matching your search criteria.
          </p>
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
