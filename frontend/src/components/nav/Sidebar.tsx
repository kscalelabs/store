import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Logo from "@/components/Logo";
import { useAuthentication } from "@/hooks/useAuth";

interface SidebarItemProps {
  title: string;
  icon?: JSX.Element;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

const SidebarItem = ({
  icon,
  title,
  onClick,
  size = "md",
  align = "left",
}: SidebarItemProps) => {
  return (
    <li>
      <button onClick={onClick} className="w-full focus:outline-none">
        <span className="flex items-center py-2 px-4 text-gray-1 rounded-md hover:bg-gray-1 hover:text-primary-9 group">
          {align === "right" ? (
            <>
              <span className="flex-grow" />
              <span
                className={`${size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs"} mr-1`}
              >
                {title}
              </span>
              {icon && <span className="text-xs">{icon}</span>}
            </>
          ) : (
            <>
              {icon && <span className="text-xs mr-1">{icon}</span>}
              <span
                className={`${size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs"}`}
              >
                {title}
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  );
};

const SidebarSeparator = () => {
  return <li className="my-0.5 border-t border-gray-11" />;
};

interface Props {
  show: boolean;
  onClose: () => void;
}

const Sidebar = ({ show, onClose }: Props) => {
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

  return (
    <div>
      {show && (
        <div className="fixed inset-0 z-50 bg-gray-1/20 backdrop-blur-sm">
          <div className="fixed top-0 right-0 z-40 w-full sm:w-96 md:w-80 lg:w-64 h-full overflow-y-auto transition-transform bg-gray-12">
            <div className="flex justify-between items-center p-2 border-b border-gray-11">
              <Logo />
              <button
                onClick={onClose}
                className="text-gray-1 hover:text-primary-9 rounded-lg p-2"
              >
                <FaTimes size={18} />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <nav className="p-2">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.name}
                  title={item.name}
                  onClick={() => {
                    if (item.isExternal) {
                      window.open(item.path, "_blank");
                    } else {
                      navigate(item.path);
                      onClose();
                    }
                  }}
                />
              ))}
              <SidebarSeparator />
              {communityItems.map((item) => (
                <SidebarItem
                  key={item.name}
                  title={item.name}
                  onClick={() => window.open(item.path, "_blank")}
                  size="sm"
                />
              ))}
              <SidebarSeparator />
              {isAuthenticated ? (
                <>
                  <SidebarItem
                    title="Account"
                    onClick={() => {
                      navigate("/account");
                      onClose();
                    }}
                  />
                  <SidebarItem
                    title="Logout"
                    onClick={() => {
                      navigate("/logout");
                      onClose();
                    }}
                  />
                </>
              ) : (
                <>
                  <SidebarItem
                    title="Sign In"
                    onClick={() => {
                      navigate("/login");
                      onClose();
                    }}
                  />
                  <SidebarItem
                    title="Sign Up"
                    onClick={() => {
                      navigate("/signup");
                      onClose();
                    }}
                  />
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
