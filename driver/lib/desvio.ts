import { distanciaMetros } from "./gps";

interface Ponto {
  latitude: number;
  longitude: number;
}

/**
 * Calcula a menor distância (em metros) entre um ponto e uma polyline (rota).
 * Usa distância ponto-a-segmento pra maior precisão.
 */
export function distanciaAteRota(
  ponto: Ponto,
  rota: Ponto[]
): { distancia: number; indiceSegmento: number } {
  if (!rota || rota.length === 0) {
    return { distancia: Infinity, indiceSegmento: -1 };
  }

  if (rota.length === 1) {
    return {
      distancia: distanciaMetros(
        ponto.latitude,
        ponto.longitude,
        rota[0].latitude,
        rota[0].longitude
      ),
      indiceSegmento: 0,
    };
  }

  let menorDistancia = Infinity;
  let indiceMaisProximo = 0;

  for (let i = 0; i < rota.length - 1; i++) {
    const dist = distanciaPontoSegmento(ponto, rota[i], rota[i + 1]);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      indiceMaisProximo = i;
    }
  }

  return { distancia: menorDistancia, indiceSegmento: indiceMaisProximo };
}

/**
 * Distância de um ponto até um segmento de reta (em metros).
 * Baseado em projeção vetorial.
 */
function distanciaPontoSegmento(
  p: Ponto,
  a: Ponto,
  b: Ponto
): number {
  const R = 6371000; // raio da Terra em metros

  // Converte tudo pra radianos
  const lat1 = (a.latitude * Math.PI) / 180;
  const lon1 = (a.longitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const lon2 = (b.longitude * Math.PI) / 180;
  const lat3 = (p.latitude * Math.PI) / 180;
  const lon3 = (p.longitude * Math.PI) / 180;

  // Projeção em plano local (aproximação boa pra distâncias curtas)
  const x1 = R * lon1 * Math.cos(lat1);
  const y1 = R * lat1;
  const x2 = R * lon2 * Math.cos(lat2);
  const y2 = R * lat2;
  const x3 = R * lon3 * Math.cos(lat3);
  const y3 = R * lat3;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // a e b são o mesmo ponto
    return Math.hypot(x3 - x1, y3 - y1);
  }

  // t = projeção do ponto no segmento (0 = ponto a, 1 = ponto b)
  const t = ((x3 - x1) * dx + (y3 - y1) * dy) / (dx * dx + dy * dy);

  let xProj: number, yProj: number;

  if (t < 0) {
    xProj = x1;
    yProj = y1;
  } else if (t > 1) {
    xProj = x2;
    yProj = y2;
  } else {
    xProj = x1 + t * dx;
    yProj = y1 + t * dy;
  }

  return Math.hypot(x3 - xProj, y3 - yProj);
}