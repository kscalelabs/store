import { AxiosInstance } from "axios";

export interface Part {
  description: string;
  owner: string;
  images: Image[];
  id: string;
  name: string;
}

export interface Bom {
  part_id: string;
  quantity: number;
}

export interface Image {
  id: string;
  user_id: string;
  caption: string;
}

export interface Package {
  name: string;
  url: string;
}

export interface Robot {
  id: string;
  name: string;
  description: string;
  owner: string;
  bom: Bom[];
  images: Image[];
  height: string;
  weight: string;
  degrees_of_freedom: string;
  urdf: string;
  packages: Package[];
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
      await this.api.delete<boolean>("/users/logout/");
    });
  }

  public async me(): Promise<MeResponse> {
    return this.callWrapper(async () => {
      const res = await this.api.get<MeResponse>("/users/me/");
      return res.data;
    });
  }

  public async getUserById(userId: string | undefined): Promise<string> {
    return this.callWrapper(async () => {
      const response = await this.api.get(`/users/${userId}`);
      return response.data.email;
    });
  }

  public async getRobots(
    page: number,
    searchQuery?: string,
  ): Promise<[Robot[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/robots/", {
        params: { page, ...(searchQuery ? { search_query: searchQuery } : {}) },
      });
      return response.data;
    });
  }

  public async getUserBatch(userIds: string[]): Promise<Map<string, string>> {
    return this.callWrapper(async () => {
      const params = new URLSearchParams();
      userIds.forEach((id) => params.append("ids", id));
      const response = await this.api.get("/users/batch/", {
        params,
      });
      const map = new Map();
      for (const index in response.data) {
        map.set(response.data[index].id, response.data[index].email);
      }
      return map;
    });
  }

  public async getMyRobots(page: number): Promise<[Robot[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/robots/me/", {
        params: { page },
      });
      return response.data;
    });
  }

  public async getRobotById(robotId: string | undefined): Promise<Robot> {
    return this.callWrapper(async () => {
      const response = await this.api.get(`/robots/${robotId}`);
      return response.data;
    });
  }

  public async getPartById(partId: string | undefined): Promise<Part> {
    return this.callWrapper(async () => {
      const response = await this.api.get(`/parts/${partId}`);
      return response.data;
    });
  }

  public async currentUser(): Promise<string> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/users/me");
      return response.data.id;
    });
  }

  public async addRobot(robot: Robot): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post("/robots/add/", robot);
    });
  }

  public async deleteRobot(id: string | undefined): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.delete(`robots/delete/${id}/`);
    });
  }

  public async editRobot(robot: Robot): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post(`/robots/edit/${robot.id}/`, robot);
    });
  }

  public async dumpParts(): Promise<Part[]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/parts/dump/");
      return response.data;
    });
  }

  public async getParts(
    page: number,
    searchQuery?: string,
  ): Promise<[Part[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/parts/", {
        params: { page, ...(searchQuery ? { search_query: searchQuery } : {}) },
      });
      return response.data;
    });
  }

  public async getMyParts(page: number): Promise<[Part[], boolean]> {
    return this.callWrapper(async () => {
      const response = await this.api.get("/parts/me/", { params: { page } });
      return response.data;
    });
  }

  public async addPart(part: Part): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post("/parts/add/", part);
    });
  }

  public async deletePart(id: string | undefined): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.delete(`/parts/delete/${id}/`);
    });
  }

  public async editPart(part: Part): Promise<void> {
    return this.callWrapper(async () => {
      await this.api.post<boolean>(`/parts/edit/${part.id}/`, part);
    });
  }

  public async uploadImage(formData: FormData): Promise<string> {
    return this.callWrapper(async () => {
      const res = await this.api.post<UploadImageResponse>(
        "/image/upload/",
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
