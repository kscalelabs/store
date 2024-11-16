import { FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Logo from "@/components/Logo";
import { useFeaturedListings } from "@/components/listing/FeaturedListings";
import { getNavItems } from "@/components/nav/navigation";
import { useAuthentication } from "@/hooks/useAuth";

interface SidebarItemProps {
  title: string;
  icon?: JSX.Element;
  onClick: () => void;
  isExternal?: boolean;
}

interface SidebarProps {
  show: boolean;
  onClose: () => void;
}

const SidebarItem = ({
  icon,
  title,
  onClick,
  isExternal,
}: SidebarItemProps) => (
  <li>
    <button
      onClick={onClick}
      className="w-full flex items-center py-2 px-3 text-xl text-gray-1 hover:bg-gray-11 hover:text-primary-9 rounded-md"
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="flex items-center gap-2">
        {title}
        {isExternal && <FaExternalLinkAlt className="h-3 w-3" />}
      </span>
    </button>
  </li>
);

const Sidebar = ({ show, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthentication();
  const { featuredListings } = useFeaturedListings();

  const isAdmin = currentUser?.permissions?.includes("is_admin") ?? false;
  const navItems = getNavItems(isAuthenticated, isAdmin);

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
                  <div className="flex flex-col gap-2 py-2">
                    {featuredListings.map((listing) => (
                      <SidebarItem
                        key={listing.id}
                        title={listing.name}
                        onClick={() =>
                          handleItemClick(
                            `/bot/${listing.username}/${listing.slug || listing.id}`,
                          )
                        }
                      />
                    ))}
                    <div className="border-t border-gray-1"></div>
                  </div>
                )}
                <div className="flex flex-col gap-2 py-2">
                  {navItems.map((item) => (
                    <SidebarItem
                      key={item.name}
                      title={item.name}
                      icon={item.icon}
                      onClick={() =>
                        handleItemClick(item.path, item.isExternal)
                      }
                      isExternal={item.isExternal}
                    />
                  ))}
                </div>
                <div className="border-t border-gray-1"></div>
                {isAuthenticated ? (
                  <div className="flex flex-col gap-2 py-2">
                    <SidebarItem
                      title="Account"
                      onClick={() => handleItemClick("/account")}
                    />
                    <SidebarItem
                      title="Logout"
                      onClick={() => handleItemClick("/logout")}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 py-4">
                    <SidebarItem
                      title="Sign In"
                      onClick={() => handleItemClick("/login")}
                    />
                    <SidebarItem
                      title="Sign Up"
                      onClick={() => handleItemClick("/signup")}
                    />
                  </div>
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
