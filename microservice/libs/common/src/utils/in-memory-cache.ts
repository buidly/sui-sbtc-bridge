import LRU from 'lru-cache';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryCacheService {
  private static localCache: LRU<any, any>;

  constructor() {
    if (!InMemoryCacheService.localCache) {
      InMemoryCacheService.localCache = new LRU({
        max: 10_000,
        allowStale: false,
        updateAgeOnGet: false,
        updateAgeOnHas: false,
      });
    }
  }

  get<T>(key: string): T | undefined {
    const data = InMemoryCacheService.localCache.get(key);

    return data ? (data.serialized === true ? JSON.parse(data.value) : data.value) : undefined;
  }

  set<T>(key: string, value: T, ttl: number, cacheNullable: boolean = true): void {
    if (value === undefined) {
      return;
    }

    if (!cacheNullable && value == null) {
      return;
    }

    const writeValue: any =
      typeof value === 'object'
        ? {
          serialized: true,
          value: JSON.stringify(value),
        }
        : {
          serialized: false,
          value,
        };

    const ttlToMilliseconds = ttl * 1000; // Convert to milliseconds

    if (ttlToMilliseconds > 0) {
      // Save only if ttl is greater than 0
      InMemoryCacheService.localCache.set(key, writeValue, {
        ttl: ttlToMilliseconds,
      });
    }
  }

  async delete(key: string): Promise<void> {
    await InMemoryCacheService.localCache.delete(key);
  }
}
