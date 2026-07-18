interface LogoProps {
  size?: number;
  variant?: "light" | "dark";
  showText?: boolean;
}

export default function Logo({
  size = 40,
  variant = "dark",
  showText = true,
}: LogoProps) {
  const isDark = variant === "dark";

  return (
    <div className="flex items-center gap-3">
      {/* Ícone */}
      <div
        className={`relative rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${
          isDark
            ? "bg-gradient-to-br from-[#1E56D4] to-[#09152E]"
            : "bg-white"
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pin de localização estilizado */}
          <path
            d="M16 2C10.48 2 6 6.48 6 12c0 7 10 18 10 18s10-11 10-18c0-5.52-4.48-10-10-10z"
            fill={isDark ? "white" : "#1E56D4"}
            stroke={isDark ? "white" : "#1E56D4"}
            strokeWidth="1"
          />
          {/* Rota interna (linhas) */}
          <path
            d="M12 11 L16 14 L20 11"
            stroke={isDark ? "#1E56D4" : "white"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="16" cy="14" r="1.5" fill={isDark ? "#1E56D4" : "white"} />
        </svg>
      </div>

      {/* Texto */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-black tracking-tight ${
              isDark ? "text-white" : "text-[#09152E]"
            }`}
            style={{ fontSize: size * 0.5 }}
          >
            Fretta
          </span>
          <span
            className={`text-[9px] font-semibold uppercase tracking-widest mt-0.5 ${
              isDark ? "text-blue-300" : "text-slate-500"
            }`}
          >
            Route Manager
          </span>
        </div>
      )}
    </div>
  );
}