import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function currentActorId(): string | undefined {
  return storage.getStore()?.userId;
}
