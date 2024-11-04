import { useEffect, useState } from "react";
import {
  FaBars,
  FaGithub,
  FaRegFileLines,
  FaRobot,
  FaWpexplorer,
} from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import Sidebar from "@/components/nav/Sidebar";
import { useAuthentication } from "@/hooks/useAuth";
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
  const [showDevelopersDropdown, setShowDevelopersDropdown] = useState(false);
  const [featuredListings, setFeaturedListings] = useState<
    { id: string; username: string; slug: string | null; name: string }[]
  >([]);
  const auth = useAuthentication();

  const refreshFeaturedListings = async () => {
    try {
      const { data: featuredData } =
        await auth.client.GET("/listings/featured");

      if (!featuredData?.listing_ids?.length) {
        setFeaturedListings([]);
        return;
      }

      const { data: batchData } = await auth.client.GET("/listings/batch", {
        params: {
          query: { ids: featuredData.listing_ids },
        },
      });

      if (batchData?.listings) {
        const orderedListings = featuredData.listing_ids
          .map((id) => batchData.listings.find((listing) => listing.id === id))
          .filter(
            (listing): listing is NonNullable<typeof listing> =>
              listing !== undefined,
          )
          .map((listing) => ({
            id: listing.id,
            username: listing.username ?? "",
            slug: listing.slug,
            name: listing.name,
          }));

        setFeaturedListings(orderedListings);
      }
    } catch (error) {
      console.error("Error refreshing featured listings:", error);
    }
  };

  useEffect(() => {
    refreshFeaturedListings();
  }, []);

  useEffect(() => {
    const handleFeaturedChange = () => {
      refreshFeaturedListings();
    };

    window.addEventListener("featuredListingsChanged", handleFeaturedChange);
    return () => {
      window.removeEventListener(
        "featuredListingsChanged",
        handleFeaturedChange,
      );
    };
  }, []);

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
      path: "/browse",
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Downloads",
      path: "/downloads",
      icon: <DownloadIcon className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Playground",
      path: "/playground",
      icon: <FaRobot className="h-5 w-5" />,
      isExternal: false,
    },
    {
      name: "Research",
      path: "/research",
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

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-gray-1/30 backdrop-blur-lg">
        <div className="relative flex justify-between py-3 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 font-medium">
          <div className="flex justify-between w-full lg:w-auto gap-3">
            <Link
              to="/"
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
              {featuredListings?.length > 0 && (
                <span className="px-2 xl:px-3 py-2 text-sm tracking-widest text-gray-1">
                  Featured Listings:
                </span>
              )}
              <div className="flex-grow flex space-x-1">
                {featuredListings?.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/item/${listing.username}/${listing.slug}`}
                    className="px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest text-gray-1 hover:bg-gray-1 hover:text-primary-9"
                  >
                    {listing.name}
                  </Link>
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
                    to="/account"
                    className={`px-3 py-2 rounded-md hover:bg-gray-1 hover:text-primary-9 ${
                      location.pathname === "/account"
                        ? "bg-gray-11 text-gray-1"
                        : ""
                    }`}
                  >
                    Account
                  </Link>
                  <Link
                    to="/logout"
                    className="px-3 py-2 rounded-md hover:bg-primary-9"
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md hover:bg-gray-1 hover:text-primary-9"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
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
