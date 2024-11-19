import { FaRobot, FaTerminal } from "react-icons/fa";
import { FaChartBar, FaRegFileLines } from "react-icons/fa6";

import ROUTES from "@/lib/types/routes";

export interface BaseNavItem {
  name: string;
  path: string;
  isExternal?: boolean;
  icon?: JSX.Element;
}

export interface NavItem extends BaseNavItem {
  icon?: JSX.Element;
}

export const DEFAULT_NAV_ITEMS: BaseNavItem[] = [
  {
    name: "Robots Hub",
    path: ROUTES.BOTS.BROWSE.path,
    icon: <FaRobot />,
  },
  {
    name: "Docs",
    path: "https://docs.kscale.dev/",
    isExternal: true,
    icon: <FaRegFileLines />,
  },
];

const TERMINAL_NAV_ITEM: BaseNavItem = {
  name: "Terminal",
  path: ROUTES.TERMINAL.path,
  icon: <FaTerminal />,
};

const ADMIN_NAV_ITEM: BaseNavItem = {
  name: "Admin",
  path: ROUTES.ADMIN.path,
  icon: <FaChartBar />,
};

export const AUTHENTICATED_NAV_ITEMS: BaseNavItem[] = [];

export const getNavItems = (
  isAuthenticated: boolean,
  isAdmin: boolean,
): BaseNavItem[] => {
  let navItems = [...DEFAULT_NAV_ITEMS];

  if (isAdmin) {
    navItems = [ADMIN_NAV_ITEM, TERMINAL_NAV_ITEM, ...navItems];
  }

  if (isAuthenticated) {
    navItems = [...AUTHENTICATED_NAV_ITEMS, ...navItems];
  }

  return navItems;
};
