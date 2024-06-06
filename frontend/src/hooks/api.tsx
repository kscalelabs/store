import axios, { AxiosInstance } from "axios";

export interface PurchaseLink {
  url: string;
  price: number;
  name: string;
}

export interface UsedBy {
  name: string;
  id: string;
  stars: number;
}

export interface Part {
  name: string;
  owner: string;
  description: string;
  images: Image[];
  part_id: string;
  used_by: UsedBy[];
  purchase_links: PurchaseLink[];
}

export interface Bom {
  id: string;
  name: string;
  quantity: number;
  price: number;
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
  public async getRobots(): Promise<Robot[]> {
    try {
      const response = await this.api.get("/robots");
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
      await this.api.post("/add/robot/", robot);
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
      const response = await this.api.get("/parts");
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
}
