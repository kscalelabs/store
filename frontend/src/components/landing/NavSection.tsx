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
      <div className="sm:mx-48 px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
          Explore More
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "K-Lang",
              description: "Write, run, find, and upload Klang programs",
              icon: CodeIcon,
              path: "/k-lang",
              buttonText: "Explore K-Lang",
            },
            {
              title: "Kernel Images",
              description:
                "View and download official K-Scale and community uploaded kernel images",
              icon: DownloadIcon,
              path: "/kernel-images",
              buttonText: "Browse Images",
            },
            {
              title: "Browse Builds",
              description:
                "Browse completed/published robot builds which include CAD files, part lists, and various related downloads",
              icon: MagnifyingGlassIcon,
              path: "/browse",
              buttonText: "View Builds",
            },
            {
              title: "K-Sim",
              description: "Run simulations",
              icon: LayersIcon,
              path: "/k-sim",
              buttonText: "Start Simulation",
            },
          ].map((item, index) => (
            <Card
              key={index}
              className="cursor-pointer flex flex-col h-full"
              onClick={() => navigate(item.path)}
            >
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end">
                <item.icon className="w-12 h-12 mb-4" />
                <div className="inline-flex items-center text-sm font-medium">
                  {item.buttonText}
                  <item.icon className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
