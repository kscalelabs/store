import {
  CodeIcon,
  DownloadIcon,
  MagnifyingGlassIcon,
  RocketIcon,
} from "@radix-ui/react-icons";

import { BentoCard, BentoGrid } from "../ui/BentoGrid";

const Studio = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Everything for your project
      </h1>
      <BentoGrid className="grid-cols-1 sm:grid-cols-2 gap-4">
        <BentoCard
          className=""
          name="Get Started"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
          }
          Icon={RocketIcon}
          description="Begin your K-Scale Dev journey"
          href="/get-started"
          cta="Start now"
        />
        <BentoCard
          className=""
          name="Downloads"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
          }
          Icon={DownloadIcon}
          description="Access official and community resources"
          href="/downloads"
          cta="Get files"
        />
        <BentoCard
          className=""
          name="Browse Builds"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
          }
          Icon={MagnifyingGlassIcon}
          description="Explore published robot builds"
          href="/browse"
          cta="Discover"
        />
        <BentoCard
          className=""
          name="K-Lang"
          background={
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500" />
          }
          Icon={CodeIcon}
          description="Write and run K-Lang programs (Coming Soon)"
          href="/k-lang"
          cta="Learn more"
        />
      </BentoGrid>
    </div>
  );
};

export default Studio;
