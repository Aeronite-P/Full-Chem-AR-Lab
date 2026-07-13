# Chem AR Lab

**Chem AR Lab** is a camera-based augmented-reality chemistry sandbox. It uses your webcam and hand tracking to let you grab, move, and bond atoms in the air — building real molecules with your hands, no headset or lab equipment required.

## ▶️ Try it now (no download)

**[Launch Chem AR Lab →](https://aeronite-p.github.io/Full-Chem-AR-Lab/)**

Just click the link and it runs in your browser. Your browser will ask for camera permission the first time — that's needed for hand tracking.

> 🔒 **Camera note:** The app needs webcam access to track your hands. The camera feed stays on your device — it is used only for real-time interaction and is **never recorded or uploaded.** Works best in Chrome on a laptop/desktop with decent lighting.

> 💡 No camera, or hand tracking not cooperating? You can also drag atoms with your **mouse** — every gesture below has a mouse equivalent.

## What it does

- **Hand-tracked interaction** — pinch your thumb and finger to grab an atom, move your hand to drag it, release to drop.
- **Multi-hand support** — tracks up to 6 hands at once, so multiple people can interact at the same time.
- **Touch & mobile support** — atoms and molecules can be dragged by touch, the full HUD works on small screens, and the app falls back to a touch-only sandbox if the camera is unavailable.
- **Neon grab ripples** — grabbing an atom ripples in that atom's color; grabbing a molecule ripples in the blended color of all of its atoms.
- **Formation glow** — molecules form with a glowing burst of expanding rings, bloom, and sparks in the molecule's mixed color.
- **Polished visuals** — atoms have neon auras, rim lighting, and specular highlights; bonds render as color-gradient sticks with depth and glow.
- **27 discoverable species** — from H₂ to sulfur dioxide, ozone, hydrogen peroxide, the ethane/ethene/ethyne family, methanol, and ionic compounds (NaCl, NaOH, Na₂O) with charge-tinted ions.
- **A real reaction system** — bring reactants together and the lab offers the reaction, conserving every atom: burn methane (CH₄ + 2O₂ → CO₂ + 2H₂O), neutralize hydronium with hydroxide, drop sodium into water (2Na + 2H₂O → 2NaOH + H₂), make acid rain (SO₂ + H₂O → H₂SO₃), and watch NH₃ + HCl form ammonium chloride — each with an energy-colored burst.
- **Optional tutorial** — a first-visit walkthrough that teaches moving, spawning, and bonding by building water (skippable, restartable from the left panel).
- **Discovery quests** — every species starts as "???" in the Discoveries list; build it to check it off, with a "Molecule discovered!" animation and a celebration when you find them all.
- **Molecule inspector** — hover or grab any molecule to see its name, molar mass, shape, bond angle, polarity, and a fun fact.
- **Polarity overlay** — toggle dipole arrows drawn on polar covalent bonds (based on real electronegativity differences).
- **Soft sound effects** — quiet synthesized chimes on formation and discovery (toggleable).
- **Spawn atoms** from a menu: Hydrogen (H), Oxygen (O), Carbon (C), and Nitrogen (N).
- **Bonding Mode** — draw covalent bonds between atoms (single, double, triple), with realistic bond limits per element.
- **Build real molecules** — when the right atoms come together the app offers to snap them into a molecule:
  - Water (H₂O), Hydrogen gas (H₂), Oxygen gas (O₂), Nitrogen gas (N₂)
  - Carbon monoxide (CO), Carbon dioxide (CO₂)
  - Ammonia (NH₃), Methane (CH₄)
- **Hydrogen bonding** — bring two water molecules close and watch the hydrogen bond form (glowing pink), snapping them into a water cluster (2H₂O).
- **Reactions** — bring water (H₂O) and carbon dioxide (CO₂) together to form carbonic acid (H₂CO₃).
- **Atom inspector** — select an atom to see its atomic number, valence electrons, and common bond count.
- **Atomic expansion view** — pull an atom apart to peek inside at its protons, neutrons, and electron shells.
- **Lone pairs** — toggle on to show lone electron pairs on molecules.
- **Adjustable atom size** and a water "orb" visual mode for cleaner views.

## Controls & shortcuts

| Action | How |
|---|---|
| Open / close the atom menu | **M** key, or the menu button |
| Toggle Delete Mode | Menu → **Delete Mode** |
| Toggle Bonding Mode | Menu → **Bonding Mode** |
| Spawn an atom | Menu → Hydrogen / Oxygen / Carbon / Nitrogen |
| Grab & move an atom | Pinch over it (or click-drag with mouse) |
| Inspect an atom | Select it — details appear in the panel |
| Toggle a water molecule's orb visual | **W** key, or the water toggle button |
| Exit atomic-expansion view | **Esc** |
| Show lone pairs | **Show Lone Pairs** toggle |

## Why I built this

I wanted to make chemistry feel physical and interactive — to help people *see* atoms, bonding, and molecule formation in a hands-on way — using nothing but a webcam and a browser.

## Tech stack

- **React 19** + **Vite**
- **MediaPipe Tasks Vision** (hand landmark tracking)
- **Canvas** overlay rendering for atoms, bonds, and effects

---

## Running it locally (for developers)

You don't need this to *use* the app — just click the [live link](https://aeronite-p.github.io/Full-Chem-AR-Lab/). This section is only if you want to modify the code.

```bash
# clone the repo
git clone https://github.com/Aeronite-P/Full-Chem-AR-Lab.git
cd Full-Chem-AR-Lab

# install dependencies
npm install

# start the dev server (opens at http://localhost:5173)
npm run dev
```

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

### Deployment

The live site is hosted on **GitHub Pages** and deploys automatically: every push to `main` triggers a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the app and publishes it. No manual steps needed.
