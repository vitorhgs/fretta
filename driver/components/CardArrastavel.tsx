import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, shadows } from "../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Altura do card em cada estado
const ALTURA_FECHADO = 260;
const ALTURA_ABERTO = Math.min(SCREEN_HEIGHT * 0.65, 560);

// Altura aproximada de cada item da lista (pra scroll automático)
const ALTURA_ITEM_PARADA = 58;

interface ParadaItem {
  nome: string;
  endereco?: string;
  concluida: boolean;
  ehAtual: boolean;
  ehUltima: boolean;
  distancia?: number;
}

interface CardArrastavelProps {
  emViagem: boolean;
  children: React.ReactNode;
  paradas: ParadaItem[];
  paradaAtualIdx: number;
  onEstadoChange?: (aberto: boolean) => void; // 🆕 avisa quando muda estado
}

/* =========================
   ÍCONES
========================= */
function IconeSetaCima() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.textMuted}>
      <Path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </Svg>
  );
}

function IconeSetaBaixo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.textMuted}>
      <Path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </Svg>
  );
}

function IconeCheck() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </Svg>
  );
}

function IconeBandeira() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </Svg>
  );
}

export default function CardArrastavel({
  emViagem,
  children,
  paradas,
  paradaAtualIdx,
  onEstadoChange,
}: CardArrastavelProps) {
  const [aberto, setAberto] = useState(false);
  const translateY = useRef(new Animated.Value(ALTURA_ABERTO - ALTURA_FECHADO))
    .current;
  const scrollRef = useRef<ScrollView>(null);

  // Toggle aberto/fechado
  const toggleCard = () => {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    onEstadoChange?.(novoEstado);

    Animated.spring(translateY, {
      toValue: novoEstado ? 0 : ALTURA_ABERTO - ALTURA_FECHADO,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

    // Scroll automático para parada atual quando abrir
    if (novoEstado && emViagem && paradas.length > 0) {
      setTimeout(() => {
        const offset = Math.max(0, (paradaAtualIdx - 1) * ALTURA_ITEM_PARADA);
        scrollRef.current?.scrollTo({ y: offset, animated: true });
      }, 350);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: ALTURA_ABERTO,
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      {/* Botão toggle (seta) */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={toggleCard}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
      >
        <View style={styles.toggleHandle}>
          {aberto ? <IconeSetaBaixo /> : <IconeSetaCima />}
        </View>
      </TouchableOpacity>

      {/* Conteúdo padrão (colado embaixo quando fechado) */}
      <View style={styles.conteudoFixo}>{children}</View>

      {/* Lista de paradas (aparece ao abrir) */}
      {emViagem && paradas.length > 0 && (
        <View style={styles.listaWrapper}>
          <Text style={styles.listaTitulo}>TODAS AS PARADAS</Text>
          <ScrollView
            ref={scrollRef}
            style={styles.lista}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {paradas.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.itemParada,
                  p.ehAtual && styles.itemParadaAtual,
                ]}
              >
                {/* Ícone/número */}
                <View
                  style={[
                    styles.iconeParada,
                    p.concluida && styles.iconeConcluida,
                    p.ehAtual && styles.iconeAtual,
                    p.ehUltima && !p.concluida && styles.iconeUltima,
                  ]}
                >
                  {p.concluida ? (
                    <IconeCheck />
                  ) : p.ehUltima ? (
                    <IconeBandeira />
                  ) : (
                    <Text
                      style={[
                        styles.iconeNumero,
                        p.ehAtual && styles.iconeNumeroAtual,
                      ]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemNome,
                      p.concluida && styles.itemNomeConcluida,
                      p.ehAtual && styles.itemNomeAtual,
                    ]}
                    numberOfLines={1}
                  >
                    {p.nome}
                  </Text>
                  {p.endereco && (
                    <Text style={styles.itemEndereco} numberOfLines={1}>
                      {p.endereco}
                    </Text>
                  )}
                </View>

                {/* Status */}
                <View style={styles.itemStatus}>
                  {p.concluida ? (
                    <Text style={styles.statusConcluida}>Concluída</Text>
                  ) : p.ehAtual ? (
                    <Text style={styles.statusAtual}>
                      {p.distancia && p.distancia > 0
                        ? formatarDist(p.distancia)
                        : "Próxima"}
                    </Text>
                  ) : (
                    <Text style={styles.statusPendente}>Pendente</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
}

function formatarDist(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...shadows.lg,
  },

  // 🆕 Botão de seta no topo
  toggleBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 2,
  },
  toggleHandle: {
    width: 56,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Conteúdo fixo (colado embaixo quando fechado)
  conteudoFixo: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },

  // Lista de paradas
  listaWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 4,
  },
  listaTitulo: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 10,
  },
  lista: {
    flex: 1,
  },
  itemParada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemParadaAtual: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
  },
  iconeParada: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconeConcluida: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  iconeAtual: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconeUltima: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  iconeNumero: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
  },
  iconeNumeroAtual: {
    color: colors.white,
  },
  itemNome: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  itemNomeConcluida: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  itemNomeAtual: {
    color: colors.primary,
    fontWeight: "900",
  },
  itemEndereco: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemStatus: {
    minWidth: 70,
    alignItems: "flex-end",
  },
  statusConcluida: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
    textTransform: "uppercase",
  },
  statusAtual: {
    fontSize: 12,
    fontWeight: "900",
    color: colors.primary,
  },
  statusPendente: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
});