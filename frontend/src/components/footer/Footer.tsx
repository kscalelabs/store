import { FaDiscord, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import SocialLink from "@/components/footer/SocialLink";

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  // Show/hide footer based on pathname
  // - to hide footer on a page add path to this
  const showFooter =
    pathname?.startsWith("/browse") === false &&
    pathname?.startsWith("/login") === false &&
    pathname?.startsWith("/item") === false &&
    pathname?.startsWith("/create") === false &&
    pathname?.startsWith("/signup") === false;

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-12 text-gray-1 py-10 mx-4 sm:mx-6 md:mx-10 xl:mx-16 rounded-lg mb-6">
      <div className="flex flex-col gap-4 mx-8 sm:mx-12">
        {/* Logo and Social Links */}
        <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center mb-8">
          <Logo />
          <div className="flex flex-row gap-4 rounded-full mt-4 sm:mt-0">
            <SocialLink
              href="https://www.linkedin.com/company/kscale"
              ariaLabel="Visit K-Scale's LinkedIn Page"
              ringColor="focus:ring-sky-500"
            >
              <FaLinkedinIn />
            </SocialLink>
            <SocialLink
              href="https://github.com/kscalelabs"
              ariaLabel="Visit K-Scale's Github Page"
              ringColor="focus:ring-black"
            >
              <FaGithub />
            </SocialLink>
            <SocialLink
              href="https://discord.gg/kscale"
              ariaLabel="Join K-Scale's Discord"
              ringColor="focus:ring-black"
            >
              <FaDiscord />
            </SocialLink>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 sm:gap-4">
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold mb-1">Company</h2>
            {/* <a
              href="https://kscalelabs.com"
              className="hover:text-gray-5"
              target="_blank"
              rel="noopener noreferrer"
            >
              K-Scale Labs
            </a> */}
            <Link to={"/about"} className="hover:text-primary-9">
              About
            </Link>
            <a
              href="https://blog.kscale.dev"
              className="hover:text-primary-9"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </a>
          </div>
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-bold mb-1">Legal</h2>
            <Link to={"/tos"} className="hover:text-primary-9">
              Terms of Service
            </Link>
            <Link to={"/privacy"} className="hover:text-primary-9">
              Privacy Policy
            </Link>
          </div>
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <div className="mb-1">___</div>
            <a
              href="https://forms.gle/HB5uj5r5mGQZUBtd8"
              className="hover:text-primary-9"
              target="_blank"
              rel="noopener noreferrer"
            >
              Submit Feedback
            </a>
            <a
              href="https://github.com/kscalelabs/store"
              className="hover:text-primary-9"
              target="_blank"
              rel="noopener noreferrer"
            >
              Website Source Code
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 text-xs text-center text-gray-1">
          <p>
            <span>©</span> {new Date().getFullYear()} K-Scale Labs
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
