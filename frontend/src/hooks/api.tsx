import { BACKEND_URL } from "constants/backend";
import type { paths } from "gen/api";
import createClient, { type Middleware } from "openapi-fetch";

const apiClient = createClient<paths>({
  baseUrl: BACKEND_URL,
});

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const accessToken = localStorage.getItem("AUTH");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    request.headers.set("Authorization", `Bearer ${accessToken}`);
    return request;
  },
};

apiClient.use(authMiddleware);

export { apiClient };
