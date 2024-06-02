import axios from "axios";

class rob {
  private api;

  constructor(baseURL: string | undefined) {
    this.api = axios.create({ baseURL });
  }

  public async getRobotById(robotId: string | undefined): Promise<any> {
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
}

export default new rob("http://127.0.0.1:8080/api");
