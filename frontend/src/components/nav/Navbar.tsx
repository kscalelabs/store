import { useState } from "react";
import {
  FaBars,
  FaDiscord,
  FaGithub,
  FaRegFileLines,
  FaRobot,
  FaWpexplorer,
  FaXTwitter,
} from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

import Logo from "@/components/Logo";
import Sidebar from "@/components/nav/Sidebar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuthentication } from "@/hooks/useAuth";
import {
  DownloadIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

const Navbar = () => {
  const { isAuthenticated } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false);

  const navItems = [
    { name: "Pro", path: "/pro", isExternal: false },
    { name: "Mini", path: "/mini", isExternal: false },
  ];

  const communityItems = [
    {
      name: "Discord",
      path: "https://discord.gg/kscale",
      icon: <FaDiscord className="h-5 w-5" />,
      isExternal: true,
    },
    {
      name: "Twitter",
      path: "https://x.com/kscalelabs",
      icon: <FaXTwitter className="h-5 w-5" />,
      isExternal: true,
    },
  ];

  const technicalItems = [
    {
      name: "Docs",
      path: "https://docs.kscale.dev/",
      icon: <FaRegFileLines className="h-5 w-5" />,
      isExternal: true,
    },
    {
      name: "Browse",
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
      name: "Code",
      path: "https://github.com/kscalelabs",
      icon: <FaGithub className="h-5 w-5" />,
      isExternal: true,
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
        <NavigationMenuLink asChild>
          {isExternal ? (
            <a
              href={href}
              className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-1 hover:text-primary-9 focus:bg-gray-1 focus:text-primary-9 ${className}`}
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
              className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-1 hover:text-primary-9 focus:bg-gray-1 focus:text-primary-9 ${className}`}
            >
              <div className="flex items-center text-sm font-semibold leading-none">
                <span className="mr-2">{icon}</span>
                <span>{title}</span>
              </div>
            </Link>
          )}
        </NavigationMenuLink>
      </li>
    );
  };

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-gray-1/30 backdrop-blur-lg">
        <div className="flex items-center justify-between py-3 mx-4 sm:mx-6 md:mx-10 xl:mx-16 2xl:mx-28 font-medium">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3">
            <Link
              to="/"
              className="
                flex items-center
                flex-grow
                lg:flex-grow-0
                space-x-2 p-3
                rounded-lg
                bg-gray-12 hover:bg-primary-9
                transition-all duration-300
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
            <div className="flex space-x-1 bg-gray-12 rounded-lg p-2 flex-grow justify-center">
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
              <NavigationMenu
                onMouseEnter={() => setIsHoveringDropdown(true)}
                onMouseLeave={() => setIsHoveringDropdown(false)}
              >
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={`px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest text-gray-1 ${
                        isHoveringDropdown
                          ? "bg-gray-1 text-primary-9"
                          : "hover:bg-gray-1 hover:text-primary-9"
                      }`}
                      disableClick
                    >
                      Developers
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid grid-cols-2 w-[400px] gap-2 p-2">
                        <div>
                          <h3 className="text-white font-semibold mb-2 pl-5">
                            Community
                          </h3>
                          {communityItems.map((item) => (
                            <ListItem
                              key={item.name}
                              title={item.name}
                              href={item.path}
                              icon={item.icon}
                              className="group"
                              isExternal={item.isExternal}
                            />
                          ))}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-2 pl-5">
                            Technical
                          </h3>
                          {technicalItems.map((item) => (
                            <ListItem
                              key={item.name}
                              title={item.name}
                              href={item.path}
                              icon={item.icon}
                              className="group"
                              isExternal={item.isExternal}
                            />
                          ))}
                        </div>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
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
