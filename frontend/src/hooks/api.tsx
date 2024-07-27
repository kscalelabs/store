import { AxiosInstance } from "axios";

export interface Artifact {
  id: string;
  caption: string;
}

export interface Listing {
  id: string;
  name: string;
  user_id: string;
  child_ids: string[];
  artifact_ids: string[];
  description?: string;
}

export interface NewListing {
  name: string;
  description?: string;
  artifact_ids: string[];
  child_ids: string[];
}

interface GithubAuthResponse {
  api_key: string;
}

interface MeResponse {
  user_id: string;
  email: string;
  username: string;
  admin: boolean;
}

interface UploadImageResponse {
  image_id: string;
}

export class api {
  public api: AxiosInstance;
  public onError: (error: Error) => void;
  public onFinish: () => void;

  constructor(
    api: AxiosInstance,
    onError: (error: Error) => void = () => {},
    onFinish: () => void = () => {},
  ) {
    this.api = api;
    this.onError = onError;
    this.onFinish = onFinish;
  }

  private async callWrapper<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.onError(error as Error);
      throw error;
    } finally {
      this.onFinish();
    }
  }

  public async sendRegisterGithub(): Promise<string> {
    return this.callWrapper(async () => {
      const res = await this.api.get("/users/github/login");
      return res.data;
    });
  }

  public async loginGithub(code: string): Promise<GithubAuthResponse> {
    return this.callWrapper(async () => {
      const res = await this.api.get<GithubAuthResponse>(
        `/users/github/code/${code}`,
      );
      return res.data;
    });
  }

  public async logout(): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.delete<boolean>("/users/logout");
    });
  }

  public async me(): Promise<MeResponse> {
    return this.callWrapper(async () => {
      const res = await this.api.get<MeResponse>("/users/me");
      return res.data;
    });
  }

  public async getUserById(userId: string | undefined): Promise<string> {
    return this.callWrapper(async () => {
      const response = await this.api.get(`/users/${userId}`);
      return response.data.email;
    });
  }

  public async getListings(
    page: number,
    searchQuery?: string,
  ): Promise<[Listing[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/listings/search", {
        params: { page, ...(searchQuery ? { search_query: searchQuery } : {}) },
      });
      return response.data;
    });
  }

  public async getUserBatch(userIds: string[]): Promise<Map<string, string>> {
    return this.callWrapper(async () => {
      const params = new URLSearchParams();
      userIds.forEach((id) => params.append("ids", id));
      const response = await this.api.get("/users/batch", {
        params,
      });
      const map = new Map();
      for (const index in response.data) {
        map.set(response.data[index].id, response.data[index].email);
      }
      return map;
    });
  }

  public async getMyListings(page: number): Promise<[Listing[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/listings/me", {
        params: { page },
      });
      return response.data;
    });
  }

  public async getListingById(listingId: string | undefined): Promise<Listing> {
    return this.callWrapper(async () => {
      const response = await this.api.get(`/listings/${listingId}`);
      return response.data;
    });
  }

  public async currentUser(): Promise<string> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/users/me");
      return response.data.user_id;
    });
  }

  public async addListing(listing: NewListing): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post("/listings/add", listing);
    });
  }

  public async deleteListing(id: string | undefined): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.delete(`/listings/delete/${id}`);
    });
  }

  public async editListing(listing: Listing): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post(`/listings/edit/${listing.id}`, listing);
    });
  }

  public async uploadImage(formData: FormData): Promise<string> {
    return this.callWrapper(async () => {
      const res = await this.api.post<UploadImageResponse>(
        "/images/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return res.data.image_id;
    });
  }
}
