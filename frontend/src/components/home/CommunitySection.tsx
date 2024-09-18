import { FaDiscord, FaGithub } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@radix-ui/react-icons";

export default function CommunitySection() {
  return (
    <section className="w-full py-12 md:py-24 bg-gray-12 rounded-lg">
      <div className="md:w-[90%] mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="flex flex-col justify-between">
            <FaDiscord className="h-12 w-12 mb-4 text-gray-1" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-3">
              Join the conversation
            </h3>
            <p className="text-sm md:text-base text-gray-7 mb-6">
              Connect with fellow robot enthusiasts, industry experts, and
              researchers. Share projects and ideas, and stay updated on the
              latest K-Scale developments
            </p>
            <Button
              className="inline-flex items-center bg-[#5865F2] hover:bg-[#4752C4] text-gray-1 sm:text-lg p-5 sm:p-6"
              onClick={() =>
                window.open("https://discord.com/invite/kscale", "_blank")
              }
            >
              <FaDiscord className="mr-2 h-5 w-5" />
              Join our Discord
              <ChevronRightIcon className="ml-1 h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col justify-between">
            <FaGithub className="h-12 w-12 mb-4 text-gray-1" />
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-3">
              Developer Resources
            </h3>
            <p className="text-sm md:text-base text-gray-7 mb-6">
              Explore or contribute to dozens of open-source repositories from
              robot builds to edge vision-language-action models, kernel images,
              simulations, and more.
            </p>
            <Button
              className="inline-flex items-center bg-[#333] hover:bg-[#24292e] text-gray-1 sm:text-lg p-5 sm:p-6"
              onClick={() =>
                window.open("https://github.com/kscalelabs", "_blank")
              }
            >
              <FaGithub className="mr-2 h-5 w-5" />
              Visit our GitHub
              <ChevronRightIcon className="ml-1 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
