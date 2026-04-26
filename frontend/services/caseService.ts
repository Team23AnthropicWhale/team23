import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredCase } from '@/types/case';
import type { AvatarVariant, Case, PillVariant } from '@/types/dashboard';
import { parseCsv, readCsv } from './csvService';

const STORAGE_KEY = 'cases';


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

export async function createCase(
  id: string,
  name: string,
  filePath: string | null,
): Promise<StoredCase> {
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
  await saveAll(cases.filter((c) => c.id !== id));
}

export async function toCaseView(stored: StoredCase): Promise<Case> {
  const csv = await readCsv(stored.id);
  const rows = parseCsv(csv) as Record<string, string>[];
  const row = rows[0] ?? {};

  const firstName = (row.first_name ?? stored.name ?? '').trim();
  const sex = row.sex ?? '';
  const age = row.age ?? '';
  const riskLevel = row.risk_level ?? '';
  const risks = row.risks ?? '';

  const sexInitial = sex.toLowerCase().startsWith('f') ? 'F' : sex.toLowerCase().startsWith('m') ? 'M' : '?';
  const initials = `${(firstName[0] ?? '?').toUpperCase()}·${sexInitial}${age}`;

  const status: PillVariant =
    riskLevel === 'high' ? 'urgent' :
    riskLevel === 'medium' ? 'active' :
    riskLevel === 'low' ? 'pending' : 'active';

  const variant: AvatarVariant =
    status === 'urgent' ? 'red' :
    status === 'active' ? 'blue' :
    status === 'pending' ? 'amber' : 'teal';

  const type = risks.split(';')[0]?.trim() || stored.name;
  const encryptionDay = Math.floor(
    (Date.now() - new Date(stored.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    id: stored.id,
    name: stored.name,
    filePath: stored.filePath,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
    avatar: { initials, variant },
    type,
    encryptionDay,
    status,
  };
}
