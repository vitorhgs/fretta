import * as Location from "expo-location";

/**
 * Calcula distância em METROS entre 2 pontos GPS (Haversine)
 */
export function distanciaMetros(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // raio da Terra em metros
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula o ângulo (heading) entre 2 pontos em graus (0-360)
 * 0 = Norte, 90 = Leste, 180 = Sul, 270 = Oeste
 */
export function calcularHeading(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Converte velocidade de m/s para km/h
 */
export function msParaKmh(velocidadeMs: number | null): number {
  if (!velocidadeMs || velocidadeMs < 0) return 0;
  return Math.round(velocidadeMs * 3.6);
}

/**
 * Solicita permissão de localização
 */
export async function pedirPermissaoGPS(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * Verifica se está próximo de uma parada (raio em metros)
 */
export function chegouNaParada(
  minhaLat: number,
  minhaLng: number,
  paradaLat: number,
  paradaLng: number,
  raioMetros: number = 30
): boolean {
  const dist = distanciaMetros(minhaLat, minhaLng, paradaLat, paradaLng);
  return dist <= raioMetros;
}

/**
 * Formata tempo em segundos para "MM:SS" ou "HH:MM:SS"
 */
export function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Formata distância em metros para "150m" ou "1.2km"
 */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)}m`;
  return `${(metros / 1000).toFixed(1)}km`;
}