export const FEATURE_FLAGS = {
  LOAD_CUSTOM_CODEBASE: false,
  GENERATE_DEBUG_SCENARIO: false,
  AI_CHAT: true,
  BREAKPOINTS: true,
  VARIABLE_TRACKING: true,
  CONCEPT_DETAILS: true,
  PARALLEL_LOADING: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
}; 