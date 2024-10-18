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
import stompy from "@/images/stompy.png";
import {
  ChevronRightIcon,
  CodeIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

const Home: React.FC = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  return (
    <div ref={containerRef} className="bg-gray-1 text-gray-12">
      <HeroSection />
      <StompyProSection />
      <StompyMiniSection />
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Downloads",
              description: "Kernel images, URDFs, ML models, and more.",
              icon: DownloadIcon,
              path: "/downloads",
              buttonText: "Browse Downloads",
            },
            {
              title: "Browse Builds",
              description:
                "Browse robot builds with linked CAD files, part lists, and various related downloads.",
              icon: MagnifyingGlassIcon,
              path: "/browse",
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
    </div>
  );
};

const HeroSection: React.FC = () => {
  const myFillGridString = [
    "  ███████████████████████████   ███████████████████████████  ",
    " █                           ███                           █ ",
    "█                                                           █",
    "█                                                           █",
    "█   ██   ██        ██████   █████   ███   ██       ██████   █",
    "█   ██   ██       ███████  ██████  █████  ██      ███████   █",
    "█   ██  ██        ██      ██      ██   ██ ██      ██        █",
    "█   ██  ██        ██      ██      ██   ██ ██      ██        █",
    "█   █████   █████ ██████  ██      ███████ ██      █████     █",
    "█   █████   █████  ██████ ██      ███████ ██      █████     █",
    "█   ██  ██             ██ ██      ██   ██ ██      ██        █",
    "█   ██  ██             ██ ██      ██   ██ ██      ██        █",
    "█   ██   ██       ███████  ██████ ██   ██ ███████ ███████  █ ",
    " █  ██   ██       ██████    █████ ██   ██ ███████  ██████  █ ",
    " █                                                         █ ",
    " █                                                         █ ",
    " █            ██        ███   █████    ██████              █ ",
    " █            ██       █████  ██████  ███████               █",
    "█             ██      ██   ██ ██   ██ ██                    █",
    "█             ██      ██   ██ ██   ██ ██                    █",
    "█             ██      ███████ ██████  ██████                █",
    "█             ██      ███████ ██████   ██████               █",
    "█             ██      ██   ██ ██   ██      ██               █",
    "█             ██      ██   ██ ██   ██      ██               █",
    "█             ███████ ██   ██ ██████  ███████               █",
    "█              ██████ ██   ██ █████   ██████                █",
    "█                                                           █",
    "█                                                           █",
    " █                           ███                           █ ",
    "  ███████████████████████████   ███████████████████████████  ",
  ];

  const myFillGrid = myFillGridString.map((row) =>
    row.split("").map((char) => char !== " "),
  );

  return (
    <section className="relative overflow-hidden mb-12 h-[40vh] rounded-lg">
      <PageHeader fillGrid={myFillGrid} />
    </section>
  );
};

const StompyProSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative h-[600px] overflow-hidden mb-12 cursor-pointer transition-all duration-300 hover:opacity-90 rounded-lg"
      onClick={() => navigate("/pro")}
    >
      <div className="absolute inset-0">
        <img
          src={stompy}
          alt="Stompy Pro Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between h-full px-4">
        <div className="unit-copy-wrapper text-center md:text-left mb-8 md:mb-0">
          <div className="split-wrapper-top mt-8 md:mt-0">
            <h2 className="headline text-4xl font-bold mb-2 md:mb-4 text-gray-900">
              Stompy Pro
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

const StompyMiniSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative h-[600px] overflow-hidden mb-12 cursor-pointer transition-all duration-300 hover:opacity-90 rounded-lg"
      onClick={() => navigate("/mini")}
    >
      <div className="absolute inset-0">
        <img
          src={stompy}
          alt="Stompy Mini Background"
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between h-full px-4">
        <div className="unit-copy-wrapper text-center md:text-right mb-8 md:mb-0">
          <div className="split-wrapper-top mt-8 md:mt-0">
            <h2 className="headline text-4xl font-bold mb-2 md:mb-4 text-gray-900">
              Stompy Mini
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
