import { createContext, useContext, useState } from 'react';

export type UserRole = 'user' | 'supervisor';

export interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  sector: string;
  avatarInitials: string;
}

interface UserContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

async function mockAuthenticate(email: string, _password: string): Promise<AppUser> {
  await new Promise((r) => setTimeout(r, 700));
  const isSupervisor = email.toLowerCase().includes('supervisor');
  return {
    email,
    name: isSupervisor ? 'Supervisor' : 'Field Worker',
    role: isSupervisor ? 'supervisor' : 'user',
    sector: 'Sector B',
    avatarInitials: isSupervisor ? 'SV' : 'FW',
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  const login = async (email: string, password: string): Promise<AppUser> => {
    const appUser = await mockAuthenticate(email, password);
    setUser(appUser);
    return appUser;
  };

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
