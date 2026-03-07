import { redis } from '../../../shared/providers/redis.js';

export async function logoutUseCase(userId: string, accessToken: string) {
  await redis.del(`refresh:${userId}`);
  await redis.set(`bl:${accessToken}`, '1', 'EX', 15 * 60);
}
