import * as FileSystem from 'expo-file-system/legacy';

function getCasesDir(): string {
  if (!FileSystem.documentDirectory) return '';
  return `${FileSystem.documentDirectory}cases/`;
}

export { getCasesDir };

export async function initStorage(): Promise<void> {
  const dir = getCasesDir();
  if (!dir) return;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {
    // Directory may already exist — not an error worth surfacing
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch (e) {
    console.warn('deleteFile failed:', e);
  }
}
