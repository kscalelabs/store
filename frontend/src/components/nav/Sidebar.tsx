import clsx from "clsx";
import { useAuthentication } from "hooks/auth";
import {
  FaBookOpen,
  FaDoorClosed,
  FaDoorOpen,
  FaHome,
  FaKey,
  FaLock,
  FaPen,
  FaQuestion,
  FaScroll,
  FaTimes,
  FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SidebarItemProps {
  title: string;
  icon?: JSX.Element;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const SidebarItem = ({ icon, title, onClick, size }: SidebarItemProps) => {
  return (
    <li>
      <button onClick={onClick} className="w-full focus:outline-none">
        <span className="flex items-center py-2 px-4 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
          {icon}
          {/* <span className={icon && "ms-5"}>{title}</span> */}
          <span
            className={clsx(
              icon && "ms-5",
              size === "sm" && "text-sm",
              size === "lg" && "text-lg",
            )}
          >
            {title}
          </span>
        </span>
      </button>
    </li>
  );
};

const SidebarSeparator = () => {
  return (
    <li className="py-1">
      <div className="border-t border-gray-200 dark:border-gray-700" />
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
    <div
      className={clsx(
        !show && "translate-x-full",
        "fixed top-0 right-0 z-40 w-64 h-screen p-4 overflow-y-auto transition-transform bg-white dark:bg-gray-800",
      )}
      tabIndex={-1}
    >
      <h5
        id="drawer-navigation-label"
        className="text-base font-semibold text-gray-500 uppercase dark:text-gray-400"
      >
        SETTINGS
      </h5>

      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute top-2.5 end-2.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
      >
        <FaTimes />
        <span className="sr-only">Close menu</span>
      </button>
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
              title="Login"
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
      {/* Aligned to bottom */}
      <div className="absolute bottom-4 w-full">
        <ul className="space-y-1 font-medium mt-4">
          <SidebarItem
            title="About"
            icon={<FaQuestion />}
            onClick={() => {
              navigate("/about");
              onClose();
            }}
            size="sm"
          />
          <SidebarItem
            title="Privacy Policy"
            icon={<FaLock />}
            onClick={() => {
              navigate("/privacy");
              onClose();
            }}
            size="sm"
          />
          <SidebarItem
            title="Terms of Service"
            icon={<FaScroll />}
            onClick={() => {
              navigate("/tos");
              onClose();
            }}
            size="sm"
          />
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
