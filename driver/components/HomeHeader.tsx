import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNotificacoes } from '../hooks/useNotificacoes';

type HomeHeaderProps = {
  nome?: string | null;
  busca: string;
  onChangeBusca: (texto: string) => void;
};

function gerarIniciais(nome?: string | null) {
  if (!nome) return 'DR';

  const partes = nome.trim().split(' ').filter(Boolean);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function HomeHeader({ nome, busca, onChangeBusca }: HomeHeaderProps) {
  const { naoLidas } = useNotificacoes();

  return (
    <View style={styles.container}>
      {/* AVATAR */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.avatarWrapper}
        onPress={() => router.push('/(tabs)/perfil')}
      >
        <Text style={styles.avatarText}>{gerarIniciais(nome)}</Text>
        <View style={styles.onlineDot} />
      </TouchableOpacity>

      {/* BUSCA */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={22} color="#94A3B8" />

        <TextInput
          value={busca}
          onChangeText={onChangeBusca}
          placeholder="Buscar rota..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      {/* SINO */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.notificationButton}
        onPress={() => router.push('/notificacoes')}
      >
        <Ionicons name="notifications-outline" size={28} color="#FFFFFF" />

        {naoLidas > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {naoLidas > 99 ? '99+' : naoLidas}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  onlineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    position: 'absolute',
    right: 1,
    bottom: 1,
    borderWidth: 2,
    borderColor: '#061226',
  },

  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 0,
  },

  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#061226',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});