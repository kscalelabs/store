export const FEATURE_FLAGS = {
  KLANG_EXECUTION: false,
  ROBOT_STREAMING: false,
  DEMO_ROBOT_ENABLED: true,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
