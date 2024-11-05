import { paths } from "@/gen/api";

export type SingleRobotResponse =
  paths["/robots/list"]["get"]["responses"][200]["content"]["application/json"]["robots"][number];
