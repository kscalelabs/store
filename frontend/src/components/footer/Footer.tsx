import { FaDiscord, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import SocialLink from "@/components/footer/SocialLink";
import ROUTES from "@/lib/types/routes";

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  // Show/hide footer based on pathname
  const showFooter =
    pathname?.startsWith("/browse") === false &&
    pathname?.startsWith("/login") === false &&
    pathname?.startsWith("/item") === false &&
    pathname?.startsWith("/create") === false &&
    pathname?.startsWith("/signup") === false &&
    pathname?.startsWith("/terminal") === false;

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-12 text-gray-1 py-10 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 rounded-lg mb-6">
      <div className="max-w-screen-lg lg:max-w-full mx-auto px-4 sm:px-6 md:px-10">
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
            <SocialLink
              href="https://x.com/kscalelabs"
              ariaLabel="Join K-Scale's X"
              ringColor="focus:ring-black"
            >
              <FaXTwitter />
            </SocialLink>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-base font-bold mb-1">Company</h2>
            <Link to={ROUTES.ABOUT.path} className="hover:text-primary-9">
              About
            </Link>
            <Link to={ROUTES.RESEARCH.path} className="hover:text-primary-9">
              Research
            </Link>
            <Link
              to="https://mailchi.mp/kscale/subscribe"
              className="hover:text-primary-9"
              target="_blank"
              rel="noopener noreferrer"
            >
              Newsletter
            </Link>
          </div>
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-base font-bold mb-1">Legal</h2>
            <Link to={ROUTES.TOS.path} className="hover:text-primary-9">
              Terms of Service
            </Link>
            <Link to={ROUTES.PRIVACY.path} className="hover:text-primary-9">
              Privacy Policy
            </Link>
            <Link
              to={ROUTES.PREORDER_TERMS.path}
              className="hover:text-primary-9"
            >
              K-Bot Pre-order Terms
            </Link>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-base font-bold mb-1">Product</div>
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
