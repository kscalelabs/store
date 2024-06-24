import axios, { AxiosInstance } from "axios";

export interface Part {
  description: string;
  owner: string;
  images: Image[];
  part_id: string;
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

export interface Robot {
  robot_id: string;
  name: string;
  description: string;
  owner: string;
  bom: Bom[];
  images: Image[];
  height: string;
  weight: string;
  degrees_of_freedom: string;
}

interface MeResponse {
  user_id: string;
  email: string;
  username: string;
  admin: boolean;
}

export class api {
  public api: AxiosInstance;

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  public async send_register_email(email: string): Promise<void> {
    try {
      await this.api.post("/users/send-register-email", { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error sending registration email:",
          error.response?.data,
        );
        throw new Error(
          error.response?.data?.detail || "Error sending verification email",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async get_registration_email(token: string): Promise<string> {
    try {
      const res = await this.api.get("/users/registration-email/" + token);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error fetching registration email:",
          error.response?.data,
        );
        throw new Error(
          error.response?.data?.detail || "Error fetching registration email",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async register(
    token: string,
    username: string,
    password: string,
  ): Promise<void> {
    try {
      await this.api.post("/users/register/", { token, username, password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error registering:", error.response?.data);
        throw new Error(
          error.response?.data?.detail ||
            "Error registering with token " + token,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async change_email(code: string): Promise<void> {
    try {
      await this.api.post("/users/change-email/" + code);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error changing email:", error.response?.data);
        throw new Error(
          error.response?.data?.detail ||
            "Error changing email with code " + code,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async send_change_email(new_email: string): Promise<void> {
    try {
      await this.api.post("/users/change-email", { new_email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error sending change email:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error sending change email",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async change_password(
    old_password: string,
    new_password: string,
  ): Promise<void> {
    try {
      await this.api.post("/users/change-password", {
        old_password,
        new_password,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error changing password:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error changing password",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      await this.api.post("/users/login/", { email, password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error logging in:", error.response?.data);
        throw new Error(
          error.response?.data?.detail ||
            "Error logging in with email " + email,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }
  public async logout(): Promise<void> {
    try {
      await this.api.delete("/users/logout/");
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

  public async forgot(email: string): Promise<void> {
    try {
      await this.api.post("/users/forgot-password/", { email });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error sending forgot password:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error sending forgot password",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async reset_password(token: string, password: string): Promise<void> {
    try {
      await this.api.post("/users/reset-password/" + token, { password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error resetting password:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error resetting password",
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async me(): Promise<MeResponse> {
    try {
      const res = await this.api.get("/users/me/");
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
    return response.data.username;
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
    userIds.forEach((id) => params.append("user_ids", id));
    const response = await this.api.get("/users/batch/", {
      params,
    });
    const map = new Map();
    for (const index in response.data) {
      map.set(response.data[index].user_id, response.data[index].username);
    }
    return map;
  }

  public async getYourRobots(page: number): Promise<[Robot[], boolean]> {
    try {
      const response = await this.api.get("/robots/your/", {
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
      const response = await this.api.get("/robots/user/");
      return response.data;
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
      await this.api.post(`robots/edit-robot/${robot.robot_id}/`, robot);
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
  public async getYourParts(page: number): Promise<[Part[], boolean]> {
    try {
      const response = await this.api.get("/parts/your/", { params: { page } });
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
      await this.api.delete(`parts/delete/${id}/`);
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
      await this.api.post(`parts/edit-part/${part.part_id}/`, part);
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
  public async getImage(imageId: string): Promise<Blob> {
    try {
      const response = await this.api.get(`/image/${imageId}/`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching image:", error.response?.data);
        throw new Error(
          error.response?.data?.detail || "Error fetching image " + imageId,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }
  public async uploadImage(formData: FormData): Promise<string> {
    try {
      const res = await this.api.post("/image/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.id;
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
