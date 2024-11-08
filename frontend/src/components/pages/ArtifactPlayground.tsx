import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuthentication } from "@/hooks/useAuth";
import { UntarredFile } from "@/components/files/Tarfile";
import { parseTar } from "@/components/files/Tarfile";
import MJCFRenderer from "@/components/files/MJCFRenderer";
import pako from "pako";

const ArtifactPlayground = () => {
  const { artifactId } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const [files, setFiles] = useState<UntarredFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useAuthentication();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        if (!artifactId) {
          throw new Error("No artifact ID provided");
        }

        const response = await auth.client.GET("/artifacts/info/{artifact_id}", {
          params: {
            path: { artifact_id: artifactId },
          },
        });

        if (response.error) {
          const errorMessage = response.error.detail?.[0]?.msg || "API error";
          throw new Error(errorMessage);
        }

        const tgzResponse = await fetch(response.data.urls.large);
        const arrayBuffer = await tgzResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const decompressed = pako.ungzip(uint8Array);
        const files = parseTar(decompressed);

        setFiles(files);
        setError(null);
      } catch (error) {
        console.error("Error fetching files:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [artifactId, auth]);

  useEffect(() => {
    const handleResize = () => {
      const renderer = rendererRef.current;
      const container = containerRef.current;
      if (renderer && container) {
        renderer.updateDimensions?.(
          container.clientWidth,
          container.clientHeight
        );
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      rendererRef.current?.cleanup?.();
    };
  }, []);

  if (isLoading) {
    return <div className="w-full h-[80vh] flex items-center justify-center">Loading...</div>;
  }

  if (error || files.length === 0) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Model</h2>
          <p>{error || "No files available"}</p>
        </div>
      </div>
    );
  }

  const mjcfFile = files.find(file =>
    (file.name.endsWith('.mjcf') || file.name.endsWith('.xml')) &&
    new TextDecoder().decode(file.content).includes('<mujoco')
  );

  if (!mjcfFile) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Model</h2>
          <p>No MJCF file found in artifact</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[80vh] flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-2/3 h-1/2 lg:h-full rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-full">
          {mjcfFile && (
            <MJCFRenderer
              ref={rendererRef}
              mjcfContent={new TextDecoder().decode(mjcfFile.content)}
              files={files}
              useControls={true}
              showWireframe={false}
            />
          )}
        </div>
      </div>

      <div className="w-full lg:w-1/3 h-1/2 lg:h-full p-4 bg-gray-100 rounded-lg flex flex-col">
        <h2 className="text-xl font-bold mb-4">Model Controls</h2>

        <div className="flex-grow" />

        <div className="text-right text-sm text-gray-500">
          <div className="mb-1">
            <span className="font-medium">MJCF File:</span> {mjcfFile.name}
          </div>
          <div>
            <span className="font-medium">Artifact ID:</span> {artifactId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtifactPlayground;
