import { useState } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { components } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import axios from "axios";
import { Download } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

interface Props {
  kernelImage: KernelImageResponse;
}

const DownloadKernelImage = ({ kernelImage }: Props) => {
  const { addErrorAlert } = useAlertQueue();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(
        `/api/kernel-images/download/${kernelImage.id}`,
      );
      const downloadUrl = response.data;
      window.location.href = downloadUrl;
    } catch (error) {
      console.error("Error downloading kernel image:", error);
      addErrorAlert("Error downloading kernel image");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card key={kernelImage.id}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {kernelImage.name}
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Kernel
            </Badge>
            {kernelImage.is_official && (
              <Badge variant="primary">Official</Badge>
            )}
          </div>
        </CardTitle>
        {kernelImage.description && (
          <p className="text-sm text-muted-foreground">
            {kernelImage.description}
          </p>
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
          disabled={isDownloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DownloadKernelImage;
