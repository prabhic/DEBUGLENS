import { VariableState } from '@/types/gherkin';
import { fetchStepData } from './asyncDebugService';

interface LoadingTask {
  stepId: string;
  blockName: string;
  priority: number;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  retryCount: number;
}

export class BackgroundLoadingService {
  private taskQueue: LoadingTask[] = [];
  private activeRequests: Set<string> = new Set();
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private readonly MAX_RETRIES = 3;

  constructor(private eventEmitter: EventEmitter) {}

  async queueStepLoading(stepId: string, blockName: string, priority: number = 1): Promise<void> {
    this.taskQueue.push({
      stepId,
      blockName,
      priority,
      status: 'pending',
      retryCount: 0
    });
    
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.activeRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
      return;
    }

    // Sort queue by priority
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    // Process pending tasks
    for (const task of this.taskQueue) {
      if (this.activeRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
        break;
      }

      if (task.status === 'pending') {
        this.activeRequests.add(task.stepId);
        task.status = 'loading';
        
        try {
          const data = await fetchStepData(task.blockName);
          task.status = 'completed';
          this.dispatchLoadSuccess(task.stepId, data);
        } catch (error) {
          if (task.retryCount < this.MAX_RETRIES) {
            task.status = 'pending';
            task.retryCount++;
            task.priority += 1; // Increase priority for retry
          } else {
            task.status = 'failed';
            this.dispatchLoadFailure(task.stepId, error);
          }
        } finally {
          this.activeRequests.delete(task.stepId);
          this.processQueue();
        }
      }
    }

    // Clean up completed/failed tasks
    this.taskQueue = this.taskQueue.filter(
      task => task.status !== 'completed' && task.status !== 'failed'
    );
  }

  private dispatchLoadSuccess(stepId: string, data: any): void {
    this.eventEmitter.emit('stepLoadSuccess', { stepId, data });
  }

  private dispatchLoadFailure(stepId: string, error: any): void {
    this.eventEmitter.emit('stepLoadFailure', { stepId, error });
  }
}

export const backgroundLoader = new BackgroundLoadingService();
