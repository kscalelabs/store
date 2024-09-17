import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  ChevronRightIcon,
  CodeIcon,
  DownloadIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

export default function NavSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-12 sm:py-24 border-t-2 border-b-2 border-primary-10">
      <div className="flex flex-col justify-center mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-2 bg-gradient-to-r from-primary-7 to-primary-9 text-transparent bg-clip-text">
          The K-Scale Ecosystem
        </h2>
        <p className="text-lg text-gray-11">
          We&apos;re open source and always iterating. Join us in building the
          future of robotics.
        </p>
      </div>
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
            title: "Downloads",
            description: "Kernel images, URDFs, ML models, and more",
            icon: DownloadIcon,
            path: "/downloads",
            buttonText: "Browse Downloads",
          },
          {
            title: "Browse Builds",
            description:
              "Browse robot builds with linked CAD files, part lists, and various related downloads",
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
            className="cursor-pointer flex flex-col h-full transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg bg-gray-12"
            onClick={() => navigate(item.path)}
          >
            <CardHeader>
              <CardTitle className="text-gray-2">{item.title}</CardTitle>
              <CardDescription className="text-gray-7">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <item.icon className="w-12 h-12 mb-4 text-primary-9" />
              <div className="inline-flex items-center text-sm font-medium text-primary-1">
                {item.buttonText}
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
