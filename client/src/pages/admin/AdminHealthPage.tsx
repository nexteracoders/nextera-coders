import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu,
  Database,
  RefreshCw,
  Zap,
  Server,
  Activity,
  HardDrive,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Terminal,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { SystemHealthMetrics } from '../../types/admin.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../utils/cn';

export const AdminHealthPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  // Auto-refresh interval (in seconds: 5, 10, 30, 0 = paused)
  const [pollInterval, setPollInterval] = useState<number>(5);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(
    async (isBackground: boolean = false) => {
      try {
        if (!isBackground) {
          setRefreshing(true);
        }
        const data = await adminService.getSystemHealth();
        setMetrics(data);
        setLastRefreshedAt(new Date());
      } catch (err: any) {
        if (!isBackground) {
          toastError(err?.message || 'Failed to fetch system health metrics');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    fetchMetrics(false);
  }, [fetchMetrics]);

  // Set up polling timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pollInterval > 0) {
      timerRef.current = setInterval(() => {
        fetchMetrics(true);
      }, pollInterval * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [pollInterval, fetchMetrics]);

  // Manual Judge0 Ping test
  const handleTestJudge0Ping = async () => {
    try {
      setTestingPing(true);
      const res = await adminService.testJudge0Ping();
      success(`Judge0 Ping: ${res.latencyMs}ms (${res.status})`);
      // Update the main metrics cache
      if (metrics) {
        setMetrics({
          ...metrics,
          judge0: {
            ...metrics.judge0,
            status: res.status as any,
            latencyMs: res.latencyMs,
            rawMessage: res.rawMessage,
            lastCheckedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to ping Judge0');
    } finally {
      setTestingPing(false);
    }
  };

  // Helper formatting functions
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE':
      case 'CONNECTED':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'DEGRADED':
      case 'CONNECTING':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getCpuBadgeColor = (percent: number) => {
    if (percent >= 80) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (percent >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="h-10 bg-slate-200 dark:bg-dark-800 rounded-lg w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 bg-slate-100 dark:bg-dark-850 rounded-2xl border border-slate-200/80 dark:border-dark-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-slate-100 dark:bg-dark-850 rounded-2xl border border-slate-200/80 dark:border-dark-800 animate-pulse" />
      </div>
    );
  }

  const { server, memory, judge0, executionThroughput, database } = metrics!;

  // Max value for Submissions time-series chart scaling
  const maxTimeSeriesValue = Math.max(
    5,
    ...executionThroughput.timeSeries.map((t) => t.total)
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header & Real-Time Controls */}
      <AdminPageHeader
        title="Server & Execution Health"
        description="Live hardware load, Node.js process heap memory, Judge0 cluster sandbox quota, and real-time submission throughput."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Polling Status Indicator */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all',
                pollInterval > 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200/60 dark:bg-dark-800 border-slate-300 dark:border-dark-700 text-slate-500'
              )}
            >
              <span className="relative flex h-2 w-2">
                {pollInterval > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    pollInterval > 0 ? 'bg-emerald-500' : 'bg-slate-400'
                  )}
                ></span>
              </span>
              <span>
                {pollInterval > 0
                  ? `Live (${pollInterval}s)`
                  : 'Polling Paused'}
              </span>
            </div>

            {/* Interval Selector */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-dark-800 p-1 text-xs">
              <span className="px-2 font-medium text-slate-500 dark:text-slate-400">
                Poll:
              </span>
              {[
                { label: '5s', val: 5 },
                { label: '10s', val: 10 },
                { label: '30s', val: 30 },
                { label: 'Off', val: 0 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setPollInterval(item.val)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium transition-all',
                    pollInterval === item.val
                      ? 'bg-white dark:bg-dark-700 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Manual Refresh Now */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics(false)}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-amber-500')} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Now'}</span>
            </Button>
          </div>
        }
      />

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Server CPU Usage */}
        <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Server CPU Usage
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {server.cpuUsagePercent}%
            </span>
            <span
              className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                getCpuBadgeColor(server.cpuUsagePercent)
              )}
            >
              {server.cpuUsagePercent >= 80
                ? 'High Load'
                : server.cpuUsagePercent >= 50
                ? 'Moderate'
                : 'Optimal'}
            </span>
          </div>

          {/* CPU Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-dark-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                server.cpuUsagePercent >= 80
                  ? 'bg-rose-500'
                  : server.cpuUsagePercent >= 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(100, server.cpuUsagePercent)}%` }}
            />
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>{server.coreCount} Logical Cores</span>
            <span>Load: {server.loadAvg[0]?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* KPI 2: Memory Utilization */}
        <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Memory Utilization
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {memory.systemUsagePercent}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              RAM Utilized
            </span>
          </div>

          {/* Memory Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-dark-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                memory.systemUsagePercent >= 85
                  ? 'bg-rose-500'
                  : memory.systemUsagePercent >= 70
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              )}
              style={{ width: `${memory.systemUsagePercent}%` }}
            />
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>{formatBytes(memory.systemUsedBytes)} Used</span>
            <span>Heap: {formatBytes(memory.processHeapUsedBytes)}</span>
          </div>
        </div>

        {/* KPI 3: Judge0 API Quota Remaining */}
        <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Judge0 Quota Remaining
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {judge0.remaining}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              / {judge0.dailyLimit} calls
            </span>
          </div>

          {/* Quota Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-dark-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                judge0.remainingPercent <= 15
                  ? 'bg-rose-500'
                  : judge0.remainingPercent <= 40
                  ? 'bg-amber-500'
                  : 'bg-purple-500'
              )}
              style={{ width: `${judge0.remainingPercent}%` }}
            />
          </div>

          <div className="mt-3 text-xs flex items-center justify-between">
            <span
              className={cn(
                'px-2 py-0.5 rounded-md font-bold text-[10px] border flex items-center gap-1',
                getStatusColor(judge0.status)
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
              {judge0.status} ({judge0.latencyMs}ms)
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              {judge0.remainingPercent}% Left
            </span>
          </div>
        </div>

        {/* KPI 4: Total Submissions Per Minute (SPM) */}
        <div className="relative overflow-hidden bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Throughput (SPM)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {executionThroughput.submissionsLastMinute}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Submissions / min
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-dark-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(8, executionThroughput.submissionsLastMinute * 10))}%`,
              }}
            />
          </div>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>5m: {executionThroughput.submissionsLastFiveMinutes} subs</span>
            <span>1h: {executionThroughput.submissionsLastHour} subs</span>
          </div>
        </div>
      </div>

      {/* Main Section: Submissions per Minute Timeline Graph */}
      <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Real-Time Code Execution Velocity (Trailing 15 Minutes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Code execution requests per minute with accepted vs runtime/wrong answer breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500/80" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Other / Failed</span>
            </div>
            <div className="text-slate-400 font-mono pl-2 border-l border-slate-200 dark:border-dark-800">
              Avg Time: <strong className="text-slate-800 dark:text-slate-200">{executionThroughput.avgExecutionTimeMs}ms</strong>
            </div>
          </div>
        </div>

        {/* Bar Timeline Visualizer */}
        <div className="h-44 w-full flex items-end gap-1.5 sm:gap-3 pt-6 border-b border-slate-200 dark:border-dark-800 pb-2">
          {executionThroughput.timeSeries.map((bucket, idx) => {
            const heightPercent = Math.max(
              6,
              Math.min(100, Math.round((bucket.total / maxTimeSeriesValue) * 100))
            );
            const acceptedPercent =
              bucket.total > 0 ? (bucket.accepted / bucket.total) * 100 : 0;
            const failedPercent = 100 - acceptedPercent;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Hover Tooltip */}
                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-slate-900 dark:bg-black text-white px-2.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap shadow-xl border border-slate-700">
                  <div className="font-bold text-amber-400">{bucket.minuteLabel}</div>
                  <div>Total: {bucket.total} subs</div>
                  <div className="text-emerald-400">Passed: {bucket.accepted}</div>
                </div>

                {/* Vertical Stacked Bar */}
                <div
                  className="w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                  style={{ height: `${bucket.total === 0 ? 6 : heightPercent}%` }}
                >
                  <div
                    className={cn(
                      'w-full transition-all',
                      bucket.total === 0 ? 'bg-slate-200 dark:bg-dark-800' : 'bg-emerald-500'
                    )}
                    style={{ height: `${bucket.total === 0 ? 100 : acceptedPercent}%` }}
                  />
                  {bucket.total > 0 && failedPercent > 0 && (
                    <div
                      className="w-full bg-amber-500"
                      style={{ height: `${failedPercent}%` }}
                    />
                  )}
                </div>

                {/* Minute Label */}
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-amber-500 transition-colors">
                  {bucket.minuteLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Judge0 Live Diagnostics & Memory Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Judge0 Sandbox Health & Probe */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Judge0 Sandbox Isolation Engine
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-speed execution sandbox with isolated compiler micro-containers.
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5',
                  getStatusColor(judge0.status)
                )}
              >
                <span className="h-2 w-2 rounded-full bg-current"></span>
                {judge0.status}
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Endpoint Host:
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {judge0.endpoint}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Cluster Latency:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {judge0.latencyMs} ms (Round-Trip)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Daily Quota Tier:
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {judge0.tier}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Local Sandbox Fallback:
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active (Zero-Downtime Safe Mode)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-dark-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Last probe: {new Date(judge0.lastCheckedAt).toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestJudge0Ping}
              disabled={testingPing}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Zap className={cn('w-3.5 h-3.5 text-amber-500', testingPing && 'animate-bounce')} />
              <span>{testingPing ? 'Pinging Cluster...' : 'Test Judge0 Ping'}</span>
            </Button>
          </div>
        </div>

        {/* Panel 2: Node.js Process & Memory Footprint */}
        <div className="bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Node.js V8 Engine Heap & Runtime
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    V8 Garbage Collection metrics and process memory allocation.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-700">
                {server.nodeVersion}
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Heap Allocated / Used:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatBytes(memory.processHeapUsedBytes)} / {formatBytes(memory.processHeapTotalBytes)} ({memory.processHeapUsagePercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Resident Set Size (RSS):
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatBytes(memory.processRssBytes)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Node Process Uptime:
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatUptime(server.processUptimeSeconds)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200/60 dark:border-dark-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Server Host Uptime:
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatUptime(server.serverUptimeSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-dark-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Platform: <strong className="text-slate-700 dark:text-slate-300">{server.platform} ({server.arch})</strong></span>
            <span>Host: <strong className="text-slate-700 dark:text-slate-300">{server.hostname}</strong></span>
          </div>
        </div>
      </div>

      {/* Row 3: Database & Queue Infrastructure State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* MongoDB State */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                MongoDB Cluster
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{database.status}</span>
                <span className="text-xs font-mono font-normal text-emerald-500">
                  ({database.latencyMs}ms ping)
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {database.collectionsCount} collections
          </span>
        </div>

        {/* Execution Queue Mode */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Submission Queue
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {executionThroughput.activeQueueType === 'BULLMQ_REDIS'
                  ? 'BullMQ (Redis Cluster)'
                  : 'In-Memory Pipeline (Safe Mode)'}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Active
          </span>
        </div>

        {/* Environment & Security Audit */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Environment & Security
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {server.environment} mode
              </div>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Updated {lastRefreshedAt.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};
