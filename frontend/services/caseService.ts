import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCasesDir, deleteFile } from './fileService';
import { writeCsv } from './csvService';
import type { StoredCase } from '@/types/case';

const STORAGE_KEY = 'cases';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function loadAll(): Promise<StoredCase[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredCase[];
  } catch {
    return [];
  }
}

async function saveAll(cases: StoredCase[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export async function getAllCases(): Promise<StoredCase[]> {
  const cases = await loadAll();
  return cases.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCaseById(id: string): Promise<StoredCase | null> {
  const cases = await loadAll();
  return cases.find((c) => c.id === id) ?? null;
}

export async function createCase(name: string, initialCsv?: string): Promise<StoredCase> {
  const id = generateId();
  const filePath = `${getCasesDir()}${id}.csv`;
  await writeCsv(id, initialCsv ?? '');
  const now = new Date().toISOString();
  const newCase: StoredCase = { id, name, filePath, createdAt: now, updatedAt: now };
  const cases = await loadAll();
  cases.push(newCase);
  await saveAll(cases);
  return newCase;
}

export async function updateCaseName(id: string, name: string): Promise<StoredCase> {
  const cases = await loadAll();
  const idx = cases.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Case not found: ${id}`);
  cases[idx] = { ...cases[idx], name, updatedAt: new Date().toISOString() };
  await saveAll(cases);
  return cases[idx];
}

export async function deleteCase(id: string): Promise<void> {
  const cases = await loadAll();
  const target = cases.find((c) => c.id === id);
  if (target) await deleteFile(target.filePath);
  await saveAll(cases.filter((c) => c.id !== id));
}
