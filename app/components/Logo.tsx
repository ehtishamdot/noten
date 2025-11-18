interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "dark" | "light";
}

export default function Logo({ size = "md", className = "", variant = "dark" }: LogoProps) {
  const sizes = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  const textColor = variant === "dark" ? "text-gray-900" : "text-white";

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <h1
        className={`${sizes[size]} ${textColor}`}
        style={{
          fontFamily: 'var(--font-playfair), serif',
          letterSpacing: '-0.02em',
          fontWeight: 400
        }}
      >
        Planwise
      </h1>
    </div>
  );
}
