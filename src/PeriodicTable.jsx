import { useState } from "react";

// One soft color per element family (instead of a different neon per
// element), so related elements read as a group. The f-block rows use pale
// gradients to set them apart from the main table.
const PERIODIC_CATEGORIES = {
  "alkali-metal": { label: "Alkali metals", color: "255, 143, 143" },
  "alkaline-earth-metal": { label: "Alkaline earth metals", color: "255, 190, 118" },
  "transition-metal": { label: "Transition metals", color: "130, 180, 255" },
  "post-transition-metal": { label: "Post-transition metals", color: "167, 182, 201" },
  metalloid: { label: "Metalloids", color: "95, 212, 196" },
  nonmetal: { label: "Nonmetals", color: "166, 227, 106" },
  halogen: { label: "Halogens", color: "243, 223, 99" },
  "noble-gas": { label: "Noble gases", color: "111, 227, 247" },
  lanthanide: {
    label: "Lanthanides",
    color: "255, 196, 226",
    gradient: "linear-gradient(135deg, rgba(255, 170, 214, 0.42) 0%, rgba(255, 255, 255, 0.16) 100%)",
  },
  actinide: {
    label: "Actinides",
    color: "205, 188, 255",
    gradient: "linear-gradient(135deg, rgba(186, 156, 255, 0.42) 0%, rgba(255, 255, 255, 0.16) 100%)",
  },
};

const getCellStyle = (category) => {
  const style = PERIODIC_CATEGORIES[category] ?? PERIODIC_CATEGORIES.nonmetal;

  return {
    "--pt-color": `rgb(${style.color})`,
    background: style.gradient ?? `rgba(${style.color}, 0.13)`,
    borderColor: `rgba(${style.color}, ${style.gradient ? 0.6 : 0.5})`,
  };
};

const MAX_RIPPLES_PER_CELL = 3;

// A small ripple in the cell's family color, spreading from where it was
// pressed (keyboard presses ripple from the center). Plain DOM, outside
// React: no re-render, only transform/opacity animate, and each ripple
// removes itself when its animation ends.
const spawnCellRipple = (event) => {
  const cell = event.currentTarget;
  const layer = cell.querySelector(".pt-ripple-layer");

  if (!layer) {
    return;
  }

  const rect = cell.getBoundingClientRect();
  const fromKeyboard = event.detail === 0;
  const x = fromKeyboard ? rect.width / 2 : event.clientX - rect.left;
  const y = fromKeyboard ? rect.height / 2 : event.clientY - rect.top;
  // Big enough to reach the far corner from wherever the press landed.
  const diameter =
    2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

  while (layer.childElementCount >= MAX_RIPPLES_PER_CELL) {
    layer.firstElementChild.remove();
  }

  const ripple = document.createElement("span");
  ripple.className = "pt-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;

  const remove = () => ripple.remove();
  ripple.addEventListener("animationend", remove, { once: true });
  // Fallback in case the animation never runs (e.g. a hidden tab).
  window.setTimeout(remove, 900);
  layer.appendChild(ripple);
};

// Placeholders in group 3 that point down to the f-block rows.
const F_BLOCK_MARKERS = [
  { row: 6, category: "lanthanide", label: "57–71" },
  { row: 7, category: "actinide", label: "89–103" },
];

export default function PeriodicTable({ elements, onSpawn, variant }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className={`pt-wrap pt-${variant}`}>
      <div className="pt-header">
        <span className="pt-title">Periodic table</span>
        <span className="pt-readout" aria-live="polite">
          {hovered ? (
            <>
              <strong>{hovered.symbol}</strong> {hovered.name} · {hovered.number}
            </>
          ) : (
            "Tap an element to spawn it"
          )}
        </span>
      </div>
      <div className="pt-grid" onPointerLeave={() => setHovered(null)}>
        {elements.map((element) => (
          <button
            key={element.symbol}
            type="button"
            className={`pt-cell${element.isFBlock ? " pt-fblock" : ""}${
              element.isFBlock && element.row === 9 ? " pt-fblock-first" : ""
            }`}
            onClick={(event) => {
              // Spawn first; the ripple is purely decorative.
              onSpawn(element.symbol);
              spawnCellRipple(event);
            }}
            onPointerEnter={() => setHovered(element)}
            onFocus={() => setHovered(element)}
            title={`${element.name} (${element.number})`}
            aria-label={`Spawn ${element.name}`}
            style={{
              gridColumn: element.col,
              gridRow: element.row,
              ...getCellStyle(element.category),
            }}
          >
            <span className="pt-ripple-layer" aria-hidden="true" />
            <span className="pt-number">{element.number}</span>
            <span className="pt-symbol">{element.symbol}</span>
          </button>
        ))}
        {F_BLOCK_MARKERS.map((marker) => (
          <div
            key={marker.label}
            className="pt-marker"
            aria-hidden="true"
            style={{ gridColumn: 3, gridRow: marker.row, ...getCellStyle(marker.category) }}
          >
            {marker.label}
          </div>
        ))}
      </div>
      <div className="pt-legend">
        {Object.entries(PERIODIC_CATEGORIES).map(([key, category]) => (
          <span key={key} className="pt-legend-item">
            <span className="pt-legend-swatch" style={getCellStyle(key)} />
            {category.label}
          </span>
        ))}
      </div>
    </div>
  );
}
