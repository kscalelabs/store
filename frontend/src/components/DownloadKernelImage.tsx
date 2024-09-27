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
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

type KernelImageResponse = components["schemas"]["KernelImageResponse"];

interface Props {
  kernelImage: KernelImageResponse;
}

const DownloadKernelImage = ({ kernelImage }: Props) => {
  return (
    <Card key={kernelImage.id}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {kernelImage.name}
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={cn(
                kernelImage.image_type === "dockerfile" &&
                  "bg-blue-100 text-blue-800",
                kernelImage.image_type === "singularity" &&
                  "bg-purple-100 text-purple-800",
              )}
            >
              {kernelImage.image_type}
            </Badge>
            {kernelImage.is_public && <Badge variant="primary">Public</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Size: {(kernelImage.size / 1024 / 1024).toFixed(2)} MB
        </p>
        {kernelImage.description && (
          <p className="mt-2 text-sm">{kernelImage.description}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DownloadKernelImage;
