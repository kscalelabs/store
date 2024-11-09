import React, { useRef } from "react";
import { FaDiscord } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import ROUTES from "@/lib/types/routes";
import {
  ChevronRightIcon,
  CodeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

const Home: React.FC = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="bg-gray-1 text-gray-12 space-y-6">
      <HeroSection />
      <OptionsSection />
    </div>
  );
};

const HeroSection: React.FC = () => {
  const myFillGridString = [
    "  ██████████████████████████    ███████████████████████████  ",
    " █                          ████                           █ ",
    "█                                                           █",
    "█                                                           █",
    "█   ██   ██        ██████   █████   ███   ██       ██████   █",
    "█   ██   ██       ███████  ██████  █████  ██      ███████   █",
    "█   ██  ██        ██      ██      ██   ██ ██      ██        █",
    "█   ██  ██        ██      ██      ██   ██ ██      ██        █",
    "█   █████   █████ ██████  ██      ███████ ██      █████     █",
    "█   █████   █████  ██████ ██      ███████ ██      █████     █",
    "█   ██  ██             ██ ██      ██   ██ ██      ██        █",
    "█   ██  ██             ██ ██      ██   ██ ██      ██       █ ",
    "█   ██   ██       ███████  ██████ ██   ██ ███████ ███████  █ ",
    " █  ██   ██       ██████    █████ ██   ██ ███████  ██████  █ ",
    " █                                                         █ ",
    " █                                                         █ ",
    " █            ██        ███   █████    ██████              █ ",
    " █            ██       █████  ██████  ███████               █",
    " █            ██      ██   ██ ██   ██ ██                    █",
    "█             ██      ██   ██ ██   ██ ██                    █",
    "█             ██      ███████ ██████  ██████                █",
    "█             ██      ███████ ██████   ██████               █",
    "█             ██      ██   ██ ██   ██      ██               █",
    "█             ██      ██   ██ ██   ██      ██               █",
    "█             ███████ ██   ██ ██████  ███████               █",
    "█              ██████ ██   ██ █████   ██████                █",
    "█                                                           █",
    "█                                                           █",
    " █                           ████                          █ ",
    "  ███████████████████████████    ██████████████████████████  ",
  ];

  const myFillGrid = myFillGridString.map((row) =>
    row.split("").map((char) => char !== " "),
  );

  return (
    <section className="relative overflow-hidden h-[80vh] md:h-[40vh] rounded-lg">
      <PageHeader fillGrid={myFillGrid} />
    </section>
  );
};

const OptionsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-24 sm:py-36">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Downloads",
            description: "Kernel images, URDFs, ML models, and more.",
            icon: DownloadIcon,
            path: ROUTES.DOWNLOADS.path,
            buttonText: "Browse Downloads",
          },
          {
            title: "Browse Builds",
            description:
              "Browse robot builds with linked CAD files, part lists, and various related downloads.",
            icon: MagnifyingGlassIcon,
            path: ROUTES.LISTINGS.BROWSE.path,
            buttonText: "View Builds",
          },
          {
            title: "Code",
            description:
              "Explore or contribute to dozens of open-source repositories from robot builds to edge vision-language-action models, kernel images, simulations, and more.",
            icon: CodeIcon,
            path: "https://github.com/kscalelabs",
            buttonText: "Visit our Github",
            external: true,
          },
          {
            title: "Discord",
            description:
              "Connect with fellow robot enthusiasts, industry experts, and researchers. Share projects and ideas, and stay updated on the latest K-Scale developments.",
            icon: FaDiscord,
            path: "https://discord.com/invite/kscale",
            buttonText: "Join our Discord",
            external: true,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="cursor-pointer flex flex-col h-full transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg bg-gray-12"
            onClick={() =>
              item.external
                ? window.open(item.path, "_blank")
                : navigate(item.path)
            }
          >
            <CardHeader>
              <CardTitle className="text-gray-2 text-lg sm:text-xl">
                {item.title}
              </CardTitle>
              <CardDescription className="text-gray-7 font-light">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <item.icon className="w-12 h-12 mb-4 text-primary-9" />
              <div className="inline-flex items-center text-sm font-medium text-primary-1">
                {item.buttonText}
                {item.external ? (
                  <ExternalLinkIcon className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="ml-1 h-4 w-4" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Home;
