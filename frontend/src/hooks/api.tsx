import axios, { AxiosInstance } from "axios";

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
  caption: string;
  url: string;
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
  api_key_id: string;
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

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  public async sendRegisterGithub(): Promise<string> {
    try {
      const res = await this.api.get("/users/github/login");
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error redirecting to github:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error redirecting to github",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async loginGithub(code: string): Promise<GithubAuthResponse> {
    try {
      const res = await this.api.get<GithubAuthResponse>(
        `/users/github/code/${code}`,
      );
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error logging in:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error logging in with github",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.api.delete<boolean>("/users/logout/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error logging out:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error logging out");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async me(): Promise<MeResponse> {
    try {
      const res = await this.api.get<MeResponse>("/users/me/");
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching current user:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error fetching current user",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getUserById(userId: string | undefined): Promise<string> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data.email;
  }

  public async getRobots(
    page: number,
    searchQuery?: string,
  ): Promise<[Robot[], boolean]> {
    try {
      const response = await this.api.get("/robots/", {
        params: { page, ...(searchQuery ? { search_query: searchQuery } : {}) },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching robots:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error fetching robots",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getUserBatch(userIds: string[]): Promise<Map<string, string>> {
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
  }

  public async getMyRobots(page: number): Promise<[Robot[], boolean]> {
    try {
      const response = await this.api.get("/robots/me/", {
        params: { page },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching robots:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error fetching robots",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getRobotById(robotId: string | undefined): Promise<Robot> {
    try {
      const response = await this.api.get(`/robots/${robotId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching robot:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error fetching robot");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getPartById(partId: string | undefined): Promise<Part> {
    try {
      const response = await this.api.get(`/parts/${partId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching robot:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error fetching robot");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async currentUser(): Promise<string> {
    try {
      const response = await this.api.get("/users/me");
      return response.data.id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching current user:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error fetching current user",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async addRobot(robot: Robot): Promise<void> {
    const s = robot.name;
    try {
      await this.api.post("/robots/add/", robot);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error adding robot:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error adding robot " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async deleteRobot(id: string | undefined): Promise<void> {
    const s = id;
    try {
      await this.api.delete(`robots/delete/${id}/`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error deleting robot:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error deleting robot " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async editRobot(robot: Robot): Promise<void> {
    const s = robot.name;
    try {
      await this.api.post(`/robots/edit/${robot.id}/`, robot);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error editing robot:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error editing robot " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async dumpParts(): Promise<Part[]> {
    try {
      const response = await this.api.get("/parts/dump/");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching parts:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error fetching parts");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getParts(
    page: number,
    searchQuery?: string,
  ): Promise<[Part[], boolean]> {
    try {
      const response = await this.api.get("/parts/", {
        params: { page, ...(searchQuery ? { search_query: searchQuery } : {}) },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching parts:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error fetching parts");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async getMyParts(page: number): Promise<[Part[], boolean]> {
    try {
      const response = await this.api.get("/parts/me/", { params: { page } });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching parts:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Error fetching parts");
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async addPart(part: Part): Promise<void> {
    const s = part.name;
    try {
      await this.api.post("/parts/add/", part);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error adding part:" + part.name, error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error adding part " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async deletePart(id: string | undefined): Promise<void> {
    const s = id;
    try {
      await this.api.delete(`/parts/delete/${id}/`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error deleting part:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error deleting part " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async editPart(part: Part): Promise<void> {
    const s = part.name;
    try {
      await this.api.post<boolean>(`/parts/edit/${part.id}/`, part);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error editing part:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error editing part " + s,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async uploadImage(formData: FormData): Promise<string> {
    try {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error uploading image:", error.response?.data);
        throw new Error(
          error.response?.data?.detail + "gmama" + formData ||
            "Error uploading image",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }
}
