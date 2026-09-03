import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

type ListParams = Record<string, string | number | boolean | undefined>;

type RedisScanClient = {
  scanIterator(options: { MATCH: string; TYPE: string }): AsyncIterable<string>;
  del(keys: string[]): Promise<number>;
};

/**
 * Generic Redis-backed cache helper, usable by any module. Besides raw
 * read/write/delete, it offers a list-cache pattern for endpoints that
 * cache paginated/filtered list results: each filter/pagination
 * combination is cached under its own key and served until it expires
 * via the Redis TTL.
 */
@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  private buildListKey(
    resource: string,
    scopeId: string,
    params: ListParams,
  ): string {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${value ?? ''}`)
      .join('|');

    return `${resource}:list:${scopeId}:${query}`;
  }

  async getList<T>(
    resource: string,
    scopeId: string,
    params: ListParams,
  ): Promise<T | undefined> {
    return this.get<T>(this.buildListKey(resource, scopeId, params));
  }

  async setList<T>(
    resource: string,
    scopeId: string,
    params: ListParams,
    value: T,
    ttl?: number,
  ): Promise<void> {
    await this.set(this.buildListKey(resource, scopeId, params), value, ttl);
  }

  /**
   * Invalida todas las variantes cacheadas de un listado (una por cada
   * combinación de filtros/paginación) para un recurso y scope dados.
   *
   * Usa SCAN + DEL directamente sobre el cliente Redis en vez del
   * `iterator()` de Keyv: ese iterator hace MGET sobre las keys que
   * matchean y deserializa cada valor, lo que revienta con
   * "Cannot read properties of undefined (reading 'expires')" si una key
   * expira entre el SCAN y el MGET. Acá solo nos interesan los nombres de
   * las keys, no sus valores, así que evitamos esa deserialización.
   */
  async deleteListByScope(resource: string, scopeId: string): Promise<void> {
    const prefix = `${resource}:list:${scopeId}:`;

    for (const store of this.cacheManager.stores) {
      const client = (store.store as { client?: RedisScanClient })?.client;
      if (!client || typeof client.scanIterator !== 'function') continue;

      const keys: string[] = [];
      for await (const key of client.scanIterator({
        MATCH: `${prefix}*`,
        TYPE: 'string',
      })) {
        keys.push(key);
      }

      if (keys.length) {
        await client.del(keys);
      }
    }
  }
}
