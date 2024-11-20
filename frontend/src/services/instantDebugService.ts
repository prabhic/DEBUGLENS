import { EventEmitter } from 'events';

interface InstantDebugOptions {
  enableStreamingUpdates?: boolean;
  enhancementDelay?: number;
  maxConcurrentRequests?: number;
}

export class InstantDebugService {
  private eventEmitter: EventEmitter;
  private activePrompt?: string;
  private enhancementQueue: Set<string>;
  private options: Required<InstantDebugOptions>;

  constructor(options?: InstantDebugOptions) {
    this.eventEmitter = new EventEmitter();
    this.enhancementQueue = new Set();
    this.options = {
      enableStreamingUpdates: true,
      enhancementDelay: 100,
      maxConcurrentRequests: 3,
      ...options
    };
  }

  async startDebugging(prompt: string) {
    this.activePrompt = prompt;
    
    // Generate initial skeleton immediately
    const skeleton = await this.generateInitialSkeleton(prompt);
    this.eventEmitter.emit('debug:init', skeleton);

    // Start progressive enhancement
    this.enhanceStepsProgressively(skeleton.steps);
  }

  private async generateInitialSkeleton(prompt: string) {
    const response = await fetch('/api/instant-debug/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        format: 'skeleton' // Signal we want fast, minimal response
      })
    });

    return await response.json();
  }

  private async enhanceStepsProgressively(steps: string[]) {
    const enhanceStep = async (stepId: string) => {
      try {
        const response = await fetch('/api/instant-debug/enhance-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId })
        });

        const enhancement = await response.json();
        this.eventEmitter.emit('step:enhanced', { stepId, ...enhancement });
      } catch (error) {
        console.error(`Failed to enhance step ${stepId}:`, error);
      }
    };

    // Queue enhancement for each step
    for (const stepId of steps) {
      this.enhancementQueue.add(stepId);
      setTimeout(() => {
        enhanceStep(stepId);
      }, this.options.enhancementDelay);
    }
  }

  onUpdate(callback: (update: any) => void) {
    this.eventEmitter.on('debug:update', callback);
    return () => this.eventEmitter.off('debug:update', callback);
  }
} 