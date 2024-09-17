import {
  FaBookOpen,
  FaDoorClosed,
  FaDoorOpen,
  FaHome,
  FaKey,
  FaPen,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAuthentication } from "@/hooks/useAuth";
import clsx from "clsx";

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
  size,
  align,
}: SidebarItemProps) => {
  return (
    <li>
      <button onClick={onClick} className="w-full focus:outline-none">
        <span className="flex items-center py-2 px-4 text-gray-12 rounded-lg hover:bg-gray-3 group">
          {align === "right" ? (
            <>
              <span className="flex-grow" />
              <span
                className={clsx(
                  icon && "mr-4",
                  size === "sm" && "text-sm",
                  size === "lg" && "text-lg",
                )}
              >
                {title}
              </span>
              {icon}
            </>
          ) : (
            <>
              {icon}
              <span
                className={clsx(
                  icon && "ml-4",
                  size === "sm" && "text-sm",
                  size === "lg" && "text-lg",
                )}
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
  return (
    <li className="py-1">
      <div className="border-t border-gray-12" />
    </li>
  );
};

interface Props {
  show: boolean;
  onClose: () => void;
}

const Sidebar = ({ show, onClose }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthentication();

  return (
    <div>
      {show ? (
        <div
          className="fixed top-0 right-0 z-40 w-full h-full p-4 overflow-y-auto transition-transform bg-gray-1"
          tabIndex={-1}
        >
          <div className="flex justify-between items-center">
            <h5
              id="drawer-navigation-label"
              className="text-base font-semibold text-gray-8 uppercase"
            >
              {/* SETTINGS */}
            </h5>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-8 bg-transparent hover:bg-gray-3 hover:text-gray-12 rounded-lg text-sm p-1.5 inline-flex items-center"
            >
              <FaTimes />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <div className="py-4 overflow-y-auto">
            <ul className="space-y-1">
              <SidebarItem
                title="Home"
                icon={<FaHome />}
                onClick={() => {
                  navigate("/");
                  onClose();
                }}
                size="md"
              />
              <SidebarItem
                title="Browse"
                icon={<FaBookOpen />}
                onClick={() => {
                  navigate("/browse");
                  onClose();
                }}
                size="md"
              />
              <SidebarItem
                title="Create"
                icon={<FaPen />}
                onClick={() => {
                  navigate("/create");
                  onClose();
                }}
                size="md"
              />
              <SidebarSeparator />
              {isAuthenticated && (
                <SidebarItem
                  title="Profile"
                  icon={<FaUserCircle />}
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                  size="md"
                />
              )}
              {isAuthenticated && (
                <SidebarItem
                  title="API Keys"
                  icon={<FaKey />}
                  onClick={() => {
                    navigate("/keys");
                    onClose();
                  }}
                  size="md"
                />
              )}
              {isAuthenticated ? (
                <SidebarItem
                  title="Logout"
                  icon={<FaDoorClosed />}
                  onClick={() => {
                    navigate("/logout");
                    onClose();
                  }}
                  size="md"
                />
              ) : (
                <SidebarItem
                  title="Login / Sign Up"
                  icon={<FaDoorOpen />}
                  onClick={() => {
                    navigate("/login");
                    onClose();
                  }}
                  size="md"
                />
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Sidebar;
