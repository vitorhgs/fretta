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
import { supabase } from "../../supabase";
import { useAuth } from "../../contexts/AuthContext";
import { colors, shadows } from "../../theme/colors";

interface Rota {
  id: string;
  nome: string;
  cor: string;
  distancia_km: number;
  duracao_min: number;
  pontos_originais: any[];
  categoria?: string;
  turno?: string;
  turnos_atendidos?: string[]; // 🆕
  status_rota?: string; // 🆕
  horario_saida?: string;
}

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

export default function Home() {
  const router = useRouter();
  const { motorista } = useAuth();
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
      "id, nome, cor, distancia_km, duracao_min, pontos_originais, categoria, turno, turnos_atendidos, status_rota, horario_saida"
    )
    .or("status_rota.eq.ativa,status_rota.is.null") // só ativas (e legado sem status)
    .order("created_at", { ascending: false });

  if (!error && data) {
    setRotas(data as Rota[]);
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
      (r.turno?.toLowerCase() === filtroTurno.toLowerCase());
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

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Esquerda: data + hora */}
          <View style={{ flex: 1 }}>
            <View style={styles.dataHoraLinha}>
              <Text style={styles.dataTexto}>{dataHoje()}</Text>
              <View style={styles.horaBadge}>
                <View style={styles.horaPonto} />
                <Text style={styles.horaTexto}>{hora}</Text>
              </View>
            </View>
          </View>

          {/* Direita: saudação + nome + avatar */}
          <TouchableOpacity
            style={styles.perfilContainer}
            onPress={() => router.push("/perfil" as any)}
            activeOpacity={0.7}
          >
            <View style={styles.perfilTextos}>
              <Text style={styles.saudacao}>{saudacao()},</Text>
              <Text style={styles.nome}>{primeiroNome}</Text>
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {iniciais(motorista?.nome || "")}
                </Text>
              </View>
              <View style={styles.statusOnline} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Busca */}
        <View style={styles.buscaContainer}>
          <Text style={styles.buscaIcon}>🔍</Text>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar rota..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={busca}
            onChangeText={setBusca}
          />
          {busca ? (
            <TouchableOpacity onPress={() => setBusca("")}>
              <Text style={styles.buscaClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

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
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>📭</Text>
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
                activeOpacity={0.7}
              >
                <View
                  style={[styles.corLateral, { backgroundColor: item.cor }]}
                />

                <View style={styles.cardConteudo}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardNome}>{item.nome}</Text>
                      {(item.categoria || item.turno) && (
                        <View style={styles.tagsRow}>
                          {item.categoria && (
                            <View style={styles.tag}>
                              <Text style={styles.tagTexto}>
                                {item.categoria}
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
                        </View>
                      )}
                    </View>
                    <View style={styles.setaContainer}>
                      <Text style={styles.seta}>›</Text>
                    </View>
                  </View>

                  <View style={styles.metricas}>
                    <View style={styles.metrica}>
                      <Text style={styles.metricaValor}>
                        {item.pontos_originais?.length || 0}
                      </Text>
                      <Text style={styles.metricaLabel}>paradas</Text>
                    </View>

                    <View style={styles.divisor} />

                    <View style={styles.metrica}>
                      <Text style={styles.metricaValor}>
                        {(Number(item.distancia_km) || 0).toFixed(1)}
                      </Text>
                      <Text style={styles.metricaLabel}>km</Text>
                    </View>

                    <View style={styles.divisor} />

                    <View style={styles.metrica}>
                      <Text style={styles.metricaValor}>
                        {(Number(item.duracao_min) || 0).toFixed(0)}
                      </Text>
                      <Text style={styles.metricaLabel}>min</Text>
                    </View>

                    {item.horario_saida && (
                      <>
                        <View style={styles.divisor} />
                        <View style={styles.metrica}>
                          <Text style={styles.metricaValor}>
                            {item.horario_saida.slice(0, 5)}
                          </Text>
                          <Text style={styles.metricaLabel}>saída</Text>
                        </View>
                      </>
                    )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  horaPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  horaTexto: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  // Nova área de perfil (direita)
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
    marginBottom: 12,
  },
  buscaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buscaInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    padding: 0,
  },
  buscaClear: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 8,
  },

  filtrosContainer: {
    flexDirection: "row",
    gap: 8,
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

  lista: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
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
  },
  vazioEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  vazioTexto: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    ...shadows.md,
  },
  cardDestaque: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  corLateral: {
    width: 6,
  },
  cardConteudo: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardNome: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagAtiva: {
    backgroundColor: colors.primary,
  },
  tagTexto: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tagTextoAtiva: {
    color: colors.white,
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
  seta: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: "700",
    lineHeight: 22,
  },
  metricas: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingVertical: 8,
  },
  metrica: {
    flex: 1,
    alignItems: "center",
  },
  metricaValor: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  metricaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  divisor: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
  },
});