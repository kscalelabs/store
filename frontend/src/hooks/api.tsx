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
}

export class api {
  public api: AxiosInstance;

  constructor(api: AxiosInstance) {
    this.api = api;
  }
  public async getUserById(userId: string | undefined): Promise<string> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data.email;
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
}
