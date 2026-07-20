interface LogoProps {
  size?: number;
  variant?: "dark" | "light";
  showText?: boolean;
  showSlogan?: boolean;
}

export default function Logo({
  size = 44,
  variant = "dark",
  showText = true,
  showSlogan = true,
}: LogoProps) {
  // Cores baseadas no variant
  const bgGradient =
    variant === "dark"
      ? { start: "#1E56D4", end: "#0D3A9E" }
      : { start: "#3B82F6", end: "#1E56D4" };

  const textColor = variant === "dark" ? "#FFFFFF" : "#0F172A";
  const sloganColor =
    variant === "dark" ? "rgba(148, 163, 184, 0.9)" : "#64748B";

  const iconSize = size;
  const textSize = size * 0.55; // proporção
  const sloganSize = size * 0.22;

  return (
    <div className="flex items-center gap-3">
      {/* Ícone SVG — F estilizado com rota */}
      <div
        className="flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradiente do fundo */}
            <linearGradient id="fretta-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={bgGradient.start} />
              <stop offset="100%" stopColor={bgGradient.end} />
            </linearGradient>
            {/* Gradiente do F */}
            <linearGradient id="fretta-f" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>
            {/* Sombra suave */}
            <filter id="fretta-shadow">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Fundo arredondado com gradiente */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="22"
            fill="url(#fretta-bg)"
          />

          {/* Brilho sutil no topo */}
          <rect
            x="4"
            y="4"
            width="92"
            height="46"
            rx="22"
            fill="rgba(255,255,255,0.08)"
          />

          {/* Trilha de rota (curva atrás do F) */}
          <path
            d="M 20 78 Q 35 78 45 62 T 78 40"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="4 4"
          />

          {/* Letra F estilizada */}
          {/* Barra vertical */}
          <rect
            x="30"
            y="22"
            width="14"
            height="58"
            rx="3"
            fill="url(#fretta-f)"
          />
          {/* Barra horizontal do topo */}
          <rect
            x="30"
            y="22"
            width="42"
            height="14"
            rx="3"
            fill="url(#fretta-f)"
          />
          {/* Barra horizontal do meio */}
          <rect
            x="30"
            y="46"
            width="30"
            height="12"
            rx="3"
            fill="url(#fretta-f)"
          />

          {/* Pontinho de destino (representa parada/local) */}
          <circle cx="78" cy="40" r="5" fill="#22C55E" />
          <circle cx="78" cy="40" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Texto */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            style={{
              fontSize: textSize,
              color: textColor,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Fretta
          </span>
          {showSlogan && (
            <span
              style={{
                fontSize: sloganSize,
                color: sloganColor,
                fontWeight: 600,
                marginTop: size * 0.06,
                letterSpacing: "0.02em",
              }}
            >
              Gestão inteligente de fretamento
            </span>
          )}
        </div>
      )}
    </div>
  );
}