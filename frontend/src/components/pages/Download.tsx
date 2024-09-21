import { useEffect, useState } from "react";

import { UploadModal } from "@/components/modals/UploadModal";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Download, Search, Upload } from "lucide-react";

type ArtifactInfo =
  paths["/artifacts/list/{listing_id}"]["get"]["responses"]["200"]["content"]["application/json"]["artifacts"][number];

export default function DownloadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [artifacts, setArtifacts] = useState<ArtifactInfo[]>([]);
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    try {
      const response = await auth.client.GET("/artifacts/list/{listing_id}", {
        params: { path: { listing_id: "all" } },
      });
      if (response.data) {
        setArtifacts(response.data.artifacts);
      }
    } catch (error) {
      console.error("Failed to fetch artifacts:", error);
      addErrorAlert("Failed to fetch artifacts");
    }
  };

  const filteredArtifacts = artifacts.filter(
    (artifact) =>
      artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === "all" || artifact.artifact_type === activeTab),
  );

  const handleUpload = async (
    file: File,
    name: string,
    label: string,
    description: string,
    isOfficial: boolean,
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("artifact_type", label === "kernel" ? "image" : "ml");
      formData.append("description", description);
      formData.append("is_official", isOfficial.toString());

      const response = await auth.client.POST("/artifacts/upload", {
        body: formData,
      });

      if (response.error) {
        console.error("Upload failed:", response.error);
        addErrorAlert(
          `Upload failed: ${response.error instanceof Error ? response.error.message : String(response.error)}`,
        );
      } else {
        console.log("Upload successful:", response.data);
        fetchArtifacts(); // Refresh the list of artifacts
      }
    } catch (error) {
      console.error("Upload failed:", error);
      addErrorAlert(
        `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleDownload = async (artifactId: string) => {
    try {
      const response = await auth.client.GET(
        "/artifacts/download/{artifact_id}",
        {
          params: { path: { artifact_id: artifactId } },
        },
      );

      if (response.data) {
        window.location.href = response.data.url;
      } else {
        addErrorAlert("Download failed: No URL returned");
      }
    } catch (error) {
      console.error("Download failed:", error);
      addErrorAlert(
        `Download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  // Check if the user has admin or moderator permissions
  const canUpload =
    auth.currentUser?.permissions?.some(
      (permission) => permission === "is_admin" || permission === "is_mod",
    ) || false;

  return (
    <div className="px-4 py-8 rounded-lg">
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
            <Upload className="mr-2 h-4 w-4" /> Upload Resource
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
        {filteredArtifacts.map((artifact) => (
          <Card key={artifact.artifact_id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {artifact.name}
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      artifact.artifact_label === "kernel" &&
                        "bg-blue-100 text-blue-800",
                      artifact.artifact_label === "ml" &&
                        "bg-purple-100 text-purple-800",
                    )}
                  >
                    {artifact.artifact_type}
                  </Badge>
                  {artifact.is_official && (
                    <Badge variant="primary">Official</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{artifact.description}</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleDownload(artifact.artifact_id)}
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredArtifacts.length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No resources found matching your search criteria.
        </p>
      )}

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
