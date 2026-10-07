import { Queue, Worker, Job } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env';
import { Submission, SubmissionStatus } from '../models/submission.model';
import { CodingProblem } from '../models/problem.model';
import { codeExecutionService } from './codeExecution/codeExecution.service';
import { gamificationService } from './gamification.service';

export interface SubmissionJobData {
  submissionId: string;
  problemId: string;
  userId: string;
  language: string;
  code: string;
}

class SubmissionQueueService {
  private redisConnection: Redis | null = null;
  private bullQueue: Queue<SubmissionJobData> | null = null;
  private bullWorker: Worker<SubmissionJobData> | null = null;
  private isRedisAvailable: boolean = false;

  // In-Memory Queue fallback for local development or when Redis is not present
  private inMemoryQueue: SubmissionJobData[] = [];
  private inMemoryActiveCount: number = 0;

  constructor() {
    this.initializeQueue();
  }

  private async initializeQueue(): Promise<void> {
    try {
      const redisOptions: RedisOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 2000,
        retryStrategy: (times: number) => {
          if (times > 2) {
            return null; // Stop retrying and fallback to in-memory queue
          }
          return 500;
        },
      };

      const connection = env.redisUrl
        ? new Redis(env.redisUrl, redisOptions)
        : new Redis({
            host: env.redisHost || '127.0.0.1',
            port: env.redisPort || 6379,
            ...redisOptions,
          });

      connection.on('error', (err: any) => {
        if (!this.isRedisAvailable) {
          // Suppress noise if already operating in-memory
          return;
        }
        console.warn(`[SubmissionQueue] Redis connection error: ${err.message}. Switching to In-Memory Queue.`);
        this.isRedisAvailable = false;
      });

      connection.on('connect', () => {
        console.log('[SubmissionQueue] Successfully connected to Redis.');
        this.isRedisAvailable = true;
      });

      // Try connecting within 2 seconds
      await connection.connect().catch(() => {
        // Will fallback to in-memory
      });

      if (connection.status === 'ready' || connection.status === 'connect') {
        this.redisConnection = connection;
        this.isRedisAvailable = true;

        this.bullQueue = new Queue<SubmissionJobData>('code-submissions', {
          connection: this.redisConnection,
        });

        this.bullWorker = new Worker<SubmissionJobData>(
          'code-submissions',
          async (job: Job<SubmissionJobData>) => {
            await this.processSubmissionJob(job.data);
          },
          {
            connection: this.redisConnection,
            concurrency: 4,
          }
        );

        this.bullWorker.on('failed', (job, err) => {
          console.error(`[SubmissionQueue] Job ${job?.id} failed:`, err);
        });

        console.log('[SubmissionQueue] BullMQ Submission Worker initialized with concurrency 4.');
      } else {
        throw new Error('Redis not ready');
      }
    } catch {
      this.isRedisAvailable = false;
      console.log('[SubmissionQueue] Redis is offline or not installed. Operating in In-Memory Queue mode (Safe for Local Dev).');
    }
  }

  // Enqueue a submission job
  public async enqueueSubmission(data: SubmissionJobData): Promise<void> {
    if (this.isRedisAvailable && this.bullQueue) {
      try {
        await this.bullQueue.add(`submission-${data.submissionId}`, data, {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        });
        return;
      } catch (err) {
        console.warn('[SubmissionQueue] Failed to add job to BullMQ, falling back to In-Memory Queue:', err);
      }
    }

    // Fallback: In-Memory Queue
    this.inMemoryQueue.push(data);
    this.processNextInMemoryJob();
  }

  // Asynchronous in-memory processor
  private async processNextInMemoryJob(): Promise<void> {
    if (this.inMemoryQueue.length === 0) {
      return;
    }

    // Process up to 2 concurrent jobs locally to prevent CPU starvation
    if (this.inMemoryActiveCount >= 2) {
      return;
    }

    const jobData = this.inMemoryQueue.shift();
    if (!jobData) return;

    this.inMemoryActiveCount++;
    setImmediate(async () => {
      try {
        await this.processSubmissionJob(jobData);
      } catch (err) {
        console.error('[SubmissionQueue] In-memory job execution error:', err);
      } finally {
        this.inMemoryActiveCount--;
        this.processNextInMemoryJob();
      }
    });
  }

  // Core execution and database synchronization
  public async processSubmissionJob(data: SubmissionJobData): Promise<void> {
    const { submissionId, problemId, userId, language, code } = data;

    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        console.error(`[SubmissionQueue] Submission ${submissionId} not found in database.`);
        return;
      }

      // 1. Transition to Processing
      submission.status = 'Processing';
      await submission.save();

      // 2. Fetch problem test cases
      const problem = await CodingProblem.findById(problemId);
      if (!problem || !problem.testCases || problem.testCases.length === 0) {
        submission.status = 'Internal Error';
        submission.errorMessage = 'Problem or test cases configuration not found.';
        await submission.save();
        return;
      }

      // 3. Evaluate submission safely
      const evaluation = await codeExecutionService.evaluateSubmission(
        language,
        code,
        problem.testCases
      );

      // 4. Update submission record with results
      submission.status = evaluation.status as SubmissionStatus;
      submission.executionTime = evaluation.executionTime;
      submission.memory = evaluation.memory;
      submission.testCasesPassed = evaluation.testCasesPassed;
      submission.totalTestCases = evaluation.totalTestCases;
      submission.errorMessage = evaluation.errorMessage || '';
      submission.details = evaluation.details || [];
      await submission.save();

      // 5. Update problem metrics
      problem.totalSubmissions = (problem.totalSubmissions || 0) + 1;
      if (evaluation.status === 'Accepted') {
        problem.totalAccepted = (problem.totalAccepted || 0) + 1;

        // Trigger gamification
        gamificationService
          .recordProblemSolved(userId as any, problem._id, submission._id)
          .catch((err) => console.error('[SubmissionQueue] Gamification error:', err));
      }
      problem.acceptanceRate = Math.round(((problem.totalAccepted || 0) / problem.totalSubmissions) * 100);
      await problem.save();

      console.log(`[SubmissionQueue] Submission ${submissionId} evaluated: ${evaluation.status} (${evaluation.testCasesPassed}/${evaluation.totalTestCases} passed)`);
    } catch (err: any) {
      console.error(`[SubmissionQueue] Error evaluating submission ${submissionId}:`, err);
      try {
        await Submission.findByIdAndUpdate(submissionId, {
          status: 'Internal Error',
          errorMessage: err.message || 'An unexpected evaluation error occurred.',
        });
      } catch {}
    }
  }

  // Diagnostic queue stats
  public async getQueueStats(): Promise<{ mode: 'bullmq' | 'in-memory'; waiting: number; active: number }> {
    if (this.isRedisAvailable && this.bullQueue) {
      const waiting = await this.bullQueue.getWaitingCount();
      const active = await this.bullQueue.getActiveCount();
      return { mode: 'bullmq', waiting, active };
    }
    return {
      mode: 'in-memory',
      waiting: this.inMemoryQueue.length,
      active: this.inMemoryActiveCount,
    };
  }
}

export const submissionQueueService = new SubmissionQueueService();
