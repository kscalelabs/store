import type { paths } from "gen/api";
import { Client } from "openapi-fetch";

export default class api {
  public client: Client<paths>;

  constructor(client: Client<paths>) {
    this.client = client;
  }

  public async upload(
    file: File,
    request: {
      artifact_type: string;
      listing_id: string;
    },
  ) {
    return await this.client.POST("/artifacts/upload", {
      body: {
        file: "",
        metadata: "image",
      },
      bodySerializer() {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("metadata", JSON.stringify(request));
        return fd;
      },
    });
  }
}
