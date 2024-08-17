import type { paths } from "gen/api";
import { Client } from "openapi-fetch";

export default class api {
  public client: Client<paths>;

  constructor(client: Client<paths>) {
    this.client = client;
  }

  public async upload(
    files: File[],
    request: {
      listing_id: string;
    },
  ) {
    return await this.client.POST("/artifacts/upload", {
      body: {
        files: [],
        metadata: "image",
      },
      bodySerializer() {
        const fd = new FormData();
        files.forEach((file) => fd.append("files", file));
        fd.append("metadata", JSON.stringify(request));
        return fd;
      },
    });
  }
}
