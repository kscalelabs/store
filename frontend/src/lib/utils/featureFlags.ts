import { ROBOT_REGISTRATION_ENABLED } from "@/lib/constants/env";

export const FEATURE_FLAGS = {
  KLANG_EXECUTION: false,
  DEMO_ROBOT_ENABLED: true,
  ROBOT_REGISTRATION: ROBOT_REGISTRATION_ENABLED,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
