import { PseudoContent } from '@/types/pseudo';

interface PseudoResponse {
  content: PseudoContent;
}

export async function loadPseudoFile(content: string): Promise<PseudoResponse> {
  try {
    console.log('Parsing content:', content);
    const parsedContent = JSON.parse(content);
    
    if (!parsedContent.abstraction_levels || !parsedContent.sections) {
      throw new Error('Invalid file structure: missing required fields');
    }
    
    if (!Array.isArray(parsedContent.sections)) {
      throw new Error('Invalid file structure: sections must be an array');
    }
    
    return { content: parsedContent };
  } catch (error) {
    console.error('Error parsing pseudo file:', error);
    throw new Error(error instanceof Error ? error.message : 'Invalid pseudo file format');
  }
} 