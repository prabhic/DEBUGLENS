import { VariableState } from '@/types/pseudo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface BreakpointResponse {
  success: boolean;
  message?: string;
}

interface DebugStateResponse {
  success: boolean;
  message?: string;
  variables?: VariableState[];
}

// Export as a named function
export async function setBreakpoint(
  fileId: string,
  lineNumber: number,
  abstractionLevel: string
): Promise<BreakpointResponse> {
  console.log('debugService: Setting breakpoint with params:', {
    fileId,
    lineNumber,
    abstractionLevel
  });

  try {
    const response = await fetch(`${API_BASE_URL}/debug/breakpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        lineNumber,
        abstractionLevel,
        action: 'toggle',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('debugService: Server response:', data);
    return data;
  } catch (error) {
    console.error('debugService: Error:', error);
    throw error;
  }
}

export async function getDebugState(
  fileId: string,
  lineNumber: number,
  abstractionLevel: string
): Promise<DebugStateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/debug/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId,
        lineNumber,
        abstractionLevel,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('debugService: Error fetching debug state:', error);
    throw error;
  }
} 