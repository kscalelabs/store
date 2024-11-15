import { FaRobot, FaTerminal } from "react-icons/fa";
import { FaRegFileLines } from "react-icons/fa6";

import ROUTES from "@/lib/types/routes";
import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";

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

export const AUTHENTICATED_NAV_ITEMS: BaseNavItem[] = [];

export const getNavItems = (isAuthenticated: boolean): BaseNavItem[] => {
  let navItems = [...DEFAULT_NAV_ITEMS];

  if (FEATURE_FLAGS.DEMO_ROBOT_ENABLED || isAuthenticated) {
    navItems = [TERMINAL_NAV_ITEM, ...navItems];
  }

  if (isAuthenticated) {
    navItems = [...AUTHENTICATED_NAV_ITEMS, ...navItems];
  }

  return navItems;
};
