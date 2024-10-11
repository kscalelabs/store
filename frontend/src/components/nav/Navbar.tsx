import { useState } from "react";
import { FaBars, FaDiscord, FaGithub } from "react-icons/fa";
import { FaRegFileLines, FaWpexplorer, FaXTwitter } from "react-icons/fa6";
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

const Navbar = () => {
  const { isAuthenticated } = useAuthentication();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const location = useLocation();
  const [isHoveringCommunity, setIsHoveringCommunity] = useState(false);

  const navItems = [
    { name: "K-Lang", path: "/k-lang", isExternal: false },
    { name: "Buy", path: "/buy", isExternal: false },
    { name: "Browse", path: "/browse", isExternal: false },
    { name: "Downloads", path: "/downloads", isExternal: false },
  ];

  const communityItems = [
    {
      name: "Discord",
      path: "https://discord.gg/kscale",
      icon: <FaDiscord className="h-5 w-5" />,
      // description:
      //   "Connect with other robot developers, researchers, and enthusiasts.",
    },
    {
      name: "Twitter",
      path: "https://x.com/kscalelabs",
      icon: <FaXTwitter className="h-5 w-5" />,
      // description: "Follow us on Twitter for updates on what we're building.",
    },
    {
      name: "GitHub",
      path: "https://github.com/kscalelabs",
      icon: <FaGithub className="h-5 w-5" />,
      // description: "Check out our open-source projects on GitHub.",
    },
    {
      name: "Docs",
      path: "https://docs.kscale.dev/",
      icon: <FaRegFileLines className="h-5 w-5" />,
    },
    {
      name: "Research",
      path: "/research",
      icon: <FaWpexplorer className="h-5 w-5" />,
    },
  ];

  const ListItem = ({
    className,
    href,
    title,
    children,
    icon,
  }: {
    className?: string;
    href: string;
    title: string;
    children: string;
    icon: React.ReactNode;
  }) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            href={href}
            className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-1 hover:text-primary-9 focus:bg-gray-1 focus:text-primary-9 ${className}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center text-sm font-semibold leading-none">
              <span className="mr-2">{icon}</span>
              <span>{title}</span>
            </div>
            <p className="line-clamp-2 text-sm leading-snug">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  };

  return (
    <>
      <nav className="fixed w-full z-30 top-0 start-0 bg-gray-1/30 backdrop-blur-lg">
        <div className="flex items-center justify-between py-2 mx-4 sm:mx-6 md:mx-10 xl:mx-16 font-medium">
          <Link
            to="/"
            className="flex items-center space-x-2 bg-gray-12 p-3 rounded-lg hover:bg-primary-9 transition-all duration-300"
          >
            <Logo />
          </Link>
          <div className="hidden lg:flex items-center flex-grow justify-between ml-4">
            <div className="flex space-x-1 bg-gray-12 rounded-lg p-2 flex-grow justify-center">
              {navItems.map((item) =>
                item.isExternal ? (
                  <a
                    key={item.name}
                    href={item.path}
                    className={`px-2 xl:px-3 py-2 rounded-md text-sm tracking-wide xl:tracking-widest text-gray-1 hover:bg-primary-9`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
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
                onMouseEnter={() => setIsHoveringCommunity(true)}
                onMouseLeave={() => setIsHoveringCommunity(false)}
              >
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={`px-2 xl:px-3 py-2 rounded-md text-sm tracking-widest text-gray-1 ${
                        isHoveringCommunity
                          ? "bg-gray-1 text-primary-9"
                          : "hover:bg-gray-1 hover:text-primary-9"
                      }`}
                      disableClick
                    >
                      Community
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[300px] gap-2 p-2">
                        {communityItems.map((item) => (
                          <ListItem
                            key={item.name}
                            title={item.name}
                            href={item.path}
                            icon={item.icon}
                            className="group"
                          >
                            {item.description}
                          </ListItem>
                        ))}
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
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden text-gray-300 hover:bg-gray-700 bg-gray-12 hover:text-white p-4 rounded-md text-sm"
          >
            <FaBars size={20} />
          </button>
        </div>
      </nav>
      <Sidebar show={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default Navbar;
