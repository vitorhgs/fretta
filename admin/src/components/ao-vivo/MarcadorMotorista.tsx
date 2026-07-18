import { DivIcon } from "leaflet";

interface CriarMarcadorProps {
  cor: string;
  heading: number;
  emViagem: boolean;
  nome: string;
}

/**
 * Cria um ícone Leaflet customizado pro motorista
 * - Seta triangular apontando na direção do movimento
 * - Cor da rota
 * - Pulso animado se estiver em viagem
 */
export function criarMarcadorMotorista({
  cor,
  heading,
  emViagem,
  nome,
}: CriarMarcadorProps): DivIcon {
  const iniciais = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const html = `
    <div class="marcador-motorista" style="position: relative;">
      ${
        emViagem
          ? `<div class="pulso-motorista" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: ${cor};
              opacity: 0.35;
              animation: pulsoAoVivo 2s ease-out infinite;
            "></div>`
          : ""
      }
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: white;
        border: 3px solid ${cor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      ">
        ${
          emViagem
            ? `<div style="transform: rotate(${heading}deg); display:flex; align-items:center; justify-content:center;">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M12 2 L20 20 L12 16 L4 20 Z"
                    fill="${cor}"
                    stroke="white"
                    stroke-width="1.5"
                    stroke-linejoin="round"/>
                </svg>
              </div>`
            : `<span style="
                font-size: 13px;
                font-weight: 800;
                color: ${cor};
              ">${iniciais}</span>`
        }
      </div>
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${emViagem ? "#22C55E" : "#94A3B8"};
        border: 2px solid white;
      "></div>
    </div>
  `;

  return new DivIcon({
    className: "marcador-motorista-container",
    html,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}