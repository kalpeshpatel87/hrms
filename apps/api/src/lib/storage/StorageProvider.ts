export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageProvider {
  save(params: { buffer: Buffer; originalName: string; mimeType: string; folder: string }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
