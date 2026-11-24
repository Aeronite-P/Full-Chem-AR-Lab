import { useEffect, useRef } from "react";
import "./landing.css";

const TITLE_WORDS = ["Full", "Chem", "AR", "Lab"];
const TAGLINE_WORDS = ["Build", "real", "chemistry", "with", "your", "hands."];
const STATS = ["27 molecules", "6 reactions", "Hand-tracked AR"];

// Element colors (CPK-inspired neon), matching the atoms inside the lab.
const ATOM_COLORS = ["#e8f6ff", "#ff4d4d", "#aeb6c2", "#4d7dff", "#ffe14d", "#3dff8f", "#67e8f9"];

// How long the exit burst + warp lasts before the lab takes over.
export const LANDING_EXIT_MS = 1150;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// [extra stroke width px, share of the glow color's alpha], widest first.
const RING_GLOW_LAYERS = [
  [30, 0.12],
  [18, 0.2],
  [8, 0.32],
];

const glowSpriteCache = new Map();
const GLOW_SPRITE_SIZE = 64;

// Radial glow (center at 55% alpha fading to 0), rendered once per color.
const getGlowSprite = ({ r, g, b }) => {
  const key = `${r},${g},${b}`;
  let sprite = glowSpriteCache.get(key);

  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = GLOW_SPRITE_SIZE;
    sprite.height = GLOW_SPRITE_SIZE;
    const spriteContext = sprite.getContext("2d");
    const half = GLOW_SPRITE_SIZE / 2;
    const gradient = spriteContext.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
    glowSpriteCache.set(key, sprite);
  }

  return sprite;
};

const hexToRgb = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

// Drifting "atoms" that bond (draw a link) when they pass close to each
// other. On exit, everything warps outward and a spark burst fires from the
// Enter button.
function useAtomField(canvasRef, exitingRef, burstOriginRef) {
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    const reducedMotion = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frameId = 0;
    let lastTime = performance.now();
    let exitStartedAt = null;
    const pointer = { x: -9999, y: -9999 };
    let atoms = [];
    let sparks = [];
    let rings = [];

    const makeAtom = () => {
      const color = ATOM_COLORS[Math.floor(Math.random() * ATOM_COLORS.length)];
      const depth = 0.35 + Math.random() * 0.65;

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 14 * depth,
        vy: (Math.random() - 0.5) * 14 * depth,
        radius: (1.9 + Math.random() * 2.8) * depth,
        depth,
        rgb: hexToRgb(color),
        phase: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.round(Math.min(130, Math.max(55, (width * height) / 10500)));

      while (atoms.length < targetCount) {
        atoms.push(makeAtom());
      }

      atoms.length = targetCount;
    };

    const startBurst = () => {
      const origin = burstOriginRef.current ?? { x: width / 2, y: height / 2 };
      exitStartedAt = performance.now();

      for (let index = 0; index < 90; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 260 + Math.random() * 720;
        const color = ATOM_COLORS[Math.floor(Math.random() * ATOM_COLORS.length)];

        sparks.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.55 + Math.random() * 0.6,
          radius: 1.4 + Math.random() * 2.8,
          rgb: hexToRgb(color),
        });
      }

      rings = [0, 0.12, 0.26].map((delay, index) => ({
        x: origin.x,
        y: origin.y,
        delay,
        life: 0,
        rgb: hexToRgb(["#67e8f9", "#a78bfa", "#f0abfc"][index]),
      }));
    };

    const draw = (time) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      if (exitingRef.current && exitStartedAt === null) {
        startBurst();
      }

      const exitProgress =
        exitStartedAt === null ? 0 : Math.min(1, (time - exitStartedAt) / LANDING_EXIT_MS);
      const centerX = width / 2;
      const centerY = height / 2;

      context.clearRect(0, 0, width, height);

      // Ambient atoms: drift, gently avoid the pointer, warp outward on exit.
      for (const atom of atoms) {
        if (exitProgress > 0) {
          const dx = atom.x - centerX;
          const dy = atom.y - centerY;
          const distance = Math.hypot(dx, dy) || 1;
          const warp = 900 * exitProgress * exitProgress * atom.depth;
          atom.vx += (dx / distance) * warp * dt;
          atom.vy += (dy / distance) * warp * dt;
        } else {
          const dx = atom.x - pointer.x;
          const dy = atom.y - pointer.y;
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < 140 * 140 && distanceSq > 1) {
            const push = (1 - Math.sqrt(distanceSq) / 140) * 60 * dt;
            atom.vx += (dx / Math.sqrt(distanceSq)) * push * 6;
            atom.vy += (dy / Math.sqrt(distanceSq)) * push * 6;
          }

          // Ease back toward a calm drift speed.
          const speed = Math.hypot(atom.vx, atom.vy);
          const calm = 9 * atom.depth;

          if (speed > calm) {
            atom.vx *= 1 - 1.2 * dt;
            atom.vy *= 1 - 1.2 * dt;
          }
        }

        atom.x += atom.vx * dt;
        atom.y += atom.vy * dt;

        if (exitProgress === 0) {
          if (atom.x < -20) atom.x = width + 20;
          if (atom.x > width + 20) atom.x = -20;
          if (atom.y < -20) atom.y = height + 20;
          if (atom.y > height + 20) atom.y = -20;
        }
      }

      // Bonds between nearby atoms.
      const linkDistance = Math.min(150, Math.max(90, width / 11));
      context.lineWidth = 1;

      for (let i = 0; i < atoms.length; i += 1) {
        const a = atoms[i];

        for (let j = i + 1; j < atoms.length; j += 1) {
          const b = atoms[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;

          if (Math.abs(dx) > linkDistance || Math.abs(dy) > linkDistance) {
            continue;
          }

          const distance = Math.hypot(dx, dy);

          if (distance > linkDistance) {
            continue;
          }

          const alpha = (1 - distance / linkDistance) * 0.28 * Math.min(a.depth, b.depth) * (1 - exitProgress);
          const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
          gradient.addColorStop(0, `rgba(${a.rgb.r}, ${a.rgb.g}, ${a.rgb.b}, ${alpha})`);
          gradient.addColorStop(1, `rgba(${b.rgb.r}, ${b.rgb.g}, ${b.rgb.b}, ${alpha})`);
          context.strokeStyle = gradient;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }

      // Atoms with a soft glow; streak into lines while warping.
      for (const atom of atoms) {
        const twinkle = 0.75 + Math.sin(time / 900 + atom.phase) * 0.25;
        const { r, g, b } = atom.rgb;
        const alpha = (0.35 + atom.depth * 0.55) * twinkle * (1 - exitProgress * 0.85);

        if (exitProgress > 0.02) {
          context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          context.lineWidth = atom.radius * 1.2;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(atom.x, atom.y);
          context.lineTo(atom.x - atom.vx * 0.05, atom.y - atom.vy * 0.05);
          context.stroke();
          continue;
        }

        // Same radial glow as before, drawn from a cached per-color sprite
        // instead of building a new gradient for every atom every frame.
        const glowRadius = atom.radius * 5;
        context.globalAlpha = alpha;
        context.drawImage(
          getGlowSprite(atom.rgb),
          atom.x - glowRadius,
          atom.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );
        context.globalAlpha = 1;

        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha + 0.2)})`;
        context.beginPath();
        context.arc(atom.x, atom.y, atom.radius, 0, Math.PI * 2);
        context.fill();
      }

      // Shockwave rings from the Enter button.
      for (const ring of rings) {
        ring.life += dt;
        const t = (ring.life - ring.delay) / 0.9;

        if (t <= 0 || t >= 1) {
          continue;
        }

        const eased = 1 - (1 - t) ** 3;
        const radius = eased * Math.hypot(width, height) * 0.55;
        const { r, g, b } = ring.rgb;
        const coreAlpha = (1 - t) * 0.7;
        const coreWidth = 2 + (1 - t) * 6;

        // Soft halo: widening translucent strokes under the core stroke give
        // the look of the old shadowBlur(24) glow at a fraction of the cost
        // (canvas shadow blur on a screen-sized ring was the slowest draw).
        context.beginPath();
        context.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
        for (const [extraWidth, glowShare] of RING_GLOW_LAYERS) {
          context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${coreAlpha * 0.8 * glowShare})`;
          context.lineWidth = coreWidth + extraWidth;
          context.stroke();
        }
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${coreAlpha})`;
        context.lineWidth = coreWidth;
        context.stroke();
      }

      // Spark burst.
      sparks = sparks.filter((spark) => spark.life < spark.maxLife);

      for (const spark of sparks) {
        spark.life += dt;
        spark.vx *= 1 - 1.6 * dt;
        spark.vy *= 1 - 1.6 * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        const fade = 1 - spark.life / spark.maxLife;
        const { r, g, b } = spark.rgb;
        context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fade})`;
        context.lineWidth = spark.radius * fade + 0.4;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(spark.x, spark.y);
        context.lineTo(spark.x - spark.vx * 0.035, spark.y - spark.vy * 0.035);
        context.stroke();
      }

      if (!reducedMotion || exitingRef.current) {
        frameId = requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    resize();
    frameId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    // Reduced motion draws one still frame; the exit still needs to render.
    const exitWatcher = reducedMotion
      ? window.setInterval(() => {
          if (exitingRef.current && exitStartedAt === null) {
            frameId = requestAnimationFrame(draw);
          }
        }, 60)
      : null;

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);

      if (exitWatcher) {
        window.clearInterval(exitWatcher);
      }
    };
  }, [canvasRef, exitingRef, burstOriginRef]);
}

// Deterministic per-letter scatter direction for the exit animation.
const scatterFor = (index, total) => {
  const angle = ((index + 0.5) / total) * Math.PI * 2 + index * 1.7;
  const distance = 90 + ((index * 53) % 70);
  return {
    "--dx": `${Math.cos(angle) * distance}px`,
    "--dy": `${Math.sin(angle) * distance - 30}px`,
    "--rot": `${((index * 37) % 50) - 25}deg`,
  };
};

export default function Landing({ exiting, onEnter }) {
  const canvasRef = useRef(null);
  const exitingRef = useRef(exiting);
  const burstOriginRef = useRef(null);
  const totalLetters = TITLE_WORDS.join("").length;
  let letterIndex = 0;

  useEffect(() => {
    exitingRef.current = exiting;
  }, [exiting]);
  useAtomField(canvasRef, exitingRef, burstOriginRef);

  const handleEnter = (event) => {
    if (exiting) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    burstOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    exitingRef.current = true;
    onEnter();
  };

  return (
    <div className={`landing-overlay${exiting ? " is-exiting" : ""}`}>
      <canvas ref={canvasRef} className="landing-canvas" aria-hidden="true" />
      <div className="landing-vignette" aria-hidden="true" />
      <div className="landing-flash" aria-hidden="true" />
      <div className="landing-content">
        <div className="landing-emblem" aria-hidden="true">
          <svg width="128" height="128" viewBox="0 0 120 120">
            <defs>
              <radialGradient id="landingNucleus" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#ecfeff" />
                <stop offset="45%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </radialGradient>
              <filter id="landingGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g className="landing-emblem-orbits" filter="url(#landingGlow)">
              {[
                { rotate: -30, color: "#ffd166", dur: "3.2s" },
                { rotate: 30, color: "#ff6b81", dur: "4.1s" },
                { rotate: 90, color: "#7cff9b", dur: "3.6s" },
              ].map(({ rotate, color, dur }) => (
                <g key={rotate} transform={`rotate(${rotate} 60 60)`}>
                  <ellipse
                    cx="60"
                    cy="60"
                    rx="52"
                    ry="20"
                    fill="none"
                    stroke="rgba(103, 232, 249, 0.55)"
                    strokeWidth="1.6"
                  />
                  <circle r="4.6" fill={color}>
                    <animateMotion
                      dur={dur}
                      repeatCount="indefinite"
                      path="M8,60 a52,20 0 1,0 104,0 a52,20 0 1,0 -104,0"
                    />
                  </circle>
                </g>
              ))}
            </g>
            <circle className="landing-nucleus-halo" cx="60" cy="60" r="22" fill="rgba(56, 189, 248, 0.22)" />
            <circle cx="60" cy="60" r="13" fill="url(#landingNucleus)" filter="url(#landingGlow)" />
            <circle cx="55.5" cy="55.5" r="3.4" fill="#f0fdff" opacity="0.9" />
          </svg>
        </div>

        <h1 className="landing-title" aria-label="Full Chem AR Lab">
          {TITLE_WORDS.map((word) => (
            <span key={word} className="landing-word" aria-hidden="true">
              {[...word].map((letter) => {
                const index = letterIndex;
                letterIndex += 1;

                return (
                  <span
                    key={index}
                    className="landing-letter"
                    style={{ "--i": index, ...scatterFor(index, totalLetters) }}
                  >
                    {letter}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        <p className="landing-tagline">
          {TAGLINE_WORDS.map((word, index) => (
            <span key={word} className="landing-tagline-word" style={{ "--i": index }}>
              {word}
            </span>
          ))}
        </p>

        <div className="landing-stats">
          {STATS.map((stat, index) => (
            <span key={stat} className="landing-stat" style={{ "--i": index }}>
              {stat}
            </span>
          ))}
        </div>

        <button type="button" className="landing-enter-button" onClick={handleEnter}>
          <span className="landing-enter-label">Enter the Lab</span>
          <span className="landing-enter-arrow" aria-hidden="true">→</span>
        </button>

        <p className="landing-note">
          Uses your camera for hand tracking. The feed stays on your device and is never recorded
          or uploaded. No camera? Everything also works by touch or mouse.
        </p>
      </div>
    </div>
  );
}
