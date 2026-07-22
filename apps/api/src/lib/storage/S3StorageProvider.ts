import type { StorageProvider, StoredFile } from './StorageProvider.js';

/**
 * S3-ready placeholder. Not wired up in this pass — enable by installing
 * @aws-sdk/client-s3 and @aws-sdk/lib-storage, implementing the methods
 * below the same way LocalStorageProvider does, and switching
 * STORAGE_DRIVER=s3 (see getStorageProvider() in index.ts).
 */
export class S3StorageProvider implements StorageProvider {
  async save(_params: { buffer: Buffer; originalName: string; mimeType: string; folder: string }): Promise<StoredFile> {
    throw new Error('S3StorageProvider is not implemented yet. Set STORAGE_DRIVER=local for now.');
  }

  async delete(_key: string): Promise<void> {
    throw new Error('S3StorageProvider is not implemented yet. Set STORAGE_DRIVER=local for now.');
  }

  getUrl(_key: string): string {
    throw new Error('S3StorageProvider is not implemented yet. Set STORAGE_DRIVER=local for now.');
  }
}
