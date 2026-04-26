import * as FileSystem from 'expo-file-system/legacy';
import Papa from 'papaparse';

import { getCasesDir } from './fileService';

function getFilePath(caseId: string): string {
  return `${getCasesDir()}${caseId}.csv`;
}

export async function readCsv(caseId: string): Promise<string> {
  const path = getFilePath(caseId);
  try {
    return await FileSystem.readAsStringAsync(path);
  } catch {
    return '';
  }
}

export async function writeCsv(caseId: string, content: string): Promise<void> {
  const finalPath = getFilePath(caseId);
  const tmpPath = `${finalPath}.tmp`;
  await FileSystem.writeAsStringAsync(tmpPath, content);
  await FileSystem.moveAsync({ from: tmpPath, to: finalPath });
}

export async function appendRow(caseId: string, row: string[]): Promise<void> {
  const existing = await readCsv(caseId);
  const rows = parseCsv(existing) as Record<string, string>[];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : row.map((_, i) => `col${i + 1}`);
  const newRow = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']));
  rows.push(newRow);
  await writeCsv(caseId, serializeCsv(rows));
}

export function parseCsv(csvString: string): object[] {
  if (!csvString.trim()) return [];
  return Papa.parse(csvString, { header: true, skipEmptyLines: true }).data as object[];
}

export function serializeCsv(rows: object[]): string {
  if (rows.length === 0) return '';
  return Papa.unparse(rows);
}
