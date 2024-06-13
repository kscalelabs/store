import axios, { AxiosInstance } from "axios";

export interface Part {
  description: string;
  owner: string;
  images: Image[];
  part_id: string;
  part_name: string;
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
  verified: boolean;
  admin: boolean;
}

export class api {
  public api: AxiosInstance;

  constructor(api: AxiosInstance) {
    this.api = api;
  }

  public async register(
    email: string,
    username: string,
    password: string,
  ): Promise<void> {
    try {
      await this.api.post("/users/register/", { email, username, password });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error registering:", error.response?.data);
        throw new Error(
          error.response?.data?.detail ||
            "Error registering with email " + email,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async verify_email(code: string): Promise<void> {
    try {
      await this.api.post("/users/verify-email/" + code);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error verifying email:", error.response?.data);
        throw new Error(
          error.response?.data?.detail ||
            "Error verifying email with code " + code,
        );
      } else {
        console.error("Unexpected error:", error);
        throw new Error("Unexpected error");
      }
    }
  }

  public async send_verify_email(): Promise<void> {
    try {
      await this.api.post("/users/send-verify-email");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error sending verification email:",
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
  public async getRobots(): Promise<Robot[]> {
    try {
      const response = await this.api.get("/robots/");
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
  public async getYourRobots(): Promise<Robot[]> {
    try {
      const response = await this.api.get("/robots/your/");
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
  public async getParts(): Promise<Part[]> {
    try {
      const response = await this.api.get("/parts/");
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
  public async getYourParts(): Promise<Part[]> {
    try {
      const response = await this.api.get("/parts/your/");
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
    const s = part.part_name;
    try {
      await this.api.post("/parts/add/", part);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error adding part:" + part.part_name,
          error.response?.data,
        );
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
    const s = part.part_name;
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
}
