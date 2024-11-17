import { v4 as uuidv4 } from 'uuid';
import { backgroundLoader } from './backgroundLoadingService';

interface DebugSession {
  sessionId: string;
  prompt: string;
  completedSteps: Set<string>;
  metadata: {
    startTime: Date;
    lastActivity: Date;
  };
}

const sessions: Record<string, DebugSession> = {};

export const initializeSession = async (prompt: string): Promise<DebugSession> => {
  const sessionId = uuidv4();
  const session = {
    sessionId,
    prompt,
    completedSteps: new Set(),
    metadata: {
      startTime: new Date(),
      lastActivity: new Date()
    }
  };
  
  sessions[sessionId] = session;
  return session;
};

export const queueStepsForSession = async (
  sessionId: string, 
  steps: Array<{ id: string; data: any }>
): Promise<void> => {
  const session = sessions[sessionId];
  if (!session) throw new Error('Session not found');

  // Queue all steps with the backgroundLoader
  for (const step of steps) {
    const priority = session.completedSteps.size === 0 ? 2 : 1; // Higher priority for first step
    await backgroundLoader.queueStepLoading(
      `${sessionId}-${step.id}`,
      priority,
      step.data
    );
  }
};

export const markStepComplete = (sessionId: string, stepId: string): void => {
  const session = sessions[sessionId];
  if (!session) throw new Error('Session not found');
  
  session.completedSteps.add(stepId);
  session.metadata.lastActivity = new Date();
};