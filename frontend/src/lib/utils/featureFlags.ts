export const FEATURE_FLAGS = {
  KLANG_EXECUTION: false,
  ROBOT_STREAMING: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
