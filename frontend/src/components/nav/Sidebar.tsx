import clsx from "clsx";
import { FaDoorClosed, FaHome, FaQuestion, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface SidebarItemProps {
  title: string;
  icon?: JSX.Element;
  onClick?: () => void;
}

const SidebarItem = ({ icon, title, onClick }: SidebarItemProps) => {
  return (
    <li>
      <button onClick={onClick} className="w-full">
        <span className="flex items-center p-4 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
          {icon}
          <span className={icon && "ms-3"}>{title}</span>
        </span>
      </button>
    </li>
  );
};

interface Props {
  show: boolean;
  onClose: () => void;
}

const Sidebar = ({ show, onClose }: Props) => {
  const navigate = useNavigate();

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
        <ul className="space-y-2 font-medium">
          <SidebarItem
            title="Home"
            icon={<FaHome />}
            onClick={() => {
              navigate("/");
              onClose();
            }}
          />
          <SidebarItem
            title="About"
            icon={<FaQuestion />}
            onClick={() => {
              navigate("/about");
              onClose();
            }}
          />
          <SidebarItem
            title="Logout"
            icon={<FaDoorClosed />}
            onClick={() => {
              navigate("/logout");
              onClose();
            }}
          />
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
