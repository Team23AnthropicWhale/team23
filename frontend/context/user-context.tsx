import { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

import { base_url } from '@/constants/configs';

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
  token: string | null;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

function getDeviceName(): string {
  const name = Device.deviceName ?? Device.modelName;
  if (name) return name;
  return `${Platform.OS}-app`;
}

async function authenticate(email: string, password: string): Promise<{ user: AppUser; token: string }> {
  const response = await fetch(`${base_url}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password, device_name: getDeviceName() }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message ?? 'Authentication failed');
  }

  const data = await response.json();
  const initials = (data.user.name as string)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    token: data.token,
    user: {
      email: data.user.email,
      name: data.user.name,
      role: data.user.user_type === 'supervisor' ? 'supervisor' : 'user',
      sector: 'Sector B',
      avatarInitials: initials,
    },
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<AppUser> => {
    //const { user: appUser, token: authToken } = await authenticate(email, password);

    const appUser: AppUser = {
      email: "test@team23",
      name: "brian Jacobs",
      role: "user",
      sector: "Sector A",
      avatarInitials: "BJ",
    }

    setUser(appUser);
    //setToken(authToken);
    return appUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <UserContext.Provider value={{ user, token, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
