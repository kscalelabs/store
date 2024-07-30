import { BACKEND_URL } from "constants/backend";
import type { paths } from "gen/api";
import createClient from "openapi-fetch";

export const useApi = () => {
  const api = createClient<paths>({
    baseUrl: BACKEND_URL,
  });

  return api;
};
