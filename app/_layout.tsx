import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useUserStore } from "@/store/useStore";
import { initDb } from "@/db";

export const unstable_settings = {
  anchor: "(tabs)",
};

function OnboardingGate() {
  const router = useRouter();
  const segments = useSegments();
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  // Wait until the navigator has fully mounted before redirecting
  const [isNavigatorReady, setIsNavigatorReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsNavigatorReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNavigatorReady) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!hasOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasOnboarded && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [hasOnboarded, segments, isNavigatorReady]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      {/* Gate lives *after* Stack so the navigator is mounted first */}
      <OnboardingGate />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
