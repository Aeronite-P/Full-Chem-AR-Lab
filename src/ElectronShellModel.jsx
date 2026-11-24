import { memo } from "react";

// Shell (Bohr) model for the atomic expansion view: every shell drawn with
// its real ground-state electron count (from the element's configuration),
// electrons spaced evenly, neighbouring shells phase-offset so electrons
// don't line up into spokes, and the outer shell set apart.
//
// Geometry is expressed as fractions of the model size so it reads the same
// on a phone (~280px model) and a laptop (~470px). The outer shell sits at
// 34% of the model size: the same radius the two-hand "grip the shell to
// collapse" gesture measures against.

const OUTER_SHELL_RADIUS = 0.34;
const INNER_SHELL_RADIUS = 0.135;
const NUCLEUS_REFERENCE_SIZE_PX = 520;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function ElectronShellModel({
  shells,
  sizePx,
  shellScale,
  opacity,
  isClosing,
  shellGlow,
  outerShellLabel,
}) {
  const shellCount = shells.length;
  const outerRadius = sizePx * OUTER_SHELL_RADIUS * shellScale;
  const innerRadius =
    shellCount === 1
      ? outerRadius
      : sizePx * INNER_SHELL_RADIUS * (1 - (1 - shellScale) * 0.35);
  const shellGap = shellCount > 1 ? (outerRadius - innerRadius) / (shellCount - 1) : outerRadius;
  const contentOpacity = opacity * (isClosing ? 0.5 : 1);

  return (
    <>
      {shells.map((electronCount, shellIndex) => {
        const radius = shellCount === 1 ? outerRadius : innerRadius + shellGap * shellIndex;
        const isOuter = shellIndex === shellCount - 1;
        const arcSpacing = (2 * Math.PI * radius) / Math.max(1, electronCount);
        const electronSize = clamp(
          Math.min(arcSpacing * 0.55, shellGap * 0.55, sizePx * (isOuter ? 0.03 : 0.024)),
          3,
          isOuter ? 13 : 10
        );
        // Half-step offset on alternate shells plus a small twist, so
        // electrons on neighbouring shells never start lined up.
        const startAngle =
          (shellIndex % 2 === 1 ? 180 / Math.max(1, electronCount) : 0) + shellIndex * 23;
        // Outer shells orbit more slowly (smooth, unhurried motion).
        const orbitSeconds = 10 + shellIndex * 3.5;

        return (
          <div
            key={`shell-${shellIndex}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${radius * 2}px`,
              height: `${radius * 2}px`,
              transform: `translate(-50%, -50%) rotate(${startAngle}deg)`,
              opacity: isOuter ? opacity * (isClosing ? 0.5 : 1) : contentOpacity * 0.9,
              transition: "opacity 180ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                border: isOuter
                  ? "2px solid rgba(103, 232, 249, 0.5)"
                  : "1px solid rgba(103, 232, 249, 0.18)",
                boxShadow: isOuter
                  ? `0 0 ${28 + shellGlow * 18}px rgba(34, 211, 238, ${0.16 + shellGlow * 0.18}), inset 0 0 ${36 + shellGlow * 16}px rgba(34, 211, 238, ${0.07 + shellGlow * 0.14})`
                  : "0 0 10px rgba(34, 211, 238, 0.06)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                animation: `atomicShellOrbit ${orbitSeconds}s linear infinite`,
              }}
            >
              {Array.from({ length: electronCount }, (_, electronIndex) => {
                const angle = (electronIndex / electronCount) * Math.PI * 2;

                return (
                  <div
                    key={electronIndex}
                    style={{
                      position: "absolute",
                      left: `${radius + Math.cos(angle) * radius - electronSize / 2}px`,
                      top: `${radius + Math.sin(angle) * radius - electronSize / 2}px`,
                      width: `${electronSize}px`,
                      height: `${electronSize}px`,
                      borderRadius: "999px",
                      background: isOuter ? "#67e8f9" : "rgba(125, 211, 252, 0.82)",
                      boxShadow: isOuter
                        ? `0 0 ${electronSize * 0.9}px rgba(103, 232, 249, 0.95), 0 0 ${electronSize * 2}px rgba(34, 211, 238, 0.6)`
                        : `0 0 ${electronSize * 0.8}px rgba(56, 189, 248, 0.55)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {outerShellLabel ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: `calc(50% - ${outerRadius + clamp(sizePx * 0.045, 12, 20)}px)`,
            transform: "translate(-50%, -50%)",
            fontSize: `${clamp(sizePx * 0.022, 9, 11)}px`,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: "#8be9ff",
            textShadow: "0 0 8px rgba(34, 211, 238, 0.6)",
            opacity: opacity * 0.85,
          }}
        >
          {outerShellLabel}
        </div>
      ) : null}
    </>
  );
}

// Nucleus: a representative cluster (capped for heavy atoms — the real
// proton/neutron counts are labelled in the panel below).
function NucleusCluster({ particles, sizePx, entryScale, opacity }) {
  const nucleusScale = clamp(sizePx / NUCLEUS_REFERENCE_SIZE_PX, 0.5, 1) * entryScale;

  return particles.map((particle) => {
    const diameter = (particle.kind === "proton" ? 22 : 20) * nucleusScale;

    return (
      <div
        key={particle.id}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${diameter}px`,
          height: `${diameter}px`,
          marginLeft: `${-diameter / 2}px`,
          marginTop: `${-diameter / 2}px`,
          borderRadius: "999px",
          transform: `translate(${particle.x * nucleusScale}px, ${particle.y * nucleusScale}px)`,
          opacity,
          background:
            particle.kind === "proton"
              ? "radial-gradient(circle at 32% 28%, #ffd6ea 0%, #fb7185 42%, #e11d48 100%)"
              : "radial-gradient(circle at 32% 28%, #dbeafe 0%, #94a3b8 42%, #475569 100%)",
          boxShadow:
            particle.kind === "proton"
              ? "0 0 18px rgba(251, 113, 133, 0.24)"
              : "0 0 14px rgba(148, 163, 184, 0.18)",
        }}
      />
    );
  });
}

export const MemoNucleusCluster = memo(NucleusCluster);
export default memo(ElectronShellModel);
