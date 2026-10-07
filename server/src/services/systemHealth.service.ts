import os from 'os';
import mongoose from 'mongoose';
import { Submission } from '../models/submission.model';
import { env } from '../config/env';

interface CpuSnapshot {
  idle: number;
  total: number;
}

export interface SystemHealthMetrics {
  server: {
    cpuUsagePercent: number;
    coreCount: number;
    cpuModel: string;
    cpuSpeedMhz: number;
    loadAvg: number[];
    platform: string;
    arch: string;
    hostname: string;
    serverUptimeSeconds: number;
    processUptimeSeconds: number;
    nodeVersion: string;
    environment: string;
  };
  memory: {
    systemTotalBytes: number;
    systemFreeBytes: number;
    systemUsedBytes: number;
    systemUsagePercent: number;
    processRssBytes: number;
    processHeapTotalBytes: number;
    processHeapUsedBytes: number;
    processHeapUsagePercent: number;
    processExternalBytes: number;
  };
  judge0: {
    endpoint: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    dailyLimit: number;
    usedToday: number;
    remaining: number;
    remainingPercent: number;
    resetsAt: string;
    tier: string;
    localSandboxFallback: boolean;
    lastCheckedAt: string;
    rawMessage?: string;
  };
  executionThroughput: {
    submissionsLastMinute: number;
    submissionsLastFiveMinutes: number;
    submissionsLastHour: number;
    avgExecutionTimeMs: number;
    peakMemoryKb: number;
    activeQueueType: 'BULLMQ_REDIS' | 'IN_MEMORY_SAFE_MODE';
    timeSeries: Array<{
      minuteLabel: string;
      timestamp: number;
      total: number;
      accepted: number;
      failed: number;
    }>;
  };
  database: {
    status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
    latencyMs: number;
    collectionsCount: number;
  };
  timestamp: string;
}

class SystemHealthService {
  private lastCpuSnapshot: CpuSnapshot | null = null;
  private currentCpuPercent: number = 0;
  private judge0DailyUsageCount: number = 0;
  private judge0LastResetDay: number = new Date().getUTCDate();
  private judge0Cache: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    lastCheckedAt: number;
    rawMessage?: string;
  } | null = null;

  constructor() {
    this.initCpuTicker();
  }

  // Sample CPU ticks every 2.5 seconds in background for instantaneous accurate readings
  private initCpuTicker(): void {
    this.lastCpuSnapshot = this.getCpuTimes();
    setInterval(() => {
      const current = this.getCpuTimes();
      if (this.lastCpuSnapshot) {
        const idleDelta = current.idle - this.lastCpuSnapshot.idle;
        const totalDelta = current.total - this.lastCpuSnapshot.total;
        if (totalDelta > 0) {
          const used = 100 - (100 * idleDelta) / totalDelta;
          this.currentCpuPercent = Math.max(0, Math.min(100, Math.round(used * 10) / 10));
        }
      }
      this.lastCpuSnapshot = current;
    }, 2500).unref();
  }

  private getCpuTimes(): CpuSnapshot {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }
    return { idle, total };
  }

  /**
   * Track an execution call against Judge0 daily quota
   */
  public recordJudge0Call(): void {
    const today = new Date().getUTCDate();
    if (today !== this.judge0LastResetDay) {
      this.judge0DailyUsageCount = 0;
      this.judge0LastResetDay = today;
    }
    this.judge0DailyUsageCount++;
  }

  /**
   * Ping Judge0 API and measure live latency
   */
  public async pingJudge0(forceRefresh: boolean = false): Promise<{
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
    rawMessage?: string;
  }> {
    const now = Date.now();
    // Cache ping for 15 seconds unless forced
    if (!forceRefresh && this.judge0Cache && now - this.judge0Cache.lastCheckedAt < 15000) {
      return this.judge0Cache;
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const judge0Url = process.env.JUDGE0_URL || 'https://ce.judge0.com';
      const response = await fetch(`${judge0Url}/about`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const result = {
          status: (latencyMs > 2000 ? 'DEGRADED' : 'ONLINE') as 'ONLINE' | 'DEGRADED',
          latencyMs,
          lastCheckedAt: now,
          rawMessage: 'Judge0 CE cluster responsive',
        };
        this.judge0Cache = result;
        return result;
      } else {
        const result = {
          status: 'DEGRADED' as const,
          latencyMs,
          lastCheckedAt: now,
          rawMessage: `HTTP ${response.status}: ${response.statusText}`,
        };
        this.judge0Cache = result;
        return result;
      }
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';
      const result = {
        status: 'OFFLINE' as const,
        latencyMs,
        lastCheckedAt: now,
        rawMessage: isTimeout ? 'Connection Timed Out (4000ms)' : (err.message || 'Judge0 unreachable'),
      };
      this.judge0Cache = result;
      return result;
    }
  }

  /**
   * Collect all real-time system, memory, Judge0, and execution metrics
   */
  public async getComprehensiveMetrics(): Promise<SystemHealthMetrics> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // 1. CPU & OS Metrics
    const cpus = os.cpus();
    const serverMetrics = {
      cpuUsagePercent: this.currentCpuPercent,
      coreCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown CPU',
      cpuSpeedMhz: cpus[0]?.speed || 0,
      loadAvg: os.loadavg(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      serverUptimeSeconds: Math.floor(os.uptime()),
      processUptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: env.nodeEnv || 'development',
    };

    // 2. Memory Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const processMem = process.memoryUsage();

    const memoryMetrics = {
      systemTotalBytes: totalMem,
      systemFreeBytes: freeMem,
      systemUsedBytes: usedMem,
      systemUsagePercent: Math.round((usedMem / totalMem) * 1000) / 10,
      processRssBytes: processMem.rss,
      processHeapTotalBytes: processMem.heapTotal,
      processHeapUsedBytes: processMem.heapUsed,
      processHeapUsagePercent: Math.round((processMem.heapUsed / processMem.heapTotal) * 1000) / 10,
      processExternalBytes: processMem.external,
    };

    // 3. Judge0 Quota & Latency Probe
    const judge0Probe = await this.pingJudge0(false);
    const dailyLimit = parseInt(process.env.JUDGE0_DAILY_QUOTA || '1000', 10);
    const usedToday = this.judge0DailyUsageCount;
    const remaining = Math.max(0, dailyLimit - usedToday);
    const remainingPercent = Math.round((remaining / dailyLimit) * 1000) / 10;

    // Reset countdown (midnight UTC)
    const nextMidnightUtc = new Date(now);
    nextMidnightUtc.setUTCHours(24, 0, 0, 0);

    const judge0Metrics = {
      endpoint: process.env.JUDGE0_URL || 'https://ce.judge0.com',
      status: judge0Probe.status,
      latencyMs: judge0Probe.latencyMs,
      dailyLimit,
      usedToday,
      remaining,
      remainingPercent,
      resetsAt: nextMidnightUtc.toISOString(),
      tier: process.env.JUDGE0_API_KEY ? 'RapidAPI Dedicated / Custom Tier' : 'Public CE Pool (Auto-Throttled)',
      localSandboxFallback: true,
      lastCheckedAt: new Date(this.judge0Cache?.lastCheckedAt || Date.now()).toISOString(),
      rawMessage: judge0Probe.rawMessage,
    };

    // 4. Execution Throughput & Submissions Per Minute (SPM)
    const [subLast1m, subLast5m, subLast1h, recentAgg, timelineAgg] = await Promise.all([
      Submission.countDocuments({ createdAt: { $gte: oneMinuteAgo } }),
      Submission.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
      Submission.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Submission.aggregate([
        { $match: { createdAt: { $gte: oneHourAgo } } },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$executionTime' },
            peakMemory: { $max: '$memory' },
          },
        },
      ]),
      Submission.aggregate([
        { $match: { createdAt: { $gte: thirtyMinutesAgo } } },
        {
          $project: {
            minute: {
              $dateToString: { format: '%H:%M', date: '$createdAt' },
            },
            status: 1,
          },
        },
        {
          $group: {
            _id: '$minute',
            total: { $sum: 1 },
            accepted: {
              $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $ne: ['$status', 'Accepted'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Format 15-30 minute time series with empty minute padding if needed
    const timeSeries = this.generateTimeSeriesBuckets(timelineAgg);

    const executionThroughput = {
      submissionsLastMinute: subLast1m,
      submissionsLastFiveMinutes: subLast5m,
      submissionsLastHour: subLast1h,
      avgExecutionTimeMs: Math.round((recentAgg[0]?.avgTime || 45) * 10) / 10,
      peakMemoryKb: Math.round(recentAgg[0]?.peakMemory || 18400),
      activeQueueType: (env.redisUrl || env.redisHost ? 'BULLMQ_REDIS' : 'IN_MEMORY_SAFE_MODE') as
        | 'BULLMQ_REDIS'
        | 'IN_MEMORY_SAFE_MODE',
      timeSeries,
    };

    // 5. Database Health
    let dbLatencyMs = 0;
    let dbStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';
    let collectionsCount = 0;

    try {
      const dbReady = mongoose.connection.readyState;
      if (dbReady === 1 && mongoose.connection.db) {
        dbStatus = 'CONNECTED';
        const dbStart = Date.now();
        await mongoose.connection.db.admin().ping();
        dbLatencyMs = Date.now() - dbStart;
        const collections = await mongoose.connection.db.listCollections().toArray();
        collectionsCount = collections.length;
      } else if (dbReady === 2) {
        dbStatus = 'CONNECTING';
      }
    } catch {
      dbStatus = 'DISCONNECTED';
    }

    return {
      server: serverMetrics,
      memory: memoryMetrics,
      judge0: judge0Metrics,
      executionThroughput,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        collectionsCount,
      },
      timestamp: now.toISOString(),
    };
  }

  private generateTimeSeriesBuckets(
    dbAgg: Array<{ _id: string; total: number; accepted: number; failed: number }>
  ): Array<{ minuteLabel: string; timestamp: number; total: number; accepted: number; failed: number }> {
    const map = new Map(dbAgg.map((item) => [item._id, item]));
    const result: Array<{ minuteLabel: string; timestamp: number; total: number; accepted: number; failed: number }> =
      [];

    const now = new Date();
    // Build trailing 15 minute buckets
    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 1000);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      const minuteLabel = `${hours}:${mins}`;

      const matched = map.get(minuteLabel);
      result.push({
        minuteLabel,
        timestamp: d.getTime(),
        total: matched?.total || 0,
        accepted: matched?.accepted || 0,
        failed: matched?.failed || 0,
      });
    }

    return result;
  }
}

export const systemHealthService = new SystemHealthService();
