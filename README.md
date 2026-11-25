# Full Chem AR Lab

**Full Chem AR Lab** is a camera-based augmented-reality chemistry sandbox. It uses your webcam and hand tracking to let you grab, move, and bond atoms in the air — building real molecules with your hands, no headset or lab equipment required.

## ▶️ Try it now (no download)

**[Launch Full Chem AR Lab →](https://aeronite-p.github.io/Full-Chem-AR-Lab/)**

Just click the link and it runs in your browser. Your browser will ask for camera permission the first time — that's needed for hand tracking.

> 🔒 **Camera note:** The app needs webcam access to track your hands. The camera feed stays on your device — it is used only for real-time interaction and is **never recorded or uploaded.** Works best in Chrome on a laptop/desktop with decent lighting.

> 💡 No camera, or hand tracking not cooperating? You can also drag atoms with your **mouse** — every gesture below has a mouse equivalent.

## What it does

- **Hand-tracked interaction** — pinch your thumb and finger to grab an atom, move your hand to drag it, release to drop.
- **Multi-hand support** — tracks up to 6 hands at once (3 on phones), so multiple people can interact at the same time.
- **Touch & mobile support** — atoms and molecules can be dragged by touch or mouse, the full HUD works on small screens, and the lab runs as a touch-only sandbox while the camera is starting or if it's unavailable.
- **All 118 elements** — the atom menu is a full periodic table. Every element can be spawned and inspected (standard atomic weight, the isotope shown, electron configuration, Pauling electronegativity, valence electrons).
- **Honest bonding model** — bond limits are counted in bond order. Nonmetals and metalloids bond covalently up to their common valence; N and O take one extra bond only from hydrogen (NH₄⁺, H₃O⁺). Elements from the third row down get a higher limit only with partners that really allow it, each backed by a real compound: S 6 with F/O (SF₆, H₂SO₄), P 5 with F/Cl/O (PCl₅, H₃PO₄), Cl 3 with F (ClF₃), I 7 with F (IF₇), Xe 6 with F/O (XeF₄, XeO₃), Kr 2 with F (KrF₂) — so SH₆, SCl₆, NCl₅ and OF₄ are refused with an explanation. Alkali and alkaline-earth metals only bond ionically to halides, oxide or sulfide (dashed links); He, Ne and Ar don't bond; transition metals and other heavy elements can be spawned and inspected but don't bond in the lab.
- **89 discoverable species**, grouped in the Discoveries list: covalent molecules (halogens, hydrogen halides, hydrides, halogenated carbon and silicon, boron and phosphorus halides, organic acids and alcohols), expanded octets with their textbook VSEPR shapes (see-saw SF₄, T-shaped ClF₃, square planar XeF₄, square pyramidal IF₅, trigonal bipyramidal PCl₅, octahedral SF₆, pentagonal bipyramidal IF₇, SO₃, H₂SO₄, H₃PO₄), noble-gas compounds (XeF₂, XeF₄, XeO₃, KrF₂), ions, ionic compounds with the right ratios (MgCl₂, Na₂O, CaF₂, …), radicals (NO, NO₂) and a network solid (SiO₂).
- **Build real molecules** — when the right atoms are bonded together the app offers to snap them into the molecule's real shape. Isomers with the same formula (ethanol / dimethyl ether, butane / isobutane) are told apart by which atoms are bonded to which. SO₂, O₃, NO₂ and nitric acid are drawn as resonance hybrids; radicals show their unpaired electron; SiO₂ is shown as one formula unit of a network solid.
- **Six atom-conserving reactions** — bring reactants together and the lab offers the reaction, rebuilding the products from the exact atoms of the reactants: methane combustion (CH₄ + 2O₂ → CO₂ + 2H₂O, needs heat), neutralization (H₃O⁺ + OH⁻ → 2H₂O), sodium in water (2Na + 2H₂O → 2NaOH + H₂), acid rain (SO₂ + H₂O → H₂SO₃), carbonic acid (CO₂ + H₂O → H₂CO₃) and ammonium chloride (NH₃ + HCl → NH₄Cl). Each shows an energy diagram with its approximate ΔH and bursts in warm colors (energy released) or cool colors (energy absorbed).
- **Temperature & equilibrium** — a lab thermostat drives thermal motion, weakens hydrogen bonds as it heats, ignites combustion, and speeds up the decomposition of unstable species (H₂CO₃, H₂SO₃, and NH₄Cl when hot).
- **pH meter** — a qualitative estimate of how acidic or basic the lab is, from the acids and bases on screen.
- **Hydrogen bonding** — bring two water molecules close and watch the hydrogen bond form (glowing pink), snapping them into a water dimer (2H₂O).
- **Atomic expansion view** — pull an atom apart with two hands to see inside: every electron shell with its real ground-state electron count (e.g. chromium 2·8·13·1), the outer shell highlighted, the electron configuration, and the nucleus (a representative cluster for heavy atoms, with the true proton and neutron counts). It's labelled as a simplified shell (Bohr) model.
- **Inspectors** — select an atom for its element data; hover or grab a molecule for its name, molar mass, shape, bond angle, polarity, and a fun fact.
- **Display toggles** — lone pairs, polarity (dipole arrows), Lewis structure view, hand-tracking dots, and sound effects.
- **Neon visuals** — grab ripples in each atom's color, glowing formation bursts, gradient bond sticks, and a water "orb" visual mode.
- **Optional tutorial, discovery quests, lab notebook, presentation mode and Reset Lab.**

## Controls & shortcuts

| Action | How |
|---|---|
| Open / close the atom menu | **M** key, or the menu button |
| Spawn an atom | Menu → tap any element in the periodic table |
| Toggle Bonding Mode | Menu → **Bonding Mode**, then drag from one atom to another |
| Toggle Delete Mode | Menu → **Delete Mode** |
| Grab & move an atom or molecule | Pinch over it (or click/touch and drag) |
| Inspect an atom | Select it — details appear in the panel |
| Open the atomic expansion view | Pinch one loose atom with both hands and pull them apart |
| Exit atomic-expansion view | Squeeze the outer shell with both hands, or **Esc** |
| Toggle a water molecule's orb visual | **W** key while hovering or holding a water molecule |
| Presentation mode | **P** key, or the Presentation Mode button |

## Where the numbers come from

- Standard atomic weights: IUPAC/CIAAW abridged values. Isotopes: NIST Atomic Weights and Isotopic Compositions.
- Electron configurations: NIST Atomic Spectra Database ground states (cross-checked against PubChem; configurations for elements 104–118 are theoretical predictions).
- Electronegativities: Pauling scale (PubChem). Bond angles: standard experimental values. Reaction enthalpies: standard enthalpies of formation.
- Simplifications are labelled in the app: the shell model, the 100 °C ignition threshold, slowed-down decomposition half-lives, and the pH estimate.

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
