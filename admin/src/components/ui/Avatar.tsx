interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "w-8 h-8 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-14 h-14 text-lg",
};

function iniciais(nome: string): string {
  if (!nome) return "?";
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`
        rounded-full bg-gradient-to-br from-blue-500 to-blue-700
        flex items-center justify-center text-white font-bold
        shadow-md flex-shrink-0
        ${SIZES[size]} ${className}
      `}
    >
      {iniciais(name)}
    </div>
  );
}