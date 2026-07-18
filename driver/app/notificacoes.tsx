import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Notificacao, useNotificacoes } from '../hooks/useNotificacoes';

function getIcone(tipo: string) {
  switch (tipo) {
    case 'rota':
      return {
        name: 'map-outline' as const,
        color: '#2563EB',
        bg: '#DBEAFE',
      };

    case 'alerta':
      return {
        name: 'warning-outline' as const,
        color: '#F97316',
        bg: '#FFEDD5',
      };

    case 'emergencia':
      return {
        name: 'alert-circle-outline' as const,
        color: '#DC2626',
        bg: '#FEE2E2',
      };

    default:
      return {
        name: 'information-circle-outline' as const,
        color: '#64748B',
        bg: '#E2E8F0',
      };
  }
}

function formatarData(dataISO: string) {
  const data = new Date(dataISO);

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CardNotificacao({
  item,
  onPress,
}: {
  item: Notificacao;
  onPress: () => void;
}) {
  const icon = getIcone(item.tipo);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, !item.lida && styles.cardNaoLido]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={23} color={icon.color} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.titulo} numberOfLines={1}>
            {item.titulo}
          </Text>

          {!item.lida && <View style={styles.dotNaoLida} />}
        </View>

        <Text style={styles.mensagem} numberOfLines={2}>
          {item.mensagem}
        </Text>

        <Text style={styles.data}>{formatarData(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificacoesScreen() {
  const {
    notificacoes,
    naoLidas,
    loading,
    refreshing,
    recarregar,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Notificações</Text>
          <Text style={styles.headerSubtitle}>
            {naoLidas === 0
              ? 'Nenhuma não lida'
              : `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}`}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.readAllButton}
          onPress={marcarTodasComoLidas}
          disabled={naoLidas === 0}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={24}
            color={naoLidas === 0 ? '#CBD5E1' : '#2563EB'}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Carregando notificações...</Text>
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            notificacoes.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={recarregar} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={34}
                  color="#94A3B8"
                />
              </View>

              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptyText}>
                Avisos da central, novas rotas e alertas aparecerão aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CardNotificacao
              item={item}
              onPress={() => {
                if (!item.lida) {
                  marcarComoLida(item.id);
                }
              }}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },

  readAllButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },

  listContent: {
    padding: 18,
    gap: 12,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardNaoLido: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContent: {
    flex: 1,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  titulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  dotNaoLida: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  mensagem: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },

  data: {
    marginTop: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  emptyBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
});