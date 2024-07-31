import { apiClient } from "./api";

type UploadMetadata = {
  artifact_type: string;
  listing_id: string;
};

export const APICalls = {
  upload: async (file: File, request: UploadMetadata) => {
    return await apiClient.POST("/artifacts/upload", {
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
  },
};
