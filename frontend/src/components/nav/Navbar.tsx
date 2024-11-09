import { useState } from "react";
import {
  FaBars,
  FaGithub,
  FaRegFileLines,
  FaRobot,
  FaWpexplorer,
} from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Logo from "@/components/Logo";
import { useFeaturedListings } from "@/components/listing/FeaturedListings";
import Sidebar from "@/components/nav/Sidebar";
import { useAuthentication } from "@/hooks/useAuth";
import ROUTES from "@/lib/types/routes";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

type NavItem = {
  name: string;
  path: string;
  isExternal: boolean;
};

const Navbar = () => {
  const { isAuthenticated } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [showDevelopersDropdown, setShowDevelopersDropdown] = useState(false);
  const { featuredListings } = useFeaturedListings();

  let navItems: NavItem[] = [];

  if (isAuthenticated) {
    navItems = [
      { name: "Terminal", path: "/terminal", isExternal: false },
      ...navItems,
    ];
  }

  const technicalItems = [
    {
      name: "Builds",
      path: ROUTES.BROWSE.path,
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Downloads",
      path: ROUTES.DOWNLOADS.path,
      icon: <DownloadIcon className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Playground",
      path: ROUTES.PLAYGROUND.path,
      icon: <FaRobot className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Research",
      path: ROUTES.RESEARCH.path,
      icon: <FaWpexplorer className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Docs",
      path: "https://docs.kscale.dev/",
      icon: <FaRegFileLines className="h-5 w-5" />,
      isExternal: true,
    },
    {
      name: "Code",
      path: "https://github.com/kscalelabs",
      icon: <FaGithub className="h-5 w-5" />,
      isExternal: true,
    },
  ];

  const ListItem = ({
    className,
    href,
    title,
    icon,
    isExternal,
  }: {
    className?: string;
    href: string;
    title: string;
    icon: React.ReactNode;
    isExternal: boolean;
  }) => {
    return (
      <li>
        {isExternal ? (
          <a
            href={href}
            className={`block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-gray-1 hover:text-primary-9 focus:bg-gray-1 focus:text-primary-9 ${className}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center text-sm font-semibold leading-none">
              <span className="mr-2">{icon}</span>
              <span>{title}</span>
              <ExternalLinkIcon className="ml-2 h-4 w-4" />
            </div>
          </a>
        ) : (
          <Link
            to={href}
            className={`block select-none rounded-md p-2 leading-none no-underline outline-none transition-colors hover:bg-gray-1 hover:text-primary-9 focus:bg-gray-1 focus:text-primary-9 ${className}`}
          >
            <div className="flex items-center text-sm font-semibold leading-none">
              <span className="mr-2">{icon}</span>
              <span>{title}</span>
            </div>
          </Link>
        )}
      </li>
    );
  };

  const handleFeaturedClick = (username: string, slug: string | null) => {
    const path = ROUTES.LISTING.buildPath({
      username,
      slug: slug || "",
    });
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  };

  return (
    <>
      <nav className="fixed w-full z-50 top-0 start-0 bg-gray-1/30 backdrop-blur-lg">
        <div className="relative flex justify-between py-3 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 font-medium">
          <div className="flex justify-between w-full lg:w-auto gap-3">
            <Link
              to={ROUTES.HOME.path}
              className="
                flex
                flex-grow
                lg:flex-grow-0
                space-x-2 p-3
                rounded-lg
                bg-gray-12 hover:bg-primary-9
                transition-all duration-600
              "
            >
              <Logo />
            </Link>
            <button
              onClick={() => setShowSidebar(true)}
              className="lg:hidden text-gray-300 hover:bg-gray-700 bg-gray-12 hover:text-white p-4 rounded-md text-sm"
            >
              <FaBars size={20} />
            </button>
          </div>
          <div className="hidden lg:flex items-center flex-grow justify-between ml-4">
            <div className="flex space-x-1 bg-gray-12 rounded-lg p-2 flex-grow">
              <div className="flex-grow flex space-x-1">
                {featuredListings?.map((listing) => (
                  <button
                    key={listing.id}
                    onClick={() =>
                      handleFeaturedClick(listing.username, listing.slug)
                    }
                    className="px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest text-gray-1 hover:bg-gray-1 hover:text-primary-9"
                  >
                    {listing.name}
                  </button>
                ))}
              </div>
              {navItems.map((item) =>
                item.isExternal ? (
                  <a
                    key={item.name}
                    href={item.path}
                    className={`px-2 xl:px-3 py-2 rounded-md text-sm tracking-wide xl:tracking-widest text-gray-1 hover:bg-primary-9 flex items-center`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                    <ExternalLinkIcon className="ml-2 h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest ${
                      location.pathname === item.path
                        ? "bg-gray-11 text-gray-1"
                        : "text-gray-1 hover:bg-gray-1 hover:text-primary-9"
                    }`}
                  >
                    {item.name}
                  </Link>
                ),
              )}
              <div
                className="relative"
                onClick={() =>
                  setShowDevelopersDropdown(!showDevelopersDropdown)
                }
              >
                <button className="px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest text-gray-1 hover:text-primary-9 flex items-center">
                  {showDevelopersDropdown ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
                <div
                  className={`absolute right-0 top-full mt-5 bg-gray-12 shadow-lg rounded-2xl transition-all duration-300 ease-in-out overflow-hidden max-w-[400px] w-max border border-gray-10 ${
                    showDevelopersDropdown
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  }`}
                >
                  <div className="py-4 px-4">
                    <ul className="space-y-1">
                      {technicalItems.map((item) => (
                        <ListItem
                          key={item.name}
                          title={item.name}
                          href={item.path}
                          icon={item.icon}
                          className="group text-gray-1"
                          isExternal={item.isExternal}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-1 bg-gray-12 rounded-lg p-2 ml-4 text-sm tracking-widest">
              {isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.ACCOUNT.path}
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-primary-9"
                  >
                    Account
                  </Link>
                  <Link
                    to={ROUTES.LOGOUT.path}
                    className="px-3 py-2 rounded-md hover:bg-primary-9"
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN.path}
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-primary-9"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={ROUTES.SIGNUP.path}
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-primary-9"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
