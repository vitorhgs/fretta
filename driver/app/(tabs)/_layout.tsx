import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../../theme/colors";

/* ==========================================
   ÍCONES SVG PROFISSIONAIS
========================================== */

function IconeMapa({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.16V6.46zm14 11.08l-3 1.01V6.86l3-1.16v11.84z" />
    </Svg>
  );
}

function IconeChave({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </Svg>
  );
}

function IconeUsuario({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M12 14c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
    </Svg>
  );
}

/* ==========================================
   WRAPPER PRA CADA ÍCONE
========================================== */

function TabIcon({
  focused,
  IconComponent,
}: {
  focused: boolean;
  IconComponent: React.ComponentType<{ color: string; size?: number }>;
}) {
  return (
    <View style={styles.iconContainer}>
      <IconComponent
        color={focused ? colors.primary : colors.textMuted}
        size={26}
      />
      {focused && <View style={styles.indicadorAtivo} />}
    </View>
  );
}

/* ==========================================
   LAYOUT DAS TABS
========================================== */

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 75,
          paddingBottom: 12,
          paddingTop: 10,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Rotas",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={IconeMapa} />
          ),
        }}
      />
      <Tabs.Screen
        name="pin"
        options={{
          title: "PIN",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={IconeChave} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={IconeUsuario} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 32,
    position: "relative",
  },
  indicadorAtivo: {
    position: "absolute",
    top: -12,
    width: 24,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});