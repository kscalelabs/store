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

type SingleArtifactResponse = components["schemas"]["SingleArtifactResponse"];

interface Props {
  artifact: SingleArtifactResponse;
}

const DownloadArtifact = ({ artifact }: Props) => {
  return (
    <>
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
                {artifact.artifact_label}
              </Badge>
              {artifact.is_official && (
                <Badge variant="primary">Official</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Downloads: {artifact.downloads}
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default DownloadArtifact;
