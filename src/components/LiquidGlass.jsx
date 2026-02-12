export default function LiquidGlass({
  children,
  className = "",
  drops = 10,
  ripples = 5,
  opacity = 0.1,
  roundness = "rounded-2xl",
  blur = 40,
}) {
  const r = Array.from({ length: ripples });
  const d = Array.from({ length: drops });
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {r.map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full border border-white/25"
            style={{
              top: `${10 + i * 12}%`,
              left: `${8 + i * 14}%`,
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              animation: `ripple ${9 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.1}s`,
            }}
          />
        ))}
        {d.map((_, i) => (
          <span
            key={`d${i}`}
            className="absolute bg-white/25 blur-sm rounded-full"
            style={{
              top: `${(i * 7) % 90}%`,
              left: `${(i * 11) % 90}%`,
              width: `${6 + (i % 3) * 4}px`,
              height: `${6 + (i % 3) * 4}px`,
              animation: `drop ${6 + i}s linear infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      <div
        className={`relative z-10 ${roundness} border border-white/60 shadow-lg`}
        style={{
          background: `rgba(255, 255, 255, ${opacity})`,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }}
      >
        {children}
      </div>
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }
        @keyframes drop {
          0% {
            transform: translateY(-20%);
            opacity: 0;
          }
          25% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
