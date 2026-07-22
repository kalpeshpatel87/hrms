import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import type { StorageProvider, StoredFile } from './StorageProvider.js';

const uploadRoot = path.resolve(env.UPLOAD_DIR);

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class LocalStorageProvider implements StorageProvider {
  async save(params: { buffer: Buffer; originalName: string; mimeType: string; folder: string }): Promise<StoredFile> {
    const dir = path.join(uploadRoot, params.folder);
    await mkdir(dir, { recursive: true });

    const fileName = `${randomUUID()}-${sanitizeFileName(params.originalName)}`;
    const fullPath = path.join(dir, fileName);
    await writeFile(fullPath, params.buffer);

    const key = path.posix.join(params.folder, fileName);
    return { key, url: this.getUrl(key), size: params.buffer.length, mimeType: params.mimeType };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(uploadRoot, key);
    if (!fullPath.startsWith(uploadRoot)) {
      throw new Error('Refusing to delete a path outside the upload root');
    }
    await unlink(fullPath).catch(() => undefined);
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
