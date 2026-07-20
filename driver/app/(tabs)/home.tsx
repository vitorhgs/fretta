import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import BadgeOffline from "../../components/BadgeOffline";
import StatusSincronizacao from "../../components/StatusSincronizacao";
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import { colors, shadows } from "../../theme/colors";
import { HomeHeader } from "../../components/HomeHeader";
import { usePushNotifications } from "../../hooks/usePushNotifications";

interface Rota {
  id: string;
  nome: string;
  cor: string;
  distancia_km: number;
  duracao_min: number;
  pontos_originais: any[];
  categoria?: string;
  turno?: string;
  turnos_atendidos?: string[];
  status_rota?: string;
  horario_saida?: string;
  linha_id?: string | null; 
  linhas?: {
    // 🆕 dados da linha vinculada
    id: string;
    nome: string;
    cor: string;
    cliente_nome_fantasia?: string;
  } | null;
}

/* =========================
   ÍCONES SVG
========================= */
function IconeBusca({ size = 16, color = "rgba(255,255,255,0.6)" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </Svg>
  );
}

function IconeFechar({ size = 14, color = "rgba(255,255,255,0.7)" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </Svg>
  );
}

function IconeSeta({ size = 20, color = colors.textSecondary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </Svg>
  );
}

function IconeCaixaVazia({ size = 64, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.02V7z" />
    </Svg>
  );
}

function IconeRelogio({ size = 12, color = colors.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
    </Svg>
  );
}

function IconeLocalizacao({ size = 12, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </Svg>
  );
}

function IconeRaio({ size = 12, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M7 2v11h3v9l7-12h-4l4-8z" />
    </Svg>
  );
}

function IconeCronometro({ size = 12, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </Svg>
  );
}

function IconePredio({ size = 12, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
    </Svg>
  );
}
/* =========================
   HELPERS
========================= */
function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataHoje(): string {
  const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const d = new Date();
  return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
}

function iniciais(nome: string): string {
  if (!nome) return "?";
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* =========================
   COMPONENTE
========================= */
export default function Home() {
  const router = useRouter();
  const { motorista } = useAuth();
  usePushNotifications();
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTurno, setFiltroTurno] = useState<string>("todos");
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setHora(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

 const carregarRotas = useCallback(async () => {
  const { data, error } = await supabase
    .from("rotas")
    .select(
      `
      id, nome, cor, distancia_km, duracao_min, pontos_originais,
      categoria, turno, turnos_atendidos, status_rota, horario_saida,
      linha_id,
      linhas ( id, nome, cor, cliente_nome_fantasia )
      `
    )
    .or("status_rota.eq.ativa,status_rota.is.null")
    .order("created_at", { ascending: false });

  if (!error && data) {
    setRotas(data as unknown as Rota[]);
  }
  setLoading(false);
  setRefreshing(false);
}, []);

  useEffect(() => {
    carregarRotas();
  }, [carregarRotas]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarRotas();
  };

  const primeiroNome = motorista?.nome?.split(" ")[0] || "Motorista";

  const rotasFiltradas = rotas.filter((r) => {
    const passaBusca = r.nome.toLowerCase().includes(busca.toLowerCase());
    const passaTurno =
      filtroTurno === "todos" ||
      r.turno?.toLowerCase() === filtroTurno.toLowerCase();
    return passaBusca && passaTurno;
  });

  const turnoAtual = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Manhã";
    if (h >= 12 && h < 18) return "Tarde";
    return "Noite";
  })();

  const rotasTurnoAtual = rotas.filter(
    (r) => r.turno?.toLowerCase() === turnoAtual.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <BadgeOffline posicaoTop={50} />
      <StatusSincronizacao posicaoTop={110} />


<View style={styles.header}>
<HomeHeader
  nome={motorista?.nome}
  busca={busca}
  onChangeBusca={setBusca}
/>

  {/* Filtros de turno */}
  <View style={styles.filtrosContainer}>
    {["todos", "Manhã", "Tarde", "Noite"].map((t) => (
      <TouchableOpacity
        key={t}
        onPress={() => setFiltroTurno(t)}
        style={[
          styles.filtroBtn,
          filtroTurno === t && styles.filtroBtnAtivo,
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filtroTexto,
            filtroTurno === t && styles.filtroTextoAtivo,
          ]}
        >
          {t === "todos" ? "Todas" : t}
        </Text>

        {t !== "todos" && turnoAtual === t && (
          <View style={styles.filtroPonto} />
        )}
      </TouchableOpacity>
    ))}
  </View>
</View>


      {/* Sugestão do turno atual */}
      {rotasTurnoAtual.length > 0 && filtroTurno === "todos" && !busca && (
        <View style={styles.sugestaoContainer}>
          <View style={styles.sugestaoBadge}>
            <Text style={styles.sugestaoBadgeTexto}>PARA AGORA</Text>
          </View>
          <Text style={styles.sugestaoTexto}>
            {rotasTurnoAtual.length} rota
            {rotasTurnoAtual.length > 1 ? "s" : ""} do turno da{" "}
            {turnoAtual.toLowerCase()}
          </Text>
        </View>
      )}

      {/* Título da lista */}
      <View style={styles.tituloSecao}>
        <View>
          <Text style={styles.tituloTexto}>
            {filtroTurno === "todos"
              ? "Rotas disponíveis"
              : `Rotas da ${filtroTurno.toLowerCase()}`}
          </Text>
          <Text style={styles.subtituloTexto}>
            {rotasFiltradas.length}{" "}
            {rotasFiltradas.length === 1 ? "rota" : "rotas"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando rotas...</Text>
        </View>
      ) : (
        <FlatList
          data={rotasFiltradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 110,
            gap: 10,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <IconeCaixaVazia size={72} color={colors.border} />
              <Text style={styles.vazioTitulo}>
                {rotas.length === 0
                  ? "Nenhuma rota disponível"
                  : "Nenhuma rota encontrada"}
              </Text>
              <Text style={styles.vazioTexto}>
                {rotas.length === 0
                  ? "As rotas cadastradas pelo admin aparecerão aqui"
                  : busca
                  ? `Nada encontrado para "${busca}"`
                  : "Tente outro filtro"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const ehDoTurnoAtual =
              item.turno?.toLowerCase() === turnoAtual.toLowerCase();

            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  ehDoTurnoAtual && filtroTurno === "todos" && styles.cardDestaque,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/navegacao",
                    params: { rotaId: item.id },
                  })
                }
                activeOpacity={0.75}
              >
                {/* Barra lateral colorida */}
                <View
                  style={[styles.corLateral, { backgroundColor: item.cor }]}
                />

                <View style={styles.cardConteudo}>
                  {/* Linha 1: Nome + tags + seta */}
                  <View style={styles.cardTopo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardNome} numberOfLines={1}>
                        {item.nome}
                      </Text>
{(item.categoria || item.turno || item.linhas || item.horario_saida) && (
  <View style={styles.tagsRow}>
    {/* 🆕 Badge da linha (cliente) — sempre primeiro */}
    {item.linhas && (
      <View
        style={[
          styles.tagLinha,
          { borderColor: (item.linhas.cor || colors.primary) + "60" },
          { backgroundColor: (item.linhas.cor || colors.primary) + "15" },
        ]}
      >
        <IconePredio size={10} color={item.linhas.cor || colors.primary} />
        <Text
          style={[
            styles.tagLinhaTexto,
            { color: item.linhas.cor || colors.primary },
          ]}
          numberOfLines={1}
        >
          {item.linhas.nome}
        </Text>
      </View>
    )}

    {item.turno && (
      <View
        style={[
          styles.tag,
          ehDoTurnoAtual && styles.tagAtiva,
        ]}
      >
        <Text
          style={[
            styles.tagTexto,
            ehDoTurnoAtual && styles.tagTextoAtiva,
          ]}
        >
          {item.turno}
        </Text>
      </View>
    )}
    {item.categoria && (
      <View style={styles.tag}>
        <Text style={styles.tagTexto}>
          {item.categoria}
        </Text>
      </View>
    )}
    {item.horario_saida && (
      <View style={styles.tagHorario}>
        <IconeRelogio size={10} color={colors.primary} />
        <Text style={styles.tagHorarioTexto}>
          {item.horario_saida.slice(0, 5)}
        </Text>
      </View>
    )}
  </View>
)}
                    </View>

                    <View style={styles.setaContainer}>
                      <IconeSeta size={18} color={colors.textMuted} />
                    </View>
                  </View>

                  {/* Linha 2: Info compacta em uma linha */}
                  <View style={styles.infoLinha}>
                    <View style={styles.infoItem}>
                      <IconeLocalizacao />
                      <Text style={styles.infoTexto}>
                        <Text style={styles.infoValor}>
                          {item.pontos_originais?.length || 0}
                        </Text>{" "}
                        paradas
                      </Text>
                    </View>

                    <View style={styles.infoDot} />

                    <View style={styles.infoItem}>
                      <IconeRaio />
                      <Text style={styles.infoTexto}>
                        <Text style={styles.infoValor}>
                          {(Number(item.distancia_km) || 0).toFixed(1)}
                        </Text>{" "}
                        km
                      </Text>
                    </View>

                    <View style={styles.infoDot} />

                    <View style={styles.infoItem}>
                      <IconeCronometro />
                      <Text style={styles.infoTexto}>
                        <Text style={styles.infoValor}>
                          {(Number(item.duracao_min) || 0).toFixed(0)}
                        </Text>{" "}
                        min
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

header: {
  backgroundColor: colors.primaryDark,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  overflow: "hidden",
},

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    minHeight: 60,
  },

  dataHoraLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dataTexto: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  horaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  horaTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  perfilContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perfilTextos: {
    alignItems: "flex-end",
  },
  saudacao: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "600",
  },
  nome: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 1,
    letterSpacing: -0.2,
  },

  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.15)",
    ...shadows.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  statusOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },

  buscaContainer: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  buscaInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    padding: 0,
  },

filtrosContainer: {
  flexDirection: "row",
  gap: 8,
  paddingRight: 18,
  paddingLeft: 78,  // 18 + 48(avatar) + 12(gap)
  paddingBottom: 16,
  marginTop: -8,
},

  filtroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filtroBtnAtivo: {
    backgroundColor: colors.white,
  },
  filtroTexto: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  filtroTextoAtivo: {
    color: colors.primaryDark,
  },
  filtroPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  sugestaoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  sugestaoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sugestaoBadgeTexto: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  sugestaoTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    flex: 1,
  },

  tituloSecao: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tituloTexto: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtituloTexto: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 13,
  },

  vazio: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 4,
  },
  vazioTexto: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  // 🆕 CARD COMPACTO E MODERNO
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    ...shadows.sm,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  cardDestaque: {
    borderWidth: 1.5,
    borderColor: colors.primary + "40",
    ...shadows.md,
  },
  corLateral: {
    width: 5,
  },
  cardConteudo: {
    flex: 1,
    padding: 14,
    paddingLeft: 14,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tag: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagAtiva: {
    backgroundColor: colors.primary,
  },
  tagTexto: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tagTextoAtiva: {
    color: colors.white,
  },
  tagHorario: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "12",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagHorarioTexto: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },

  tagLinha: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 6,
  borderWidth: 1,
  maxWidth: 160,
},
tagLinhaTexto: {
  fontSize: 11,
  fontWeight: "800",
  letterSpacing: 0.2,
},

  setaContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // 🆕 Linha de info compacta
  infoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  infoValor: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 14,
  },
  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },
});