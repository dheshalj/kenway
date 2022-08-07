import { readFileSync, writeFileSync } from 'fs';

export class KenwayIO {
  static read(filename: string): string {
    return readFileSync(filename, 'utf8');
  }

  static write(filename: string, data: string): void {
    writeFileSync(filename, data);
  }
}
