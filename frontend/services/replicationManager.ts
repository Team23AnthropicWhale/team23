import { createCase, getAllCases, getCaseById } from './caseService';
import { getCasesDir } from './fileService';
import { parseCsv, readCsv, writeCsv } from './csvService';
import type { CaseDelta, ManifestEntry } from '../../secure-sync/bleProtocol';
import { configureReplication } from '../../secure-sync/syncOrchestrator';

let _selectedIds: string[] = [];

export function setSelectedCases(ids: string[]): void {
  _selectedIds = ids;
}

async function getLocalManifest(): Promise<ManifestEntry[]> {
  const cases = await getAllCases();
  const filtered = _selectedIds.length ? cases.filter(c => _selectedIds.includes(c.id)) : cases;
  return filtered.map(c => ({
    caseId: c.id,
    version: 1,
    checksum: c.updatedAt,
    createdBy: 'local',
    lastModifiedBy: 'local',
  }));
}

function diffManifests(
  local: ManifestEntry[],
  remote: ManifestEntry[],
): { toSend: string[]; toRequest: string[]; conflicts: string[] } {
  const localIds = new Set(local.map(e => e.caseId));
  const remoteIds = new Set(remote.map(e => e.caseId));
  const toSend = local.filter(e => !remoteIds.has(e.caseId)).map(e => e.caseId);
  const toRequest = remote.filter(e => !localIds.has(e.caseId)).map(e => e.caseId);
  return { toSend, toRequest, conflicts: [] };
}

async function getCaseForSync(id: string): Promise<CaseDelta> {
  const csv = await readCsv(id);
  return { caseId: id, payload: csv as unknown as object };
}

async function applyIncomingCase(delta: CaseDelta): Promise<void> {
  const csv = delta.payload as unknown as string;
  const rows = parseCsv(csv) as Record<string, string>[];
  const caseId = delta.caseId;
  const caseName = rows[0]?.case_id ?? caseId;
  await writeCsv(caseId, csv);
  const filePath = `${getCasesDir()}${caseId}.csv`;
  await createCase(caseId, caseName, filePath);
}

async function flagConflict(caseId: string): Promise<void> {
  console.warn('[sync] conflict on case:', caseId);
}

export function initReplication(): void {
  configureReplication({
    getLocalManifest,
    diffManifests,
    getCaseForSync,
    applyIncomingCase,
    flagConflict,
  });
}
