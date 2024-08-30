import type { paths } from "gen/api";
import { Client } from "openapi-fetch";

export default class api {
  public client: Client<paths>;

  constructor(client: Client<paths>) {
    this.client = client;
  }

  public async upload(files: File[], listing_id: string) {
    return await this.client.POST("/artifacts/upload/{listing_id}", {
      body: {
        files: [],
      },
      params: {
        path: {
          listing_id,
        },
      },
      bodySerializer() {
        const fd = new FormData();
        files.forEach((file) => fd.append("files", file));
        return fd;
      },
    });
  }
}
