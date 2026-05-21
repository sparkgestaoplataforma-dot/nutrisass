import Redis from 'ioredis';
import { env } from '../../config/env.js';

let redis: Redis | null = null;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  redis.on('error', (err) => {
    console.error('[Redis] Erro de conexão:', err.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Conectado com sucesso');
  });
} catch (err) {
  console.error('[Redis] Falha ao inicializar:', err);
  redis = null;
}

export async function redisGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.error(`[Redis] Erro ao GET "${key}":`, err);
    return null;
  }
}

export async function redisLRange(key: string, inicio: number, fim: number): Promise<string[]> {
  if (!redis) return [];
  try {
    return await redis.lrange(key, inicio, fim);
  } catch (err) {
    console.error(`[Redis] Erro ao LRANGE "${key}":`, err);
    return [];
  }
}

export async function redisLPush(key: string, value: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.lpush(key, value);
  } catch (err) {
    console.error(`[Redis] Erro ao LPUSH "${key}":`, err);
  }
}

export async function redisSet(key: string, value: string, mode?: string, duration?: number): Promise<void> {
  if (!redis) return;
  try {
    if (mode === 'EX' && duration) {
      await redis.set(key, value, 'EX', duration);
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    console.error(`[Redis] Erro ao SET "${key}":`, err);
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis] Erro ao DEL "${key}":`, err);
  }
}

export { redis };
