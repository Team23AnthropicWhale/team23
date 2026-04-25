import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { CaseProvider } from '@/context/case-context';
import { UserProvider, useUser } from '@/context/user-context';
import { initStorage } from '@/services/fileService';

export const unstable_settings = {
  anchor: '(auth)',
};

function AuthGate() {
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const navigationAttempted = useRef(false);

  useEffect(() => {
    // Prevent multiple navigation attempts
    if (navigationAttempted.current) return;
    // Ensure segments are available before accessing
    if (!segments?.length) return;

    navigationAttempted.current = true;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)');
    } else if (user && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [user, segments, router]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initStorage();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <UserProvider>
        <CaseProvider>
          <AuthGate />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="dark" />
        </CaseProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
