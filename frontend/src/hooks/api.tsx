import type { paths } from "@/gen/api";
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

  public async uploadKernel(file: File, listing_id: string) {
    const { data } = await this.client.POST(
      "/artifacts/presigned/{listing_id}",
      {
        params: {
          path: {
            listing_id,
          },
          query: {
            filename: file.name,
          },
        },
      },
    );

    if (!data?.upload_url) {
      throw new Error("Failed to get upload URL");
    }

    const uploadResponse = await fetch(data.upload_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return data.artifact_id;
  }
}
