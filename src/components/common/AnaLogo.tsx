import React from "react";

interface AnaLogoProps {
  className?: string;
  size?: number | string;
  color?: string;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  variant?: "monogram" | "full" | "horizontal";
}

/**
 * Precision SVG implementation of the Ana Monogram & Brand Identity.
 * Renders the circular interconnected A-N-A continuous line geometric symbol
 * with the signature celestial orbiting dot from the official brand identity.
 */
export const AnaLogo: React.FC<AnaLogoProps> = ({
  className = "",
  size = 40,
  color = "currentColor",
  showText = false,
  textColor = "currentColor",
  subtextColor = "#8C8C8C",
  variant = "monogram",
}) => {
  const numericSize = typeof size === "number" ? size : parseInt(size, 10) || 40;

  const MonogramSvg = (
    <svg
      viewBox="0 0 100 100"
      width={numericSize}
      height={numericSize}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none transition-transform duration-300 ${className}`}
      aria-label="Ana Monogram Logo"
    >
      {/* Outer Circle with Gap at 1-2 o'clock */}
      {/* Circle center at (50, 50), radius 38 */}
      {/* Arc from (45, 88) through (12, 50), (50, 12), down to (78, 25) */}
      <path
        d="M 45 88 A 38 38 0 1 1 79 26"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orbiting Satellite Dot at 1:30 position */}
      <circle
        cx="77"
        cy="20"
        r="3.8"
        fill={color}
      />

      {/* Interconnected Continuous Monogram: A - N - A */}
      {/* Left 'A' outer diagonal: (23, 67) to apex (37, 40) */}
      <line
        x1="23"
        y1="67"
        x2="37"
        y2="40"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left 'A' vertical right leg: (37, 40) down to (37, 85) */}
      <line
        x1="37"
        y1="40"
        x2="37"
        y2="85"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left 'A' crossbar: (27, 57) to (37, 57) */}
      <line
        x1="26"
        y1="57"
        x2="37"
        y2="57"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Middle 'N' diagonal connecting apex of left A to bottom right: (37, 40) down to (63, 68) */}
      <line
        x1="37"
        y1="40"
        x2="63"
        y2="68"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right 'A' vertical left leg: (63, 68) straight up to apex (63, 40) */}
      <line
        x1="63"
        y1="68"
        x2="63"
        y2="40"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right 'A' outer diagonal: (63, 40) down to (78, 67) */}
      <line
        x1="63"
        y1="40"
        x2="78"
        y2="67"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right 'A' crossbar: (63, 57) to (74, 57) */}
      <line
        x1="63"
        y1="57"
        x2="74"
        y2="57"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "monogram" && !showText) {
    return MonogramSvg;
  }

  if (variant === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {MonogramSvg}
        <div className="flex flex-col">
          <span
            style={{ color: textColor }}
            className="font-serif font-bold text-lg leading-none tracking-widest uppercase"
          >
            Ana
          </span>
          <span
            style={{ color: subtextColor }}
            className="font-mono text-[9px] uppercase tracking-[0.25em] leading-tight mt-0.5"
          >
            Your Journal
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {MonogramSvg}
      {showText && (
        <div className="mt-3 flex flex-col items-center">
          <span
            style={{ color: textColor }}
            className="text-2xl font-serif font-medium tracking-[0.35em] pl-[0.35em] uppercase"
          >
            A N A
          </span>
          <div className="w-16 h-[1px] bg-stone-300 my-2" />
          <span
            style={{ color: subtextColor }}
            className="text-[10px] font-mono tracking-[0.35em] pl-[0.35em] uppercase text-stone-500"
          >
            YOUR JOURNAL
          </span>
        </div>
      )}
    </div>
  );
};
