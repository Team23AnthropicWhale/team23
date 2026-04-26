import { createContext, useContext, useEffect, useState } from 'react';

import {
  getAllCases,
  createCase as svcCreateCase,
  updateCaseName as svcUpdateCaseName,
  deleteCase as svcDeleteCase,
} from '@/services/caseService';
import type { StoredCase } from '@/types/case';

interface CaseContextType {
  cases: StoredCase[];
  loading: boolean;
  createCase: (name: string, initialCsv?: string) => Promise<StoredCase>;
  updateCaseName: (id: string, name: string) => Promise<StoredCase>;
  deleteCase: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CaseContext = createContext<CaseContextType | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await getAllCases();
    setCases(data);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function createCase(name: string, initialCsv?: string): Promise<StoredCase> {
    const c = await svcCreateCase(name, initialCsv);
    await refresh();
    return c;
  }

  async function updateCaseName(id: string, name: string): Promise<StoredCase> {
    const c = await svcUpdateCaseName(id, name);
    await refresh();
    return c;
  }

  async function deleteCase(id: string): Promise<void> {
    await svcDeleteCase(id);
    await refresh();
  }

  return (
    <CaseContext.Provider value={{ cases, loading, createCase, updateCaseName, deleteCase, refresh }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCases(): CaseContextType {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCases must be used within CaseProvider');
  return ctx;
}
