export const DEBUG_CONCEPTS: Record<number, { description: string; concept: string }> = {
  1: {
    description: "Initialization phase of the program",
    concept: "Program initialization involves setting up the initial state and required resources."
  },
  2: {
    description: "Branch creation in the repository",
    concept: "Version control systems use branches to manage parallel development streams."
  },
  3: {
    description: "Branch property modification",
    concept: "Branches can be modified to update their properties or change their state."
  }
} as const;

export const KEYBOARD_SHORTCUTS = {
  START_DEBUG: 'F5',
  STOP_DEBUG: 'Shift+F5',
  STEP_NEXT: 'F10',
} as const;

export const PANEL_DIMENSIONS = {
  VARIABLES_PANEL_WIDTH: 350,
  LINE_NUMBER_WIDTH: 48,
  BREAKPOINT_AREA_WIDTH: 40,
  GUTTER_TOTAL_WIDTH: 88,
} as const; 