import React from "react";
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
  ExternalLinkIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

import Container from "../ui/container";

const Home: React.FC = () => {
  return (
    <Container>
      <HeroSection />
      <OptionsSection />
    </Container>
  );
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden h-[40vh] rounded-lg">
      <PageHeader>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-gray-500 rounded-lg p-4">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-1">
            K-Scale Labs
          </h1>
          <p className="text-gray-400 mt-2">
            Moving humanity up the Kardashev scale
          </p>
        </div>
      </PageHeader>
    </section>
  );
};

const OptionsSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Browse Robots",
            description:
              "Browse robot builds with linked CAD files, part lists, and related downloads.",
            icon: MagnifyingGlassIcon,
            path: ROUTES.BOTS.BROWSE.path,
            buttonText: "View Builds",
          },
          {
            title: "Code",
            description:
              "Explore or contribute to dozens of open-source repositories from robot builds to edge vision-language-action models, simulations, and more.",
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
            className="cursor-pointer flex flex-col h-full transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg"
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
