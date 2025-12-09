#!/usr/bin/env python3
"""
Performance Optimization - Enterprise-grade performance optimization and caching
"""

import asyncio
import cProfile
import functools
import gc
import hashlib
import io
import logging
import multiprocessing
import pickle
import pstats
import time
import tracemalloc
from collections import defaultdict, deque
from collections.abc import Callable
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

import aioredis
import msgpack
import numpy as np
import orjson
import psutil

logger = logging.getLogger(__name__)


class CacheStrategy(str, Enum):
    """Cache strategies"""

    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    WRITE_THROUGH = "write_through"
    WRITE_BACK = "write_back"
    WRITE_AROUND = "write_around"


class PerformanceMetric(str, Enum):
    """Performance metrics"""

    RESPONSE_TIME = "response_time"
    THROUGHPUT = "throughput"
    MEMORY_USAGE = "memory_usage"
    CPU_USAGE = "cpu_usage"
    CACHE_HIT_RATIO = "cache_hit_ratio"
    DATABASE_QUERY_TIME = "database_query_time"
    NETWORK_LATENCY = "network_latency"
    ERROR_RATE = "error_rate"


@dataclass
class PerformanceData:
    """Performance data point"""

    metric: PerformanceMetric
    value: float
    timestamp: datetime
    tags: dict[str, str]
    metadata: dict[str, Any]


@dataclass
class CacheEntry:
    """Cache entry"""

    key: str
    value: Any
    created_at: datetime
    expires_at: datetime | None
    access_count: int = 0
    last_accessed: datetime = None
    size_bytes: int = 0


class PerformanceOptimizer:
    """Enterprise-grade performance optimization system"""

    def __init__(self):
        self.metrics: deque = deque(maxlen=100000)
        self.cache_stats = {"hits": 0, "misses": 0, "evictions": 0, "size_bytes": 0}

        # Memory cache
        self.memory_cache: dict[str, CacheEntry] = {}
        self.cache_max_size = 1000
        self.cache_max_memory_mb = 500

        # Redis cache
        self.redis_client: aioredis.Redis | None = None
        self.redis_enabled = False

        # Thread pools
        self.cpu_thread_pool = ThreadPoolExecutor(max_workers=multiprocessing.cpu_count())
        self.io_thread_pool = ThreadPoolExecutor(max_workers=50)
        self.process_pool = ProcessPoolExecutor(max_workers=min(4, multiprocessing.cpu_count()))

        # Performance monitoring
        self.start_time = time.time()
        self.request_count = 0
        self.total_response_time = 0.0
        self.error_count = 0

        # Memory monitoring
        self.memory_snapshots: deque = deque(maxlen=1000)
        self.gc_stats = defaultdict(list)

        # Database connection pooling
        self.db_pool_config = {
            "pool_size": 20,
            "max_overflow": 30,
            "pool_timeout": 30,
            "pool_recycle": 3600,
            "pool_pre_ping": True,
        }

        # Initialize performance monitoring
        self._initialize_performance_monitoring()

        logger.info("PerformanceOptimizer initialized")

    def _initialize_performance_monitoring(self):
        """Initialize performance monitoring"""
        # Start memory tracing
        tracemalloc.start()

        # Start background monitoring tasks
        asyncio.create_task(self._monitor_performance())
        asyncio.create_task(self._monitor_memory())
        asyncio.create_task(self._cleanup_cache())

    async def initialize_redis(self, redis_url: str):
        """Initialize Redis cache"""
        try:
            self.redis_client = aioredis.from_url(redis_url)
            await self.redis_client.ping()
            self.redis_enabled = True
            logger.info("Redis cache initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis cache: {e}")
            self.redis_enabled = False

    def cache(
        self,
        ttl: int = 300,
        strategy: CacheStrategy = CacheStrategy.TTL,
        key_prefix: str = "",
        serialize: bool = True,
    ):
        """Decorator for caching function results"""

        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_cache_key(func.__name__, args, kwargs, key_prefix)

                # Try to get from cache
                cached_result = await self.get_from_cache(cache_key)
                if cached_result is not None:
                    self.cache_stats["hits"] += 1
                    return cached_result

                # Cache miss - execute function
                self.cache_stats["misses"] += 1
                start_time = time.time()

                try:
                    if asyncio.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)

                    # Store in cache
                    await self.set_cache(cache_key, result, ttl, strategy, serialize)

                    # Record performance metric
                    execution_time = time.time() - start_time
                    await self._record_metric(
                        PerformanceMetric.RESPONSE_TIME,
                        execution_time,
                        {"function": func.__name__, "cache_hit": False},
                    )

                    return result

                except Exception as e:
                    self.error_count += 1
                    await self._record_metric(
                        PerformanceMetric.ERROR_RATE,
                        1.0,
                        {"function": func.__name__, "error": str(e)},
                    )
                    raise

            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_cache_key(func.__name__, args, kwargs, key_prefix)

                # Try to get from cache
                cached_result = asyncio.run(self.get_from_cache(cache_key))
                if cached_result is not None:
                    self.cache_stats["hits"] += 1
                    return cached_result

                # Cache miss - execute function
                self.cache_stats["misses"] += 1
                start_time = time.time()

                try:
                    result = func(*args, **kwargs)

                    # Store in cache
                    asyncio.run(self.set_cache(cache_key, result, ttl, strategy, serialize))

                    # Record performance metric
                    execution_time = time.time() - start_time
                    asyncio.run(
                        self._record_metric(
                            PerformanceMetric.RESPONSE_TIME,
                            execution_time,
                            {"function": func.__name__, "cache_hit": False},
                        )
                    )

                    return result

                except Exception as e:
                    self.error_count += 1
                    asyncio.run(
                        self._record_metric(
                            PerformanceMetric.ERROR_RATE,
                            1.0,
                            {"function": func.__name__, "error": str(e)},
                        )
                    )
                    raise

            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

        return decorator

    def _generate_cache_key(
        self, func_name: str, args: tuple, kwargs: dict, key_prefix: str
    ) -> str:
        """Generate cache key from function name and arguments"""
        # Create hash of arguments
        args_str = str(args) + str(sorted(kwargs.items()))
        args_hash = hashlib.md5(args_str.encode()).hexdigest()[:8]

        return f"{key_prefix}{func_name}:{args_hash}"

    async def get_from_cache(self, key: str) -> Any | None:
        """Get value from cache"""
        # Try memory cache first
        if key in self.memory_cache:
            entry = self.memory_cache[key]
            if entry.expires_at is None or entry.expires_at > datetime.utcnow():
                entry.access_count += 1
                entry.last_accessed = datetime.utcnow()
                return entry.value
            # Expired
            del self.memory_cache[key]
            self.cache_stats["evictions"] += 1

        # Try Redis cache
        if self.redis_enabled and self.redis_client:
            try:
                cached_data = await self.redis_client.get(key)
                if cached_data:
                    return self._deserialize(cached_data)
            except Exception as e:
                logger.warning(f"Redis cache get error: {e}")

        return None

    async def set_cache(
        self,
        key: str,
        value: Any,
        ttl: int = 300,
        strategy: CacheStrategy = CacheStrategy.TTL,
        serialize: bool = True,
    ):
        """Set value in cache"""
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=ttl) if ttl > 0 else None

        # Create cache entry
        serialized_value = self._serialize(value) if serialize else value
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now,
            expires_at=expires_at,
            access_count=1,
            last_accessed=now,
            size_bytes=len(serialized_value) if isinstance(serialized_value, (bytes, str)) else 0,
        )

        # Store in memory cache
        self.memory_cache[key] = entry
        self.cache_stats["size_bytes"] += entry.size_bytes

        # Store in Redis cache
        if self.redis_enabled and self.redis_client:
            try:
                if ttl > 0:
                    await self.redis_client.setex(key, ttl, serialized_value)
                else:
                    await self.redis_client.set(key, serialized_value)
            except Exception as e:
                logger.warning(f"Redis cache set error: {e}")

        # Check cache size limits
        await self._enforce_cache_limits()

    def _serialize(self, data: Any) -> bytes:
        """Serialize data for caching"""
        try:
            # Try orjson first (fastest)
            return orjson.dumps(data)
        except (TypeError, ValueError):
            try:
                # Try msgpack
                return msgpack.packb(data)
            except (TypeError, ValueError):
                # Fall back to pickle
                return pickle.dumps(data)

    def _deserialize(self, data: bytes) -> Any:
        """Deserialize cached data"""
        try:
            # Try orjson first
            return orjson.loads(data)
        except (TypeError, ValueError):
            try:
                # Try msgpack
                return msgpack.unpackb(data, raw=False)
            except (TypeError, ValueError):
                # Fall back to pickle
                return pickle.loads(data)

    async def _enforce_cache_limits(self):
        """Enforce cache size and memory limits"""
        # Check memory cache size
        if len(self.memory_cache) > self.cache_max_size:
            await self._evict_cache_entries()

        # Check memory usage
        memory_usage_mb = self.cache_stats["size_bytes"] / (1024 * 1024)
        if memory_usage_mb > self.cache_max_memory_mb:
            await self._evict_cache_entries()

    async def _evict_cache_entries(self):
        """Evict cache entries based on strategy"""
        if not self.memory_cache:
            return

        # Sort by last accessed time (LRU)
        sorted_entries = sorted(
            self.memory_cache.items(), key=lambda x: x[1].last_accessed or x[1].created_at
        )

        # Remove oldest 10% of entries
        evict_count = max(1, len(sorted_entries) // 10)
        for key, entry in sorted_entries[:evict_count]:
            del self.memory_cache[key]
            self.cache_stats["evictions"] += 1
            self.cache_stats["size_bytes"] -= entry.size_bytes

    async def clear_cache(self, pattern: str = None):
        """Clear cache entries"""
        if pattern:
            # Clear entries matching pattern
            keys_to_remove = [key for key in self.memory_cache.keys() if pattern in key]
            for key in keys_to_remove:
                del self.memory_cache[key]
                self.cache_stats["evictions"] += 1
        else:
            # Clear all entries
            self.memory_cache.clear()
            self.cache_stats["evictions"] += len(self.memory_cache)

        # Clear Redis cache
        if self.redis_enabled and self.redis_client:
            try:
                if pattern:
                    keys = await self.redis_client.keys(pattern)
                    if keys:
                        await self.redis_client.delete(*keys)
                else:
                    await self.redis_client.flushdb()
            except Exception as e:
                logger.warning(f"Redis cache clear error: {e}")

    async def _record_metric(
        self, metric: PerformanceMetric, value: float, tags: dict[str, str] = None
    ):
        """Record performance metric"""
        data = PerformanceData(
            metric=metric, value=value, timestamp=datetime.utcnow(), tags=tags or {}, metadata={}
        )

        self.metrics.append(data)

        # Update counters
        if metric == PerformanceMetric.RESPONSE_TIME:
            self.request_count += 1
            self.total_response_time += value
        elif metric == PerformanceMetric.ERROR_RATE:
            self.error_count += 1

    async def _monitor_performance(self):
        """Monitor system performance"""
        while True:
            try:
                # CPU usage
                cpu_percent = psutil.cpu_percent(interval=1)
                await self._record_metric(
                    PerformanceMetric.CPU_USAGE, cpu_percent, {"component": "system"}
                )

                # Memory usage
                memory = psutil.virtual_memory()
                await self._record_metric(
                    PerformanceMetric.MEMORY_USAGE, memory.percent, {"component": "system"}
                )

                # Cache hit ratio
                total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
                if total_requests > 0:
                    hit_ratio = self.cache_stats["hits"] / total_requests
                    await self._record_metric(
                        PerformanceMetric.CACHE_HIT_RATIO, hit_ratio, {"component": "cache"}
                    )

                await asyncio.sleep(60)  # Monitor every minute

            except Exception as e:
                logger.error(f"Performance monitoring error: {e}")
                await asyncio.sleep(60)

    async def _monitor_memory(self):
        """Monitor memory usage and garbage collection"""
        while True:
            try:
                # Get memory snapshot
                current, peak = tracemalloc.get_traced_memory()
                memory_snapshot = {
                    "timestamp": datetime.utcnow(),
                    "current_mb": current / (1024 * 1024),
                    "peak_mb": peak / (1024 * 1024),
                    "gc_counts": gc.get_count(),
                }

                self.memory_snapshots.append(memory_snapshot)

                # Force garbage collection if memory usage is high
                if current > 500 * 1024 * 1024:  # 500MB
                    gc.collect()
                    logger.info("Forced garbage collection due to high memory usage")

                await asyncio.sleep(30)  # Monitor every 30 seconds

            except Exception as e:
                logger.error(f"Memory monitoring error: {e}")
                await asyncio.sleep(30)

    async def _cleanup_cache(self):
        """Clean up expired cache entries"""
        while True:
            try:
                now = datetime.utcnow()
                expired_keys = []

                for key, entry in self.memory_cache.items():
                    if entry.expires_at and entry.expires_at < now:
                        expired_keys.append(key)

                for key in expired_keys:
                    del self.memory_cache[key]
                    self.cache_stats["evictions"] += 1

                if expired_keys:
                    logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")

                await asyncio.sleep(300)  # Clean up every 5 minutes

            except Exception as e:
                logger.error(f"Cache cleanup error: {e}")
                await asyncio.sleep(300)

    def get_performance_metrics(self) -> dict[str, Any]:
        """Get performance metrics summary"""
        now = datetime.utcnow()
        last_hour = now - timedelta(hours=1)

        # Filter metrics from last hour
        recent_metrics = [m for m in self.metrics if m.timestamp > last_hour]

        # Calculate averages
        response_times = [
            m.value for m in recent_metrics if m.metric == PerformanceMetric.RESPONSE_TIME
        ]
        cpu_usage = [m.value for m in recent_metrics if m.metric == PerformanceMetric.CPU_USAGE]
        memory_usage = [
            m.value for m in recent_metrics if m.metric == PerformanceMetric.MEMORY_USAGE
        ]
        cache_hit_ratios = [
            m.value for m in recent_metrics if m.metric == PerformanceMetric.CACHE_HIT_RATIO
        ]

        # Calculate throughput
        uptime_hours = (time.time() - self.start_time) / 3600
        throughput = self.request_count / uptime_hours if uptime_hours > 0 else 0

        # Calculate error rate
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0

        return {
            "uptime_hours": uptime_hours,
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "error_rate": error_rate,
            "throughput_rps": throughput,
            "average_response_time": np.mean(response_times) if response_times else 0,
            "p95_response_time": np.percentile(response_times, 95) if response_times else 0,
            "p99_response_time": np.percentile(response_times, 99) if response_times else 0,
            "average_cpu_usage": np.mean(cpu_usage) if cpu_usage else 0,
            "average_memory_usage": np.mean(memory_usage) if memory_usage else 0,
            "cache_hit_ratio": np.mean(cache_hit_ratios) if cache_hit_ratios else 0,
            "cache_stats": self.cache_stats.copy(),
            "memory_snapshots": list(self.memory_snapshots)[-10:],  # Last 10 snapshots
            "gc_stats": dict(gc.get_count()),
        }

    def profile_function(self, func: Callable, *args, **kwargs):
        """Profile function execution"""
        profiler = cProfile.Profile()
        profiler.enable()

        try:
            result = func(*args, **kwargs)
        finally:
            profiler.disable()

        # Get profiling results
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s)
        ps.sort_stats("cumulative")
        ps.print_stats(20)  # Top 20 functions

        return result, s.getvalue()

    async def optimize_database_query(self, query: str, params: dict[str, Any] = None) -> str:
        """Optimize database query"""
        # Add query hints and optimizations
        optimized_query = query

        # Add LIMIT if not present and query looks like SELECT
        if query.strip().upper().startswith("SELECT") and "LIMIT" not in query.upper():
            optimized_query += " LIMIT 1000"

        # Add query timeout
        optimized_query = f"/*+ MAX_EXECUTION_TIME(30000) */ {optimized_query}"

        return optimized_query

    async def batch_process(
        self, items: list[Any], batch_size: int = 100, process_func: Callable = None
    ) -> list[Any]:
        """Process items in batches for better performance"""
        if not process_func:
            return items

        results = []

        for i in range(0, len(items), batch_size):
            batch = items[i : i + batch_size]

            if asyncio.iscoroutinefunction(process_func):
                batch_results = await process_func(batch)
            else:
                batch_results = process_func(batch)

            results.extend(batch_results)

        return results

    async def parallel_process(self, tasks: list[Callable], max_concurrency: int = 10) -> list[Any]:
        """Process tasks in parallel with concurrency limit"""
        semaphore = asyncio.Semaphore(max_concurrency)

        async def process_task(task):
            async with semaphore:
                if asyncio.iscoroutinefunction(task):
                    return await task()
                return task()

        return await asyncio.gather(*[process_task(task) for task in tasks])

    def get_memory_usage(self) -> dict[str, Any]:
        """Get detailed memory usage information"""
        process = psutil.Process()
        memory_info = process.memory_info()

        return {
            "rss_mb": memory_info.rss / (1024 * 1024),
            "vms_mb": memory_info.vms / (1024 * 1024),
            "percent": process.memory_percent(),
            "available_mb": psutil.virtual_memory().available / (1024 * 1024),
            "total_mb": psutil.virtual_memory().total / (1024 * 1024),
            "gc_counts": dict(gc.get_count()),
            "traced_memory_mb": tracemalloc.get_traced_memory()[0] / (1024 * 1024),
        }

    async def cleanup_resources(self):
        """Clean up resources and close connections"""
        # Close thread pools
        self.cpu_thread_pool.shutdown(wait=True)
        self.io_thread_pool.shutdown(wait=True)
        self.process_pool.shutdown(wait=True)

        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()

        # Clear caches
        self.memory_cache.clear()

        # Stop memory tracing
        tracemalloc.stop()

        logger.info("Performance optimizer resources cleaned up")

    def get_cache_stats(self) -> dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        hit_ratio = self.cache_stats["hits"] / total_requests if total_requests > 0 else 0

        return {
            "hits": self.cache_stats["hits"],
            "misses": self.cache_stats["misses"],
            "hit_ratio": hit_ratio,
            "evictions": self.cache_stats["evictions"],
            "size_bytes": self.cache_stats["size_bytes"],
            "size_mb": self.cache_stats["size_bytes"] / (1024 * 1024),
            "entries": len(self.memory_cache),
            "redis_enabled": self.redis_enabled,
        }
