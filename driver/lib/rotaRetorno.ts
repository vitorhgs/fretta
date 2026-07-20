import { distanciaAteRota } from "./desvio";

interface Ponto {
  latitude: number;
  longitude: number;
}

interface ResultadoRotaRetorno {
  sucesso: boolean;
  pontos: Ponto[];
  distancia_metros: number;
  fallback: boolean; // true se usou linha reta
}

const OSRM_PUBLICO = "https://router.project-osrm.org/route/v1/driving";

/**
 * Encontra o ponto mais próximo da rota oficial
 * a partir da localização atual do motorista
 */
function encontrarPontoRetorno(
  localizacao: Ponto,
  rotaOficial: Ponto[]
): Ponto | null {
  if (rotaOficial.length === 0) return null;

  const { indiceSegmento } = distanciaAteRota(localizacao, rotaOficial);

  // Pega o próximo ponto da rota (não voltar exatamente onde já passou)
  // Preferimos o ponto DEPOIS do segmento mais próximo
  const indiceRetorno = Math.min(indiceSegmento + 1, rotaOficial.length - 1);

  return rotaOficial[indiceRetorno];
}

/**
 * Calcula a distância em metros entre dois pontos (Haversine)
 */
function distanciaHaversine(p1: Ponto, p2: Ponto): number {
  const R = 6371000; // metros
  const lat1Rad = (p1.latitude * Math.PI) / 180;
  const lat2Rad = (p2.latitude * Math.PI) / 180;
  const deltaLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const deltaLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Chama OSRM público pra calcular rota entre 2 pontos
 */
async function chamarOSRM(
  origem: Ponto,
  destino: Ponto
): Promise<ResultadoRotaRetorno | null> {
  try {
    // OSRM usa formato lng,lat (invertido do padrão)
    const coords = `${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}`;
    const url = `${OSRM_PUBLICO}/${coords}?overview=full&geometries=geojson`;

    // Timeout de 5 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) return null;

    const rota = data.routes[0];
    const coordenadas = rota.geometry.coordinates as [number, number][];

    // Converte de [lng, lat] pra {latitude, longitude}
    const pontos: Ponto[] = coordenadas.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return {
      sucesso: true,
      pontos,
      distancia_metros: Math.round(rota.distance),
      fallback: false,
    };
  } catch {
    return null;
  }
}

/**
 * Fallback: cria linha reta simples entre origem e destino
 * (usado quando OSRM falha ou está offline)
 */
function criarLinhaReta(
  origem: Ponto,
  destino: Ponto
): ResultadoRotaRetorno {
  return {
    sucesso: true,
    pontos: [origem, destino],
    distancia_metros: Math.round(distanciaHaversine(origem, destino)),
    fallback: true,
  };
}

/**
 * Calcula rota de retorno até a rota oficial.
 * Tenta OSRM público, se falhar usa linha reta.
 */
export async function calcularRotaRetorno(
  localizacao: Ponto,
  rotaOficial: Ponto[]
): Promise<ResultadoRotaRetorno | null> {
  const pontoDestino = encontrarPontoRetorno(localizacao, rotaOficial);
  if (!pontoDestino) return null;

  // Se está muito perto (menos de 20m), nem precisa
  const distDireta = distanciaHaversine(localizacao, pontoDestino);
  if (distDireta < 20) return null;

  // Tenta OSRM
  const resultadoOSRM = await chamarOSRM(localizacao, pontoDestino);
  if (resultadoOSRM) {
    console.log(
      `🗺️ Rota de retorno calculada: ${resultadoOSRM.distancia_metros}m`
    );
    return resultadoOSRM;
  }

  // Fallback: linha reta
  console.log("⚠️ OSRM falhou, usando linha reta");
  return criarLinhaReta(localizacao, pontoDestino);
}