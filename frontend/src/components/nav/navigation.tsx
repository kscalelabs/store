import { FaRobot, FaTerminal, FaWpexplorer } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";

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
    name: "Bots",
    path: ROUTES.BOTS.BROWSE.path,
    icon: <FaRobot />,
  },
  {
    name: "Research",
    path: ROUTES.RESEARCH.path,
    icon: <FaWpexplorer />,
  },
  {
    name: "Docs",
    path: "https://docs.kscale.dev/",
    isExternal: true,
    icon: <FaRegFileLines />,
  },
];

export const AUTHENTICATED_NAV_ITEMS: BaseNavItem[] = [
  {
    name: "Terminal",
    path: ROUTES.TERMINAL.path,
    icon: <FaTerminal />,
  },
];

export const getNavItems = (isAuthenticated: boolean): BaseNavItem[] => {
  return isAuthenticated
    ? [...AUTHENTICATED_NAV_ITEMS, ...DEFAULT_NAV_ITEMS]
    : DEFAULT_NAV_ITEMS;
};
