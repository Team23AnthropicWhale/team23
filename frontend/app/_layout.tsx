import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { UserProvider, useUser } from '@/context/user-context';

export const unstable_settings = {
  anchor: '(auth)',
};

function AuthGate() {
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <UserProvider>
        <AuthGate />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: '' }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </UserProvider>
    </ThemeProvider>
  );
}
