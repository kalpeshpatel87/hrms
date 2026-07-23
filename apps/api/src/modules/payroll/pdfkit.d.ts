// `pdfkit` ships no type declarations and `@types/pdfkit` isn't installed in
// this workspace. This is a minimal ambient declaration covering only the
// surface this module actually uses — just enough for strict mode to compile.
declare module 'pdfkit' {
  import type { Readable } from 'node:stream';

  interface PDFTextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    underline?: boolean;
    continued?: boolean;
    width?: number;
  }

  class PDFDocument extends Readable {
    constructor(options?: Record<string, unknown>);
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, options?: PDFTextOptions): this;
    text(text: string, x: number, y: number, options?: PDFTextOptions): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    end(): void;
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export default PDFDocument;
}
