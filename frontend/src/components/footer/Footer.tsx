import { FaDiscord, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

import smallLogo from "assets/small-logo.png";
import {
  DiscordPrimaryColor,
  GithubPrimaryColor,
  LinkedinPrimaryColor,
} from "types/colors";

import SocialLink from "components/footer/SocialLink";

const Footer = () => {
  const navigate = useNavigate();
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
        {/* Logo and Social Links */}
        <div className="flex flex-row justify-between items-center mb-8">
          <a
            className="flex items-center active cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src={smallLogo}
              alt="kscale logo"
              className="h-8 dark:invert"
            />
            <span className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-200">
              store
            </span>
          </a>
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
              href="https://github.com/kscalelabs"
              ariaLabel="Visit K-Scale's Github Page"
              bgColor={GithubPrimaryColor}
              ringColor="focus:ring-black"
            >
              <FaGithub />
            </SocialLink>
            <SocialLink
              href="https://discord.gg/kscale"
              ariaLabel="Join K-Scale's Discord"
              bgColor={DiscordPrimaryColor}
              ringColor="focus:ring-black"
            >
              <FaDiscord />
            </SocialLink>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold mb-1">Company</h2>
            <a
              href="https://kscalelabs.com"
              className="hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Homepage
            </a>
            <a
              href="https://blog.kscale.dev"
              className="hover:text-gray-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </a>
          </div>
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold mb-1">Legal</h2>
            <Link to={"/privacy"} className="hover:text-gray-500">
              Privacy Policy
            </Link>
            <Link to={"/tos"} className="hover:text-gray-500">
              Terms of Service
            </Link>
            <Link to={"/about"} className="hover:text-gray-500">
              About
            </Link>
          </div>
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold mb-1">Links</h2>
            <a
              href="https://github.com/kscalelabs/store"
              className="hover:text-gray-500"
            >
              Website Source Code
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 text-xs text-center">
          <p>
            <span>©</span> {new Date().getFullYear()} K-Scale Labs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
