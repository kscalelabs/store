import type { paths } from "gen/api";
import { Client } from "openapi-fetch";

export interface UploadRequest {
  listing_id: string;
}

export default class Api {
  public client: Client<paths>;

  constructor(client: Client<paths>) {
    this.client = client;
  }

  private createFormData(files: File[], request: UploadRequest): FormData {
    const fd = new FormData();
    files.forEach((file) => fd.append("files", file));
    fd.append("metadata", JSON.stringify(request));
    return fd;
  }

  public async upload(files: File[], request: UploadRequest) {
    try {
      const response = await this.client.POST("/artifacts/upload", {
        body: {
          files: [],
          metadata: "image",
        },
        bodySerializer: () => this.createFormData(files, request),
      });

      return response;
    } catch (error) {
      console.error("Upload failed", error);
      throw new Error("Failed to upload files");
    }
  }
}
