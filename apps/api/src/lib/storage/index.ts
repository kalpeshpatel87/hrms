import { env } from '../../config/env.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { S3StorageProvider } from './S3StorageProvider.js';
import type { StorageProvider } from './StorageProvider.js';

let instance: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = env.STORAGE_DRIVER === 's3' ? new S3StorageProvider() : new LocalStorageProvider();
  }
  return instance;
}

export type { StorageProvider, StoredFile } from './StorageProvider.js';
