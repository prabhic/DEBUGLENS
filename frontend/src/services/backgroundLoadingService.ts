import { EventEmitter } from 'events';
import { VariableState, FeatureContent } from '@/types/gherkin';
import { fetchStepData } from './asyncDebugService';

interface LoadingTask {
  stepId: string;
  blockName: string;
  priority: number;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  retryCount: number;
  featureContent: FeatureContent;
}

export class BackgroundLoadingService {
  private taskQueue: LoadingTask[] = [];
  private isProcessing: boolean = false;
  private readonly MAX_RETRIES = 3;

  constructor(private eventEmitter: EventEmitter) {}

  async queueStepLoading(
    stepId: string, 
    stepName: string, 
    priority: number,
    featureContent: FeatureContent
  ): Promise<void> {
    this.taskQueue.push({
      stepId,
      blockName: stepName,
      priority,
      status: 'pending',
      retryCount: 0,
      featureContent
    });
    
    console.log('[BackgroundLoadingService] Queued step:', {
      stepId,
      stepName,
      priority,
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      this.taskQueue.sort((a, b) => b.priority - a.priority);

      const task = this.taskQueue[0];
      
      console.log('[BackgroundLoadingService] Processing task:', {
        stepId: task.stepId,
        blockName: task.blockName,
        priority: task.priority,
        retryCount: task.retryCount
      });

      task.status = 'loading';
      
      try {
        const data = await fetchStepData(task.blockName, task.featureContent);
        task.status = 'completed';
        this.dispatchLoadSuccess(task.stepId, data);
      } catch (error) {
        if (task.retryCount < this.MAX_RETRIES) {
          task.status = 'pending';
          task.retryCount++;
          task.priority += 1;
          console.log('[BackgroundLoadingService] Retrying task:', {
            stepId: task.stepId,
            retryCount: task.retryCount
          });
        } else {
          task.status = 'failed';
          this.dispatchLoadFailure(task.stepId, error);
        }
      }

      this.taskQueue = this.taskQueue.filter(
        t => t.status !== 'completed' && t.status !== 'failed'
      );

    } finally {
      this.isProcessing = false;
      
      if (this.taskQueue.length > 0) {
        console.log('[BackgroundLoadingService] Queue status:', {
          remainingTasks: this.taskQueue.length,
          nextTask: this.taskQueue[0]?.blockName
        });
        
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private dispatchLoadSuccess(stepId: string, data: any): void {
    this.eventEmitter.emit('stepLoadSuccess', { stepId, data });
  }

  private dispatchLoadFailure(stepId: string, error: any): void {
    this.eventEmitter.emit('stepLoadFailure', { stepId, error });
  }
}

export const backgroundLoader = new BackgroundLoadingService(new EventEmitter());
