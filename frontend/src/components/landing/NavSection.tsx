import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  CodeIcon,
  DownloadIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

export default function NavSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-[#191919]">
      <div className="px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
          Explore More
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>K-Lang</CardTitle>
              <CardDescription>
                Write, run, find, and upload Klang programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeIcon className="w-12 h-12 mb-4" />
              <button
                className="inline-flex items-center text-sm font-medium"
                onClick={() => navigate("/k-lang")}
              >
                Explore K-Lang
                <CodeIcon className="ml-1 h-4 w-4" />
              </button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kernel Images</CardTitle>
              <CardDescription>
                View and download official K-Scale and community uploaded kernel
                images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DownloadIcon className="w-12 h-12 mb-4" />
              <button
                className="inline-flex items-center text-sm font-medium"
                onClick={() => navigate("/kernel-images")}
              >
                Browse Images
                <DownloadIcon className="ml-1 h-4 w-4" />
              </button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Browse Builds</CardTitle>
              <CardDescription>
                Browse completed/published robot builds which include CAD files,
                part lists, and various related downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MagnifyingGlassIcon className="w-12 h-12 mb-4" />
              <button
                className="inline-flex items-center text-sm font-medium"
                onClick={() => navigate("/builds")}
              >
                View Builds
                <MagnifyingGlassIcon className="ml-1 h-4 w-4" />
              </button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>K-Sim</CardTitle>
              <CardDescription>Run simulations</CardDescription>
            </CardHeader>
            <CardContent>
              <LayersIcon className="w-12 h-12 mb-4" />
              <button
                className="inline-flex items-center text-sm font-medium"
                onClick={() => navigate("/k-sim")}
              >
                Start Simulation
                <LayersIcon className="ml-1 h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
