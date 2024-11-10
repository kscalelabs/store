import { route, string } from "react-router-typesafe-routes/dom";

const ROUTES = {
  HOME: route(""),

  // General pages
  ABOUT: route("about"),
  RESEARCH: route("research"),
  TOS: route("tos"),
  PRIVACY: route("privacy"),

  // Account routes
  ACCOUNT: route("account"),
  LOGIN: route("login"),
  LOGOUT: route("logout"),
  SIGNUP: route(
    "signup",
    {},
    {
      EMAIL: route(":id", { params: { id: string().defined() } }),
    },
  ),
  KEYS: route("keys"),

  // Listings
  BOTS: route(
    "bots",
    {},
    {
      CREATE: route("create"),
      BROWSE: route("browse"),
    },
  ),
  BOT: route("bot/:username/:slug", {
    params: {
      username: string().defined(),
      slug: string().defined(),
    },
  }),
  PROFILE: route("profile/:id?", {
    params: { id: string() },
  }),
  FILE: route("file/:artifactId/:fileName?", {
    params: { artifactId: string().defined(), fileName: string() },
  }),

  // Sell.
  SELL: route(
    "sell",
    {},
    {
      DASHBOARD: route("dashboard"),
      ONBOARDING: route("onboarding"),
      DELETE: route("delete"),
    },
  ),

  // Orders
  ORDER: route(
    "order",
    {},
    {
      SUCCESS: route("success"),
    },
  ),
  ORDERS: route("orders"),

  // Terminal
  TERMINAL: route(
    "terminal",
    {},
    {
      WITH_ID: route(":id", {
        params: { id: string() },
      }),
    },
  ),

  // Link robot
  LINK: route("link"),

  // Not found
  NOT_FOUND: route("404"),
};

export default ROUTES;
