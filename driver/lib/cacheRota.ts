import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAVE_ROTAS = "@fretta:rotas_cache";
const CHAVE_ULTIMA_VIAGEM = "@fretta:ultima_viagem";
const CHAVE_FILA_POSICOES = "@fretta:fila_posicoes";

interface RotaCache {
  id: string;
  dados: any; // rota completa
  cachedEm: number; // timestamp
}

interface PosicaoFila {
  id: string; // uuid local
  latitude: number;
  longitude: number;
  heading: number;
  velocidade_kmh: number;
  em_viagem: boolean;
  viagem_id: string | null;
  timestamp: number;
}

/* =========================
   CACHE DE ROTAS
========================= */

/**
 * Salva uma rota no cache local
 */
export async function salvarRotaCache(rota: any): Promise<void> {
  if (!rota?.id) return;

  try {
    const cacheStr = await AsyncStorage.getItem(CHAVE_ROTAS);
    const cache: Record<string, RotaCache> = cacheStr ? JSON.parse(cacheStr) : {};

    cache[rota.id] = {
      id: rota.id,
      dados: rota,
      cachedEm: Date.now(),
    };

    // Limita a 20 rotas em cache (remove as mais antigas)
    const rotas = Object.values(cache);
    if (rotas.length > 20) {
      rotas.sort((a, b) => b.cachedEm - a.cachedEm);
      const cacheReduzido: Record<string, RotaCache> = {};
      rotas.slice(0, 20).forEach((r) => {
        cacheReduzido[r.id] = r;
      });
      await AsyncStorage.setItem(CHAVE_ROTAS, JSON.stringify(cacheReduzido));
    } else {
      await AsyncStorage.setItem(CHAVE_ROTAS, JSON.stringify(cache));
    }

    console.log("💾 Rota salva no cache:", rota.nome);
  } catch (err) {
    console.log("❌ Erro ao salvar rota no cache:", err);
  }
}

/**
 * Busca uma rota do cache
 */
export async function buscarRotaCache(rotaId: string): Promise<any | null> {
  try {
    const cacheStr = await AsyncStorage.getItem(CHAVE_ROTAS);
    if (!cacheStr) return null;

    const cache: Record<string, RotaCache> = JSON.parse(cacheStr);
    const item = cache[rotaId];

    if (item) {
      console.log("📦 Rota carregada do cache:", item.dados.nome);
      return item.dados;
    }
    return null;
  } catch (err) {
    console.log("❌ Erro ao buscar rota do cache:", err);
    return null;
  }
}

/**
 * Lista todas as rotas em cache (útil pra debug)
 */
export async function listarRotasCache(): Promise<RotaCache[]> {
  try {
    const cacheStr = await AsyncStorage.getItem(CHAVE_ROTAS);
    if (!cacheStr) return [];
    const cache: Record<string, RotaCache> = JSON.parse(cacheStr);
    return Object.values(cache).sort((a, b) => b.cachedEm - a.cachedEm);
  } catch {
    return [];
  }
}

/* =========================
   FILA DE POSIÇÕES GPS
========================= */

/**
 * Adiciona uma posição à fila offline
 */
export async function adicionarPosicaoFila(
  posicao: Omit<PosicaoFila, "id" | "timestamp">
): Promise<void> {
  try {
    const filaStr = await AsyncStorage.getItem(CHAVE_FILA_POSICOES);
    const fila: PosicaoFila[] = filaStr ? JSON.parse(filaStr) : [];

    const nova: PosicaoFila = {
      ...posicao,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };

    fila.push(nova);

    // Limita a 500 posições (evita bloat)
    const filaLimitada = fila.slice(-500);

    await AsyncStorage.setItem(
      CHAVE_FILA_POSICOES,
      JSON.stringify(filaLimitada)
    );

    console.log(`📍 Posição adicionada à fila offline (${filaLimitada.length} pendentes)`);
  } catch (err) {
    console.log("❌ Erro ao adicionar posição à fila:", err);
  }
}

/**
 * Busca todas as posições pendentes
 */
export async function buscarFilaPosicoes(): Promise<PosicaoFila[]> {
  try {
    const filaStr = await AsyncStorage.getItem(CHAVE_FILA_POSICOES);
    if (!filaStr) return [];
    return JSON.parse(filaStr) as PosicaoFila[];
  } catch {
    return [];
  }
}

/**
 * Remove posições que já foram sincronizadas
 */
export async function removerPosicoesFila(ids: string[]): Promise<void> {
  try {
    const filaStr = await AsyncStorage.getItem(CHAVE_FILA_POSICOES);
    if (!filaStr) return;

    const fila: PosicaoFila[] = JSON.parse(filaStr);
    const filtrada = fila.filter((p) => !ids.includes(p.id));

    await AsyncStorage.setItem(CHAVE_FILA_POSICOES, JSON.stringify(filtrada));
    console.log(`🗑️ Removidas ${ids.length} posições da fila`);
  } catch (err) {
    console.log("❌ Erro ao remover posições da fila:", err);
  }
}

/**
 * Limpa toda a fila (útil se der problema)
 */
export async function limparFilaPosicoes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE_FILA_POSICOES);
    console.log("🗑️ Fila de posições limpa");
  } catch {}
}

/**
 * Conta posições pendentes (pra mostrar badge)
 */
export async function contarFilaPosicoes(): Promise<number> {
  try {
    const fila = await buscarFilaPosicoes();
    return fila.length;
  } catch {
    return 0;
  }
}

/* =========================
   VIAGEM EM ANDAMENTO (backup)
========================= */

/**
 * Salva estado da viagem atual (em caso de crash)
 */
export async function salvarViagemAtual(dados: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CHAVE_ULTIMA_VIAGEM,
      JSON.stringify({ ...dados, savedAt: Date.now() })
    );
  } catch {}
}

/**
 * Recupera viagem em andamento (útil após crash)
 */
export async function recuperarViagemAtual(): Promise<any | null> {
  try {
    const str = await AsyncStorage.getItem(CHAVE_ULTIMA_VIAGEM);
    if (!str) return null;
    const dados = JSON.parse(str);
    // Só retorna se for recente (menos de 6 horas)
    if (Date.now() - dados.savedAt < 6 * 60 * 60 * 1000) {
      return dados;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Limpa viagem em andamento (chamar ao finalizar)
 */
export async function limparViagemAtual(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE_ULTIMA_VIAGEM);
  } catch {}
}