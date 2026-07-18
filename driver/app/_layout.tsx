import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { colors } from "../theme/colors";

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="gravacao" options={{ animation: "slide_from_bottom" }}/>
        <Stack.Screen
          name="navegacao"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </AuthProvider>
  );
}