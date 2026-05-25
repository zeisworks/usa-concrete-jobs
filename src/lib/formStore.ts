import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export function appendRecord(file: string, record: object): void {
  const path = resolve(process.cwd(), `data/${file}.json`);
  let records: object[] = [];
  try { records = JSON.parse(readFileSync(path, 'utf-8')); } catch {}
  records.unshift({ ...record, submittedAt: new Date().toISOString() });
  writeFileSync(path, JSON.stringify(records, null, 2));
}
