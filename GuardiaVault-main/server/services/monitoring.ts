/**
 * Advanced Monitoring Service
 * Provides Application Performance Monitoring (APM) and metrics collection
 */

import { logWarn, logDebug } from "./logger";

interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxMetricsHistory = 1000;

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // In production, send to monitoring service (Datadog, New Relic, etc.)
    if (process.env.MONITORING_ENABLED === 'true') {
      this.sendToMonitoringService(metric);
    }
  }

  /**
   * Record performance metric for API endpoints
   */
  recordPerformance(endpoint: string, method: string, duration: number, statusCode: number) {
    const metric: PerformanceMetric = {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetricsHistory);
    }

    // Alert on slow endpoints
    if (duration > 5000 && process.env.NODE_ENV === 'production') {
      logWarn('Slow endpoint detected', {
        context: 'recordPerformance',
        method,
        endpoint,
        duration,
        unit: 'ms'
      });
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentMetrics = this.metrics.filter(
      m => m.timestamp && m.timestamp.getTime() > oneHourAgo
    );

    const recentPerformance = this.performanceMetrics.filter(
      m => m.timestamp.getTime() > oneHourAgo
    );

    const avgResponseTime = recentPerformance.length > 0
      ? recentPerformance.reduce((sum, m) => sum + m.duration, 0) / recentPerformance.length
      : 0;

    const errorRate = recentPerformance.length > 0
      ? recentPerformance.filter(m => m.statusCode >= 400).length / recentPerformance.length
      : 0;

    const requestsPerMinute = recentPerformance.length / 60;

    return {
      metricsCount: recentMetrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      totalRequests: recentPerformance.length,
      slowEndpoints: recentPerformance
        .filter(m => m.duration > 2000)
        .map(m => `${m.method} ${m.endpoint}`)
        .slice(0, 5),
    };
  }

  /**
   * Get health check data
   */
  getHealthCheck() {
    const summary = this.getMetricsSummary();
    
    return {
      status: summary.errorRate < 0.1 && summary.avgResponseTime < 2000 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      metrics: summary,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  /**
   * Send metric to external monitoring service
   */
  private async sendToMonitoringService(metric: MetricData) {
    // In production, integrate with:
    // - Datadog: https://docs.datadoghq.com/api/
    // - New Relic: https://docs.newrelic.com/docs/apis/
    // - Prometheus: Push gateway
    // - CloudWatch: AWS SDK
    
    const monitoringUrl = process.env.MONITORING_ENDPOINT;
    if (!monitoringUrl) return;

    try {
      await fetch(monitoringUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          tags: metric.tags,
          timestamp: metric.timestamp?.toISOString(),
        }),
      });
    } catch (error) {
      // Silently fail - don't break app if monitoring fails
      logDebug('Failed to send metric to monitoring service', {
        context: 'sendToMonitoringService',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export const monitoringService = new MonitoringService();

/**
 * Express middleware to track request performance
 */
export function performanceMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (chunk: any, encoding: any) {
    const duration = Date.now() - startTime;
    
    monitoringService.recordPerformance(
      req.path,
      req.method,
      duration,
      res.statusCode
    );

    originalEnd.call(this, chunk, encoding);
  };

  next();
}

