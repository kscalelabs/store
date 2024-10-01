import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Logo from "@/components/Logo";
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

const Sidebar = ({ show, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthentication();

  const navItems = [
    { name: "K-Lang", path: "/k-lang" },
    { name: "Buy", path: "/buy" },
    { name: "Browse", path: "/browse" },
    { name: "Downloads", path: "/downloads" },
    { name: "Docs", path: "https://docs.kscale.dev/", isExternal: true },
  ];

  const communityItems = [
    { name: "Discord", path: "https://discord.gg/kscale" },
    { name: "Twitter", path: "https://x.com/kscalelabs" },
    { name: "GitHub", path: "https://github.com/kscalelabs" },
  ];

  const handleItemClick = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, "_blank");
    } else {
      navigate(path);
      onClose();
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
            <nav>
              <ul className="space-y-1l">
                {navItems.map((item) => (
                  <SidebarItem
                    key={item.name}
                    title={item.name}
                    onClick={() => handleItemClick(item.path, item.isExternal)}
                  />
                ))}
                <div className="border-t border-gray-1 my-2"></div>
                {communityItems.map((item) => (
                  <SidebarItem
                    key={item.name}
                    title={item.name}
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
