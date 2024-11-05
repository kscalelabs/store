import { FaDiscord, FaGithub, FaTimes } from "react-icons/fa";
import {
  FaDownload,
  FaRegFileLines,
  FaRobot,
  FaSearchengin,
  FaTerminal,
  FaWpexplorer,
  FaXTwitter,
} from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

import Logo from "@/components/Logo";
import { useFeaturedListings } from "@/components/listing/FeaturedListings";
import { useAuthentication } from "@/hooks/useAuth";

interface SidebarItemProps {
  title: string;
  icon?: JSX.Element;
  onClick: () => void;
}

interface SidebarProps {
  show: boolean;
  onClose: () => void;
}

const SidebarItem = ({ icon, title, onClick }: SidebarItemProps) => (
  <li>
    <button
      onClick={onClick}
      className="w-full flex items-center py-2 px-3 text-xl text-gray-1 hover:bg-gray-1 hover:text-primary-9 rounded-md"
    >
      {icon && <span className="mr-2">{icon}</span>}
      {title}
    </button>
  </li>
);

type NavItem = {
  name: string;
  path: string;
  isExternal: boolean;
  icon?: JSX.Element;
};

const Sidebar = ({ show, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthentication();
  const { featuredListings } = useFeaturedListings();

  let navItems: NavItem[] = [];

  if (isAuthenticated) {
    navItems = [
      {
        name: "Terminal",
        path: "/terminal",
        isExternal: false,
        icon: <FaTerminal />,
      },
      ...navItems,
    ];
  }

  const technicalItems = [
    { name: "Browse", path: "/browse", icon: <FaSearchengin /> },
    { name: "Downloads", path: "/downloads", icon: <FaDownload /> },
    { name: "Playground", path: "/playground", icon: <FaRobot /> },
    { name: "Research", path: "/research", icon: <FaWpexplorer /> },
    {
      name: "Docs",
      path: "https://docs.kscale.dev/",
      icon: <FaRegFileLines />,
    },
    { name: "Code", path: "https://github.com/kscalelabs", icon: <FaGithub /> },
  ];

  const communityItems = [
    { name: "Discord", path: "https://discord.gg/kscale", icon: <FaDiscord /> },
    { name: "Twitter", path: "https://x.com/kscalelabs", icon: <FaXTwitter /> },
  ];

  const handleItemClick = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, "_blank");
    } else {
      onClose();
      navigate(path, { replace: true });
    }
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-50 bg-gray-1/20 backdrop-blur-sm">
          <aside className="fixed top-0 right-0 z-40 w-64 h-full overflow-y-auto transition-transform bg-gray-12 p-4">
            <div className="flex justify-between items-center mb-4">
              <Logo />
              <button
                onClick={onClose}
                className="text-gray-1 hover:text-primary-9 p-1"
              >
                <FaTimes size={18} />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <div className="border-t border-gray-1 my-2"></div>
            <nav>
              <ul className="space-y-1">
                {featuredListings && featuredListings.length > 0 && (
                  <>
                    <div className="text-xl font-medium text-gray-1 px-3 py-2">
                      Featured Listings:
                    </div>
                    {featuredListings.map((listing) => (
                      <SidebarItem
                        key={listing.id}
                        title={listing.name}
                        onClick={() =>
                          handleItemClick(
                            `/item/${listing.username}/${listing.slug || listing.id}`,
                          )
                        }
                      />
                    ))}
                    <div className="border-t border-gray-1 my-2"></div>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    {navItems.map((item) => (
                      <SidebarItem
                        key={item.name}
                        title={item.name}
                        icon={item.icon}
                        onClick={() => handleItemClick(item.path)}
                      />
                    ))}
                    <div className="border-t border-gray-1 my-2"></div>
                  </>
                )}
                {technicalItems.map((item) => (
                  <SidebarItem
                    key={item.name}
                    title={item.name}
                    icon={item.icon}
                    onClick={() =>
                      handleItemClick(item.path, item.path.startsWith("http"))
                    }
                  />
                ))}
                <div className="border-t border-gray-1 my-2"></div>
                {communityItems.map((item) => (
                  <SidebarItem
                    key={item.name}
                    title={item.name}
                    icon={item.icon}
                    onClick={() => handleItemClick(item.path, true)}
                  />
                ))}
                <div className="border-t border-gray-1 my-2"></div>
                {isAuthenticated ? (
                  <>
                    <SidebarItem
                      title="Account"
                      onClick={() => handleItemClick("/account")}
                    />
                    <SidebarItem
                      title="Logout"
                      onClick={() => handleItemClick("/logout")}
                    />
                  </>
                ) : (
                  <>
                    <SidebarItem
                      title="Sign In"
                      onClick={() => handleItemClick("/login")}
                    />
                    <SidebarItem
                      title="Sign Up"
                      onClick={() => handleItemClick("/signup")}
                    />
                  </>
                )}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
