import { FaDiscord, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

import {
  DiscordPrimaryColor,
  GithubPrimaryColor,
  LinkedinPrimaryColor,
} from "types/colors";

import SocialLink from "./SocialLink";

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  // Show/hide footer based on pathname
  // - to hide footer on a page add path to this
  const showFooter =
    pathname?.startsWith("/browse") === false &&
    pathname?.startsWith("/login") === false &&
    pathname?.startsWith("/signup") === false;

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 text-sm py-20">
      <div className="flex flex-col gap-4 mx-12 sm:mx-36">
        <div className="flex flex-row justify-between items-center">
          <span className="text-xl sm:text-2xl">K-Scale Labs</span>
          <div className="flex flex-row gap-4 rounded-full">
            <SocialLink
              href="https://www.linkedin.com/company/kscale"
              ariaLabel="Visit K-Scale's LinkedIn Page"
              bgColor={LinkedinPrimaryColor}
              ringColor="focus:ring-sky-500"
            >
              <FaLinkedinIn />
            </SocialLink>
            <SocialLink
              href="https://github.com/kscalelabs/store"
              ariaLabel="Visit K-Scale's Github Page"
              bgColor={GithubPrimaryColor}
              ringColor="focus:ring-black"
            >
              <FaGithub />
            </SocialLink>
            <SocialLink
              href="https://discord.gg/rhCy6UdBRD"
              ariaLabel="Join K-Scale's Discord"
              bgColor={DiscordPrimaryColor}
              ringColor="focus:ring-black"
            >
              <FaDiscord />
            </SocialLink>
          </div>
        </div>
        <div className="flex flex-row gap-32 sm:gap-56 md:gap-64">
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-semibold mb-1">Company</h2>
            <a
              href="https://kscale.dev/about/"
              className="hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              About us
            </a>
            <a href="" className="hover:text-gray-500">
              News
            </a>
            <a href="" className="hover:text-gray-500">
              Blog
            </a>
          </div>
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-semibold mb-1">
              Buy and Sell
            </h2>
            <Link to={"/browse"} className="hover:text-gray-500">
              Robots
            </Link>
            <Link to={"/browse"} className="hover:text-gray-500">
              Parts
            </Link>
            <Link to={"/browse"} className="hover:text-gray-500">
              Designs
            </Link>
          </div>
        </div>
        <div className="mt-10 text-xs">
          <p>
            <span>©</span> {new Date().getFullYear()} K-Scale Labs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
