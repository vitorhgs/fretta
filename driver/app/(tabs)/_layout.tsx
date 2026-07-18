import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../../theme/colors";

/* ==========================================
   ÍCONES SVG - dois estilos (outline/filled)
========================================== */

function IconeMapa({ color, focused }: { color: string; focused: boolean }) {
  if (focused) {
    return (
      <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
        <Path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5z" />
      </Svg>
    );
  }
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M9 3L3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5l-.16.03L15 5.1 9 3zm0 0v15.9M15 5.1V21" />
    </Svg>
  );
}

function IconeChave({ color, focused }: { color: string; focused: boolean }) {
  if (focused) {
    return (
      <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
        <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      </Svg>
    );
  }
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M7 10a2 2 0 100 4 2 2 0 000-4zm5.65 0H23v4h-2v-4h-4v4h-4.35A5.998 5.998 0 017 18a6 6 0 010-12c2.61 0 4.83 1.67 5.65 4z" />
    </Svg>
  );
}

function IconeUsuario({ color, focused }: { color: string; focused: boolean }) {
  if (focused) {
    return (
      <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
        <Circle cx="12" cy="8" r="4" />
        <Path d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
      </Svg>
    );
  }
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
    </Svg>
  );
}

/* ==========================================
   BOTÃO DE ABA (apenas ícone, sem label)
========================================== */

function TabButton({
  focused,
  IconComponent,
}: {
  focused: boolean;
  IconComponent: React.ComponentType<{ color: string; focused: boolean }>;
}) {
  return (
    <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
      <IconComponent
        color={focused ? colors.primary : colors.textMuted}
        focused={focused}
      />
    </View>
  );
}

/* ==========================================
   LAYOUT DAS TABS - FLUTUANTE
========================================== */

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "ios" ? insets.bottom + 8 : 16;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: bottomOffset,
          left: 20,
          right: 20,
          height: 68,
          borderRadius: 34,
          backgroundColor: colors.white,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)",
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 10,
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 20,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} IconComponent={IconeMapa} />
          ),
        }}
      />
      <Tabs.Screen
        name="pin"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} IconComponent={IconeChave} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton focused={focused} IconComponent={IconeUsuario} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  tabButtonActive: {
    backgroundColor: colors.primary + "15",
  },
});