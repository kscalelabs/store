import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const { pathname } = location;

  const showFooter =
    pathname?.startsWith("/browse") === false &&
    pathname?.startsWith("/some-other-path-to-hide-footer") === false;

  if (!showFooter) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-800 text-sm py-20">
      <div className="flex flex-col gap-4 mx-12 sm:mx-24">
        <div className="flex flex-row justify-between items-center">
          <span className="text-xl">K-Scale Labs</span>
          <div className="flex flex-row gap-4 rounded-full p-1.5 px-2">
            <a
              href="https://www.linkedin.com/company/kscale"
              target="_blank"
              rel="noopener noreferrer"
              className="
                bg-sky-600 hover:bg-opacity-80
                rounded-full
                text-white cursor-pointer
                focus:outline-none
                focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
              "
            >
              <button
                className="text-base p-3 rounded-full"
                aria-label="Visit LinkedIn Page"
              >
                <FaLinkedinIn />
              </button>
            </a>
            <a
              href="https://github.com/kscalelabs/store"
              target="_blank"
              rel="noopener noreferrer"
              className="
                rounded-full
              text-white cursor-pointer
                bg-gray-600 hover:bg-opacity-80
                focus:outline-none
                focus:ring-2 focus:ring-offset-2 focus:ring-black
              "
            >
              <button
                className="text-2xl p-2 rounded-full"
                aria-label="Visit Instagram Page"
              >
                <FaGithub />
              </button>
            </a>
          </div>
        </div>
        <div className="flex flex-row gap-32 sm:gap-56 md:gap-64">
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-lg font-semibold mb-1">Company</h2>
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
            <h2 className="text-lg font-semibold mb-1">Buy</h2>
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
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <h2 className="text-lg font-semibold mb-1">Sell</h2>
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
