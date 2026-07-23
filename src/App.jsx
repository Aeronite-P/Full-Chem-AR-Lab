import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const ATOM_DETAILS = {
  H: {
    name: "Hydrogen",
    symbol: "H",
    atomicNumber: 1,
    neutrons: 0,
    valenceElectrons: 1,
    commonBonds: 1,
  },
  O: {
    name: "Oxygen",
    symbol: "O",
    atomicNumber: 8,
    neutrons: 8,
    valenceElectrons: 6,
    commonBonds: 2,
  },
  C: {
    name: "Carbon",
    symbol: "C",
    atomicNumber: 6,
    neutrons: 6,
    valenceElectrons: 4,
    commonBonds: 4,
  },
  N: {
    name: "Nitrogen",
    symbol: "N",
    atomicNumber: 7,
    neutrons: 7,
    valenceElectrons: 5,
    commonBonds: 3,
  },
  Cl: {
    name: "Chlorine",
    symbol: "Cl",
    atomicNumber: 17,
    neutrons: 18,
    valenceElectrons: 7,
    commonBonds: 1,
  },
  Na: {
    name: "Sodium",
    symbol: "Na",
    atomicNumber: 11,
    neutrons: 12,
    valenceElectrons: 1,
    commonBonds: 1,
  },
  S: {
    name: "Sulfur",
    symbol: "S",
    atomicNumber: 16,
    neutrons: 16,
    valenceElectrons: 6,
    commonBonds: 2,
  },
};

// Pauling electronegativities — used for the polarity (dipole arrow) overlay.
const ELECTRONEGATIVITY = {
  H: 2.2,
  C: 2.55,
  N: 3.04,
  O: 3.44,
  S: 2.58,
  Cl: 3.16,
  Na: 0.93,
};

// Bonds with ΔEN below this read as nonpolar; above the ionic cutoff the
// electron transfers outright (drawn as a dashed ionic link instead).
const POLAR_BOND_MIN_EN_DIFF = 0.4;
const IONIC_BOND_EN_DIFF = 1.8;

const createAtom = (id, type, position, moleculeId = null) => ({
  id,
  type,
  position,
  moleculeId,
});

const createBondRecord = (
  atomId1,
  atomId2,
  type = "single",
  category = "covalent"
) => ({
  atomId1,
  atomId2,
  type,
  category,
});

const getBondAtomIds = (bond) => [bond.atomId1, bond.atomId2];

const WATER_ORB_DIAMETER_PX = 76;
const WATER_ORB_RADIUS_PX = WATER_ORB_DIAMETER_PX / 2;
const WATER_HYDROGEN_BOND_RANGE_PX = 120;
const WATER_HYDROGEN_BOND_TARGET_PX = 96;
const WATER_HYDROGEN_BOND_MIN_PX = 64;
const CARBONIC_ACID_REACTION_RANGE_PX = 126;
const ATOMIC_EXPANSION_TRIGGER_DELTA_PX = 110;
const ATOMIC_EXPANSION_ENTRY_DURATION_MS = 560;
const ATOMIC_EXPANSION_COLLAPSE_TRIGGER_DELTA_PX = 90;
const ATOMIC_EXPANSION_COLLAPSE_ANIMATION_MS = 220;
const ATOMIC_EXPANSION_MODEL_MAX_SIZE_PX = 520;
const BASE_ATOM_RADIUS_PX = 24;
const BASE_ATOM_BOND_HIT_RADIUS_PX = 42;
const BASE_ATOM_GRAB_RADIUS_PX = 50;
const BASE_MOLECULE_HIT_RADIUS_PX = 42;
const HYDROGEN_BOND_NEON_PINK = "#ff4fd8";
const HYDROGEN_BOND_GLOW = "rgba(255, 79, 216, 0.7)";
const LONE_PAIR_DOT_COLOR = "rgba(204, 247, 255, 0.92)";
const LONE_PAIR_DOT_GLOW = "rgba(125, 232, 255, 0.34)";
const COVALENT_BOND_ORDER = {
  single: 1,
  double: 2,
  triple: 3,
};

// Neon accent color per atom type — used for grab ripples, auras, and bond gradients.
const ATOM_NEON_COLORS = {
  H: "#e8f6ff",
  O: "#ff4d4d",
  C: "#aeb6c2",
  N: "#4d7dff",
  Cl: "#3dff8f",
  Na: "#c95bff",
  S: "#ffe14d",
};

const hexToRgb = (hex) => {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToCss = ({ r, g, b }, alpha = 1) =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;

const getAtomNeonRgb = (atomType) => hexToRgb(ATOM_NEON_COLORS[atomType] ?? ATOM_NEON_COLORS.C);

// "Mix" the neon colors of a set of atoms (average RGB) — a molecule ripples in
// the blend of all of its atoms' colors.
const getMixedNeonRgb = (atomTypes) => {
  if (!atomTypes || atomTypes.length === 0) {
    return getAtomNeonRgb("C");
  }

  const total = atomTypes.reduce(
    (sum, atomType) => {
      const rgb = getAtomNeonRgb(atomType);
      return { r: sum.r + rgb.r, g: sum.g + rgb.g, b: sum.b + rgb.b };
    },
    { r: 0, g: 0, b: 0 }
  );

  return {
    r: total.r / atomTypes.length,
    g: total.g / atomTypes.length,
    b: total.b / atomTypes.length,
  };
};

const GRAB_RIPPLE_DURATION_MS = 720;
const GRAB_RIPPLE_REPEAT_MS = 640;
const FORMATION_EFFECT_DURATION_MS = 1050;
const FORMATION_SPARK_COUNT = 14;

// Ion / charge visuals: cations glow warm amber, anions glow cool cyan-blue.
const POSITIVE_CHARGE_RGB = { r: 255, g: 170, b: 64 };
const NEGATIVE_CHARGE_RGB = { r: 90, g: 200, b: 255 };

const DISCOVERABLE_MOLECULES = [
  { formula: "H2", label: "H₂ — Hydrogen gas" },
  { formula: "O2", label: "O₂ — Oxygen gas" },
  { formula: "N2", label: "N₂ — Nitrogen gas" },
  { formula: "H2O", label: "H₂O — Water" },
  { formula: "CO", label: "CO — Carbon monoxide" },
  { formula: "CO2", label: "CO₂ — Carbon dioxide" },
  { formula: "NH3", label: "NH₃ — Ammonia" },
  { formula: "CH4", label: "CH₄ — Methane" },
  { formula: "H2CO3", label: "H₂CO₃ — Carbonic acid" },
  { formula: "2H2O", label: "2H₂O — Water dimer" },
  { formula: "H3O+", label: "H₃O⁺ — Hydronium" },
  { formula: "NH4+", label: "NH₄⁺ — Ammonium" },
  { formula: "NaCl", label: "NaCl — Table salt" },
  { formula: "HCl", label: "HCl — Hydrogen chloride" },
  { formula: "OH-", label: "OH⁻ — Hydroxide" },
  { formula: "H2O2", label: "H₂O₂ — Hydrogen peroxide" },
  { formula: "O3", label: "O₃ — Ozone" },
  { formula: "C2H6", label: "C₂H₆ — Ethane" },
  { formula: "C2H4", label: "C₂H₄ — Ethene" },
  { formula: "C2H2", label: "C₂H₂ — Ethyne" },
  { formula: "CH3OH", label: "CH₃OH — Methanol" },
  { formula: "NaOH", label: "NaOH — Sodium hydroxide" },
  { formula: "Na2O", label: "Na₂O — Sodium oxide" },
  { formula: "SO2", label: "SO₂ — Sulfur dioxide" },
  { formula: "H2S", label: "H₂S — Hydrogen sulfide" },
  { formula: "NH4Cl", label: "NH₄Cl — Ammonium chloride (reaction!)" },
  { formula: "H2SO3", label: "H₂SO₃ — Sulfurous acid (reaction!)" },
];

// Data-driven molecule definitions. Legacy species (H2O, CO2, ...) keep their
// bespoke code paths; everything here is handled by one generic engine:
// detection by composition, prompt, bond normalization, snap layout, drawing,
// lone pairs (keyed by layout role index), and per-ion charges.
// Layout offsets are px relative to the role-0 anchor atom.
const GENERIC_MOLECULE_TEMPLATES = [
  {
    type: "hydrogenChloride",
    formula: "HCl",
    displayLabel: "HCl",
    composition: { H: 1, Cl: 1 },
    layout: [
      { type: "Cl", x: 0, y: 0 },
      { type: "H", x: -92, y: 0 },
    ],
    bonds: [{ a: 0, b: 1 }],
    lonePairs: { 0: 3 },
    prompt: "Would you like to make hydrogen chloride (HCl)?",
  },
  {
    type: "hydroxide",
    formula: "OH-",
    displayLabel: "OH⁻",
    charge: -1,
    composition: { O: 1, H: 1 },
    layout: [
      { type: "O", x: 0, y: 0 },
      { type: "H", x: 66, y: -30 },
    ],
    bonds: [{ a: 0, b: 1 }],
    lonePairs: { 0: 3 },
    prompt: "Form hydroxide (OH⁻)? This ion carries a −1 charge!",
  },
  {
    type: "hydrogenPeroxide",
    formula: "H2O2",
    displayLabel: "H2O2",
    composition: { O: 2, H: 2 },
    layout: [
      { type: "O", x: 0, y: 0 },
      { type: "O", x: 84, y: 0 },
      { type: "H", x: -46, y: -40 },
      { type: "H", x: 130, y: 40 },
    ],
    bonds: [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3 }],
    lonePairs: { 0: 2, 1: 2 },
    prompt: "Would you like to make hydrogen peroxide (H2O2)?",
  },
  {
    type: "ozone",
    formula: "O3",
    displayLabel: "O3",
    composition: { O: 3 },
    layout: [
      { type: "O", x: 0, y: 0 },
      { type: "O", x: -84, y: 38 },
      { type: "O", x: 84, y: 38 },
    ],
    bonds: [{ a: 0, b: 1, order: "double" }, { a: 0, b: 2 }],
    lonePairs: { 0: 1, 1: 2, 2: 3 },
    prompt: "Would you like to make ozone (O3)?",
  },
  {
    type: "ethane",
    formula: "C2H6",
    displayLabel: "C2H6",
    composition: { C: 2, H: 6 },
    layout: [
      { type: "C", x: 0, y: 0 },
      { type: "C", x: 96, y: 0 },
      { type: "H", x: -50, y: -50 },
      { type: "H", x: -70, y: 0 },
      { type: "H", x: -50, y: 50 },
      { type: "H", x: 146, y: -50 },
      { type: "H", x: 166, y: 0 },
      { type: "H", x: 146, y: 50 },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 0, b: 4 },
      { a: 1, b: 5 },
      { a: 1, b: 6 },
      { a: 1, b: 7 },
    ],
    prompt: "Would you like to make ethane (C2H6)?",
  },
  {
    type: "ethene",
    formula: "C2H4",
    displayLabel: "C2H4",
    composition: { C: 2, H: 4 },
    layout: [
      { type: "C", x: 0, y: 0 },
      { type: "C", x: 96, y: 0 },
      { type: "H", x: -48, y: -46 },
      { type: "H", x: -48, y: 46 },
      { type: "H", x: 144, y: -46 },
      { type: "H", x: 144, y: 46 },
    ],
    bonds: [
      { a: 0, b: 1, order: "double" },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 1, b: 4 },
      { a: 1, b: 5 },
    ],
    prompt: "Would you like to make ethene (C2H4)?",
  },
  {
    type: "ethyne",
    formula: "C2H2",
    displayLabel: "C2H2",
    composition: { C: 2, H: 2 },
    layout: [
      { type: "C", x: 0, y: 0 },
      { type: "C", x: 96, y: 0 },
      { type: "H", x: -84, y: 0 },
      { type: "H", x: 180, y: 0 },
    ],
    bonds: [
      { a: 0, b: 1, order: "triple" },
      { a: 0, b: 2 },
      { a: 1, b: 3 },
    ],
    prompt: "Would you like to make ethyne / acetylene (C2H2)?",
  },
  {
    type: "methanol",
    formula: "CH3OH",
    displayLabel: "CH3OH",
    composition: { C: 1, O: 1, H: 4 },
    layout: [
      { type: "C", x: 0, y: 0 },
      { type: "O", x: 92, y: -24 },
      { type: "H", x: -52, y: -48 },
      { type: "H", x: -72, y: 0 },
      { type: "H", x: -52, y: 48 },
      { type: "H", x: 150, y: -52 },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 0, b: 4 },
      { a: 1, b: 5 },
    ],
    lonePairs: { 1: 2 },
    prompt: "Would you like to make methanol (CH3OH)?",
  },
  {
    type: "sodiumHydroxide",
    formula: "NaOH",
    displayLabel: "NaOH",
    composition: { Na: 1, O: 1, H: 1 },
    layout: [
      { type: "Na", x: 0, y: 0 },
      { type: "O", x: 104, y: 0 },
      { type: "H", x: 162, y: -30 },
    ],
    bonds: [{ a: 0, b: 1, ionic: true }, { a: 1, b: 2 }],
    lonePairs: { 1: 3 },
    ionCharges: { 0: 1, 1: -1 },
    prompt: "Form sodium hydroxide (NaOH)? Na⁺ pairs with hydroxide — an ionic compound!",
  },
  {
    type: "sodiumOxide",
    formula: "Na2O",
    displayLabel: "Na2O",
    composition: { Na: 2, O: 1 },
    layout: [
      { type: "O", x: 0, y: 0 },
      { type: "Na", x: -104, y: 0 },
      { type: "Na", x: 104, y: 0 },
    ],
    bonds: [
      { a: 0, b: 1, ionic: true },
      { a: 0, b: 2, ionic: true },
    ],
    lonePairs: { 0: 4 },
    ionCharges: { 0: -2, 1: 1, 2: 1 },
    prompt: "Form sodium oxide (Na2O)? Two Na⁺ with one O²⁻ — an ionic compound!",
  },
  {
    type: "sulfurDioxide",
    formula: "SO2",
    displayLabel: "SO2",
    composition: { S: 1, O: 2 },
    layout: [
      { type: "S", x: 0, y: 0 },
      { type: "O", x: -84, y: 38 },
      { type: "O", x: 84, y: 38 },
    ],
    bonds: [{ a: 0, b: 1, order: "double" }, { a: 0, b: 2 }],
    lonePairs: { 0: 1, 1: 2, 2: 3 },
    prompt: "Would you like to make sulfur dioxide (SO2)?",
  },
  {
    type: "hydrogenSulfide",
    formula: "H2S",
    displayLabel: "H2S",
    composition: { S: 1, H: 2 },
    layout: [
      { type: "S", x: 0, y: 0 },
      { type: "H", x: -50, y: -46 },
      { type: "H", x: 50, y: -46 },
    ],
    bonds: [{ a: 0, b: 1 }, { a: 0, b: 2 }],
    lonePairs: { 0: 2 },
    prompt: "Would you like to make hydrogen sulfide (H2S)?",
  },
  // reactionOnly species can't be assembled by bonding raw atoms (their
  // central atom has no free bond slots) — they exist only as reaction
  // products, so the bond detector skips them.
  {
    type: "ammoniumChloride",
    formula: "NH4Cl",
    displayLabel: "NH4Cl",
    reactionOnly: true,
    composition: { N: 1, H: 4, Cl: 1 },
    layout: [
      { type: "N", x: 0, y: 0 },
      { type: "H", x: -52, y: -48 },
      { type: "H", x: 52, y: -48 },
      { type: "H", x: -52, y: 48 },
      { type: "H", x: 52, y: 48 },
      { type: "Cl", x: 150, y: 0 },
    ],
    bonds: [
      { a: 0, b: 1 },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 0, b: 4 },
      { a: 0, b: 5, ionic: true },
    ],
    lonePairs: { 5: 4 },
    ionCharges: { 0: 1, 5: -1 },
  },
  {
    type: "sulfurousAcid",
    formula: "H2SO3",
    displayLabel: "H2SO3",
    reactionOnly: true,
    composition: { S: 1, O: 3, H: 2 },
    layout: [
      { type: "S", x: 0, y: 0 },
      { type: "O", x: 0, y: -76 },
      { type: "O", x: -66, y: 30 },
      { type: "O", x: 66, y: 30 },
      { type: "H", x: -116, y: 64 },
      { type: "H", x: 116, y: 64 },
    ],
    bonds: [
      { a: 0, b: 1, order: "double" },
      { a: 0, b: 2 },
      { a: 0, b: 3 },
      { a: 2, b: 4 },
      { a: 3, b: 5 },
    ],
    lonePairs: { 0: 1, 1: 2, 2: 2, 3: 2 },
  },
];

// --- Reactions -------------------------------------------------------------
// Data-driven, like the molecule templates: bring the reactants close
// together and the lab offers the reaction. Atom counts always balance —
// products are rebuilt from the exact atoms of the reactants.
const REACTION_TEMPLATES = [
  {
    type: "ammoniumChlorideReaction",
    equation: "NH3 + HCl → NH4Cl",
    reactantMolecules: { NH3: 1, HCl: 1 },
    products: ["NH4Cl"],
    energy: "exothermic",
    deltaH: -176,
    prompt: "Base meets acid! React NH3 with HCl to form ammonium chloride (NH4Cl)?",
  },
  {
    type: "methaneCombustion",
    equation: "CH4 + 2 O2 → CO2 + 2 H2O",
    reactantMolecules: { CH4: 1, O2: 2 },
    products: ["CO2", "H2O", "H2O"],
    energy: "exothermic",
    deltaH: -890,
    // Combustion needs ignition heat.
    minTemperature: 100,
    prompt: "🔥 Combustion! Burn methane in oxygen (CH4 + 2 O2 → CO2 + 2 H2O)?",
  },
  {
    type: "neutralization",
    equation: "H3O⁺ + OH⁻ → 2 H2O",
    reactantMolecules: { "H3O+": 1, "OH-": 1 },
    products: ["H2O", "H2O"],
    // The two product waters hydrogen-bond into the 2H2O dimer automatically
    // (no follow-up prompt).
    autoClusterWaters: true,
    energy: "exothermic",
    deltaH: -57,
    prompt: "Neutralization! The acid H3O⁺ and the base OH⁻ cancel into two waters?",
  },
  {
    type: "sodiumWater",
    equation: "2 Na + 2 H2O → 2 NaOH + H2",
    reactantMolecules: { H2O: 2 },
    reactantAtoms: { Na: 2 },
    products: ["NaOH", "NaOH", "H2"],
    energy: "exothermic",
    deltaH: -368,
    prompt: "⚡ Sodium + water! React violently into sodium hydroxide and hydrogen gas?",
  },
  {
    type: "acidRain",
    equation: "SO2 + H2O → H2SO3",
    reactantMolecules: { SO2: 1, H2O: 1 },
    products: ["H2SO3"],
    energy: "exothermic",
    deltaH: -40,
    prompt: "Acid rain! Dissolve SO2 into water to form sulfurous acid (H2SO3)?",
  },
];

const REACTION_TRIGGER_RANGE_PX = 150;

// Compositions for legacy (non-template) reaction products.
const LEGACY_PRODUCT_COMPOSITIONS = {
  H2O: { O: 1, H: 2 },
  CO2: { C: 1, O: 2 },
  H2: { H: 2 },
  NH3: { N: 1, H: 3 },
};

// Equilibrium: unstable species fall apart on their own, faster when hot
// (and thermal decomposition for NH4Cl). ΔH here is for the decomposition
// direction — endothermic, the reverse of formation.
const DECOMPOSITION_RULES = [
  {
    formula: "H2CO3",
    products: ["CO2", "H2O"],
    equation: "H2CO3 → CO2 + H2O",
    baseHalfLifeS: 45,
    deltaH: 20,
  },
  {
    formula: "H2SO3",
    products: ["SO2", "H2O"],
    equation: "H2SO3 → SO2 + H2O",
    baseHalfLifeS: 70,
    deltaH: 40,
  },
  {
    formula: "NH4Cl",
    products: ["NH3", "HCl"],
    equation: "NH4Cl → NH3 + HCl",
    baseHalfLifeS: 8,
    minTemperature: 250,
    deltaH: 176,
  },
];

const getReactionProductOffset = (productCount, productIndex) => {
  if (productCount === 1) {
    return { x: 0, y: 0 };
  }

  if (productCount === 2) {
    return productIndex === 0 ? { x: -0.1, y: 0 } : { x: 0.1, y: 0 };
  }

  return (
    [
      { x: -0.13, y: 0.03 },
      { x: 0.13, y: 0.03 },
      { x: 0, y: -0.13 },
    ][productIndex] ?? { x: 0, y: 0 }
  );
};

// Compositions the legacy (non-template) detectors can form from raw atoms.
// Used to decide which template molecules are "build-through" states.
const LEGACY_DETECTABLE_COMPOSITIONS = [
  { H: 2 },
  { O: 2 },
  { N: 2 },
  { C: 1, O: 1 },
  { O: 1, H: 2 },
  { C: 1, O: 2 },
  { N: 1, H: 3 },
  { C: 1, H: 4 },
  { O: 1, H: 3 },
  { N: 1, H: 4 },
  { Na: 1, Cl: 1 },
];

const isStrictSubsetComposition = (small, large) => {
  if (!Object.keys(small).every((atomType) => (large[atomType] ?? 0) >= small[atomType])) {
    return false;
  }

  const totalSmall = Object.values(small).reduce((sum, count) => sum + count, 0);
  const totalLarge = Object.values(large).reduce((sum, count) => sum + count, 0);

  return totalLarge > totalSmall;
};

// Only molecules that are a sub-structure of some other buildable molecule
// (OH- inside H2O, C2H4/C2H2 on the way to C2H6, ...) need the stability
// delay. Everything else prompts immediately, like the legacy molecules.
const GENERIC_TEMPLATE_NEEDS_DELAY = Object.fromEntries(
  GENERIC_MOLECULE_TEMPLATES.map((template) => [
    template.type,
    [
      // reactionOnly species can't be reached by bonding, so they don't make
      // anything a "build-through" state.
      ...GENERIC_MOLECULE_TEMPLATES.filter((entry) => !entry.reactionOnly).map(
        (entry) => entry.composition
      ),
      ...LEGACY_DETECTABLE_COMPOSITIONS,
    ].some(
      (otherComposition) =>
        otherComposition !== template.composition &&
        isStrictSubsetComposition(template.composition, otherComposition)
    ),
  ])
);

// Build-through states wait for the bonded cluster to sit unchanged briefly,
// so intermediate shapes don't interrupt with premature offers.
const GENERIC_PROMPT_DELAY_MS = 1800;

// Breathing room after any prompt closes before the next auto-offer may
// appear — prevents queued-up matches from firing in an instant avalanche.
const PROMPT_COOLDOWN_MS = 1500;

const getGenericTemplateForMolecule = (molecule) =>
  GENERIC_MOLECULE_TEMPLATES.find((template) => template.type === molecule?.templateType) ?? null;

const getComponentComposition = (componentAtoms) => {
  const counts = {};

  for (const atom of componentAtoms) {
    counts[atom.type] = (counts[atom.type] ?? 0) + 1;
  }

  return counts;
};

const compositionMatchesTemplate = (template, counts) => {
  const templateKeys = Object.keys(template.composition);

  return (
    templateKeys.length === Object.keys(counts).length &&
    templateKeys.every((atomType) => template.composition[atomType] === counts[atomType])
  );
};

// Info shown on the molecule inspector card. Keyed by formula.
const MOLECULE_INFO = {
  H2: { name: "Hydrogen gas", molarMass: "2.02", geometry: "Linear", bondAngle: "180°", polarity: "Nonpolar", fact: "The lightest molecule in the universe — it powers stars." },
  O2: { name: "Oxygen gas", molarMass: "32.00", geometry: "Linear", bondAngle: "180°", polarity: "Nonpolar", fact: "About 21% of the air you breathe." },
  N2: { name: "Nitrogen gas", molarMass: "28.02", geometry: "Linear", bondAngle: "180°", polarity: "Nonpolar", fact: "78% of air — its triple bond makes it very unreactive." },
  H2O: { name: "Water", molarMass: "18.02", geometry: "Bent", bondAngle: "104.5°", polarity: "Polar", fact: "Its polarity makes it the “universal solvent.”" },
  CO: { name: "Carbon monoxide", molarMass: "28.01", geometry: "Linear", bondAngle: "180°", polarity: "Polar", fact: "Toxic — it binds hemoglobin about 240× better than O2." },
  CO2: { name: "Carbon dioxide", molarMass: "44.01", geometry: "Linear", bondAngle: "180°", polarity: "Nonpolar", fact: "You exhale it; plants turn it back into oxygen." },
  NH3: { name: "Ammonia", molarMass: "17.03", geometry: "Trigonal pyramidal", bondAngle: "107°", polarity: "Polar", fact: "Used to make the fertilizer that feeds half the world." },
  CH4: { name: "Methane", molarMass: "16.04", geometry: "Tetrahedral", bondAngle: "109.5°", polarity: "Nonpolar", fact: "Natural gas — and a potent greenhouse gas." },
  H2CO3: { name: "Carbonic acid", molarMass: "62.03", geometry: "Trigonal planar at C", bondAngle: "~120°", polarity: "Polar", fact: "Makes soda fizzy and slightly acidic." },
  "2H2O": { name: "Water dimer", molarMass: "36.03", geometry: "H-bonded pair", bondAngle: "—", polarity: "Polar", fact: "Hydrogen bonds like this give water its high boiling point." },
  "H3O+": { name: "Hydronium", molarMass: "19.02", geometry: "Trigonal pyramidal", bondAngle: "~113°", polarity: "+1 cation", fact: "The true carrier of acidity in water." },
  "NH4+": { name: "Ammonium", molarMass: "18.04", geometry: "Tetrahedral", bondAngle: "109.5°", polarity: "+1 cation", fact: "Ammonia that grabbed an extra proton." },
  NaCl: { name: "Sodium chloride", molarMass: "58.44", geometry: "Ionic pair", bondAngle: "—", polarity: "Ionic", fact: "Table salt — an electron fully transfers from Na to Cl." },
  HCl: { name: "Hydrogen chloride", molarMass: "36.46", geometry: "Linear", bondAngle: "180°", polarity: "Polar", fact: "Dissolved in water it becomes hydrochloric acid — your stomach makes it." },
  "OH-": { name: "Hydroxide", molarMass: "17.01", geometry: "Linear", bondAngle: "—", polarity: "−1 anion", fact: "The signature ion of bases." },
  H2O2: { name: "Hydrogen peroxide", molarMass: "34.01", geometry: "Bent at each O", bondAngle: "~95°", polarity: "Polar", fact: "An antiseptic that decomposes into water and oxygen." },
  O3: { name: "Ozone", molarMass: "48.00", geometry: "Bent", bondAngle: "117°", polarity: "Slightly polar", fact: "The ozone layer absorbs harmful UV radiation." },
  C2H6: { name: "Ethane", molarMass: "30.07", geometry: "Tetrahedral at each C", bondAngle: "109.5°", polarity: "Nonpolar", fact: "Found in natural gas alongside methane." },
  C2H4: { name: "Ethene", molarMass: "28.05", geometry: "Trigonal planar", bondAngle: "120°", polarity: "Nonpolar", fact: "Ripens fruit — and becomes polyethylene plastic." },
  C2H2: { name: "Ethyne (acetylene)", molarMass: "26.04", geometry: "Linear", bondAngle: "180°", polarity: "Nonpolar", fact: "Burns at ~3300°C in welding torches." },
  CH3OH: { name: "Methanol", molarMass: "32.04", geometry: "Tetrahedral at C", bondAngle: "~109°", polarity: "Polar", fact: "The simplest alcohol — toxic to drink, useful as fuel." },
  NaOH: { name: "Sodium hydroxide", molarMass: "40.00", geometry: "Ionic", bondAngle: "—", polarity: "Ionic", fact: "Lye — a strong base used to make soap." },
  Na2O: { name: "Sodium oxide", molarMass: "61.98", geometry: "Ionic", bondAngle: "—", polarity: "Ionic", fact: "A reactive oxide that forms lye when it meets water." },
  SO2: { name: "Sulfur dioxide", molarMass: "64.07", geometry: "Bent", bondAngle: "119°", polarity: "Polar", fact: "Volcano gas — in clouds it can become acid rain." },
  H2S: { name: "Hydrogen sulfide", molarMass: "34.08", geometry: "Bent", bondAngle: "92°", polarity: "Slightly polar", fact: "Rotten-egg smell — your nose detects a few parts per billion." },
  NH4Cl: { name: "Ammonium chloride", molarMass: "53.49", geometry: "Ionic (NH₄⁺ / Cl⁻)", bondAngle: "—", polarity: "Ionic", fact: "Forms as white smoke when ammonia and HCl vapors meet mid-air." },
  H2SO3: { name: "Sulfurous acid", molarMass: "82.08", geometry: "Pyramidal at S", bondAngle: "—", polarity: "Polar", fact: "The acid in acid rain — SO2 dissolved in water." },
};

// pH estimation: each acidic/basic species on screen shifts the lab's pH
// away from neutral 7. Strong acids/bases shift harder than weak ones.
const ACID_BASE_CONTRIBUTIONS = {
  "H3O+": -2.2,
  HCl: -1.8,
  H2SO3: -0.9,
  H2CO3: -0.5,
  "OH-": 2.2,
  NaOH: 1.8,
  Na2O: 1.8,
  NH3: 0.6,
};

const getEstimatedPH = (molecules) => {
  const shift = molecules.reduce(
    (sum, molecule) => sum + (ACID_BASE_CONTRIBUTIONS[molecule.formula] ?? 0),
    0
  );

  return clampValue(7 + shift, 0, 14);
};

// Periodic table (periods 1-4) for the spawn drawer. Elements present in
// ATOM_DETAILS are spawnable; the rest render grayed out as "coming soon".
const PERIODIC_ELEMENTS = [
  ["H", 1, 1, 1, "Hydrogen"], ["He", 2, 1, 18, "Helium"],
  ["Li", 3, 2, 1, "Lithium"], ["Be", 4, 2, 2, "Beryllium"], ["B", 5, 2, 13, "Boron"],
  ["C", 6, 2, 14, "Carbon"], ["N", 7, 2, 15, "Nitrogen"], ["O", 8, 2, 16, "Oxygen"],
  ["F", 9, 2, 17, "Fluorine"], ["Ne", 10, 2, 18, "Neon"],
  ["Na", 11, 3, 1, "Sodium"], ["Mg", 12, 3, 2, "Magnesium"], ["Al", 13, 3, 13, "Aluminium"],
  ["Si", 14, 3, 14, "Silicon"], ["P", 15, 3, 15, "Phosphorus"], ["S", 16, 3, 16, "Sulfur"],
  ["Cl", 17, 3, 17, "Chlorine"], ["Ar", 18, 3, 18, "Argon"],
  ["K", 19, 4, 1, "Potassium"], ["Ca", 20, 4, 2, "Calcium"], ["Sc", 21, 4, 3, "Scandium"],
  ["Ti", 22, 4, 4, "Titanium"], ["V", 23, 4, 5, "Vanadium"], ["Cr", 24, 4, 6, "Chromium"],
  ["Mn", 25, 4, 7, "Manganese"], ["Fe", 26, 4, 8, "Iron"], ["Co", 27, 4, 9, "Cobalt"],
  ["Ni", 28, 4, 10, "Nickel"], ["Cu", 29, 4, 11, "Copper"], ["Zn", 30, 4, 12, "Zinc"],
  ["Ga", 31, 4, 13, "Gallium"], ["Ge", 32, 4, 14, "Germanium"], ["As", 33, 4, 15, "Arsenic"],
  ["Se", 34, 4, 16, "Selenium"], ["Br", 35, 4, 17, "Bromine"], ["Kr", 36, 4, 18, "Krypton"],
].map(([symbol, number, row, col, name]) => ({ symbol, number, row, col, name }));

const DISCOVERED_MOLECULES_STORAGE_KEY = "chemArLabDiscoveredMolecules";
const TUTORIAL_SEEN_STORAGE_KEY = "chemArLabTutorialSeen";

const TUTORIAL_TARGET_POSITION = { x: 0.3, y: 0.68 };
const TUTORIAL_TARGET_RADIUS = 0.085;

const TUTORIAL_STEPS = [
  {
    id: "move",
    text: "Grab the white Hydrogen atom (pinch with your hand, or touch/click-drag it) and move it into the glowing ring.",
  },
  {
    id: "menu",
    text: "Open the atom menu — tap the MENU toggle in the Controls panel (or press M).",
  },
  {
    id: "spawn",
    text: "Spawn a second Hydrogen atom — tap “Hydrogen (H)” in the menu.",
  },
  {
    id: "bondmode",
    text: "Turn on Bonding Mode from the menu.",
  },
  {
    id: "bond",
    text: "Drag from each Hydrogen atom onto the red Oxygen atom to create two bonds.",
  },
  {
    id: "water",
    text: "The lab noticed a familiar shape — tap Yes to snap it into water!",
  },
];

const WATER_LAYOUT_OFFSETS_PX = [
  { x: -54, y: -40 },
  { x: 54, y: -40 },
];

const WATER_DIMER_LAYOUT_OFFSETS_PX = {
  donorOxygen: { x: -70, y: 0 },
  donorHydrogenFar: { x: -115, y: -35 },
  donorHydrogenBonding: { x: -25, y: -5 },
  acceptorOxygen: { x: 75, y: 0 },
  acceptorHydrogenTop: { x: 115, y: -35 },
  acceptorHydrogenBottom: { x: 120, y: 35 },
};

const CARBON_DIOXIDE_LAYOUT_OFFSETS_PX = [
  { x: -72, y: 0 },
  { x: 72, y: 0 },
];

const DIATOMIC_LAYOUT_OFFSETS_PX = [
  { x: -48, y: 0 },
  { x: 48, y: 0 },
];

const METHANE_LAYOUT_OFFSETS_PX = [
  { x: -52, y: -48 },
  { x: 52, y: -48 },
  { x: -52, y: 48 },
  { x: 52, y: 48 },
];

const AMMONIA_LAYOUT_OFFSETS_PX = [
  { x: -55, y: 35 },
  { x: 55, y: 35 },
  { x: 0, y: 70 },
];

const CARBONIC_ACID_LAYOUT_OFFSETS_PX = {
  doubleOxygen: { x: 0, y: -76 },
  hydroxylLeftOxygen: { x: -66, y: 30 },
  hydroxylRightOxygen: { x: 66, y: 30 },
  hydroxylHydrogenLeft: { x: -116, y: 64 },
  hydroxylHydrogenRight: { x: 116, y: 64 },
};

const createMolecule = ({
  id,
  type,
  displayLabel,
  formula,
  atomIds,
  memberMoleculeIds = [],
  memberMoleculeOffsets = {},
  center,
  radius,
  atomOffsets,
  snapStartedAt,
  snapDuration,
  originPositions,
  visualMode = "default",
  charge = 0,
  templateType = null,
}) => ({
  id,
  type,
  displayLabel,
  formula,
  atomIds,
  memberMoleculeIds,
  memberMoleculeOffsets,
  center,
  radius,
  atomOffsets,
  snapStartedAt,
  snapDuration,
  originPositions,
  visualMode,
  charge,
  templateType,
});

const getClusterParticleOffsets = (count, maxRadiusPx) => {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [{ x: 0, y: 0 }];
  }

  return Array.from({ length: count }, (_, index) => {
    const progress = index / Math.max(1, count - 1);
    const radius = Math.sqrt(progress) * maxRadiusPx;
    const angle = index * 2.399963229728653;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
};

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const lerp = (start, end, amount) => start + (end - start) * amount;

// --- Hand-tracking smoothing ---------------------------------------------
// One Euro filter (Casiez et al.): adaptive low-pass that smooths hard when
// the hand is still (kills MediaPipe jitter) but opens up at speed (no lag
// on fast sweeps). One filter instance per landmark coordinate.
const createOneEuroFilter = ({ minCutoff = 1.2, beta = 0.055, dCutoff = 1.0 } = {}) => {
  let previousValue = null;
  let previousDerivative = 0;
  let previousTimeMs = null;

  const smoothingAlpha = (cutoff, dtSeconds) => {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dtSeconds);
  };

  return (value, timeMs) => {
    if (previousValue === null) {
      previousValue = value;
      previousTimeMs = timeMs;
      return value;
    }

    const dtSeconds = Math.max(0.001, (timeMs - previousTimeMs) / 1000);
    previousTimeMs = timeMs;

    const derivative = (value - previousValue) / dtSeconds;
    previousDerivative =
      previousDerivative +
      smoothingAlpha(dCutoff, dtSeconds) * (derivative - previousDerivative);

    const cutoff = minCutoff + beta * Math.abs(previousDerivative);
    previousValue =
      previousValue + smoothingAlpha(cutoff, dtSeconds) * (value - previousValue);

    return previousValue;
  };
};

// A hand that vanishes from detection keeps its state (and its grab) this
// long, so single-frame tracking blips don't drop molecules.
const HAND_GRACE_MS = 220;

// Grabbed objects ease toward the fingertip each frame instead of snapping,
// which removes residual tremble and gives molecules a bit of weight.
const HAND_GRAB_FOLLOW = 0.55;

const easeOutCubic = (value) => 1 - (1 - value) ** 3;

const clampVectorToRadius = (x, y, maxRadius) => {
  const distance = Math.hypot(x, y);

  if (distance <= maxRadius || distance === 0) {
    return { x, y };
  }

  const scale = maxRadius / distance;
  return {
    x: x * scale,
    y: y * scale,
  };
};

const createAtomicExpansionNucleusParticles = (atomType) => {
  const details = ATOM_DETAILS[atomType];

  if (!details) {
    return [];
  }

  return [
    ...getClusterParticleOffsets(details.atomicNumber, 32).map((offset, index) => ({
      ...offset,
      id: `p-${index}`,
      kind: "proton",
    })),
    ...getClusterParticleOffsets(details.neutrons, 30).map((offset, index) => ({
      x: offset.x + 5,
      y: offset.y - 4,
      id: `n-${index}`,
      kind: "neutron",
    })),
  ];
};

const getAtomicExpansionOverlayMetrics = (viewportWidth, viewportHeight) => {
  const modelSizePx = Math.max(
    280,
    Math.min(
      viewportWidth * 0.72,
      viewportHeight * 0.82,
      ATOMIC_EXPANSION_MODEL_MAX_SIZE_PX
    )
  );

  return {
    centerX: viewportWidth / 2,
    centerY: viewportHeight / 2,
    modelSizePx,
    shellRadiusPx: modelSizePx * 0.34,
    shellGrabTolerancePx: Math.max(32, modelSizePx * 0.12),
    nucleusDragRadiusPx: modelSizePx * 0.15,
    particleGrabRadiusPx: Math.max(24, modelSizePx * 0.065),
  };
};

const getAtomicExpansionDisplayState = (
  atomicExpansionAtom,
  viewportWidth,
  viewportHeight,
  scaledAtomRadiusPx
) => {
  const entryProgress = atomicExpansionAtom
    ? getAtomicExpansionEntryProgress(atomicExpansionAtom)
    : 0;
  const entryEase = easeOutCubic(entryProgress);
  const overlayMetrics = getAtomicExpansionOverlayMetrics(viewportWidth, viewportHeight);
  const originX = (atomicExpansionAtom?.originPosition?.x ?? 0.5) * viewportWidth;
  const originY = (atomicExpansionAtom?.originPosition?.y ?? 0.5) * viewportHeight;
  const targetCenterX = (atomicExpansionAtom?.modelPosition?.x ?? 0.5) * viewportWidth;
  const targetCenterY = (atomicExpansionAtom?.modelPosition?.y ?? 0.5) * viewportHeight;
  const startSizePx = Math.max(scaledAtomRadiusPx * 2.6, 60);
  const modelSizePx = lerp(startSizePx, overlayMetrics.modelSizePx, entryEase);

  return {
    entryProgress,
    overlayMetrics,
    modelCenterX: lerp(originX, targetCenterX, entryEase),
    modelCenterY: lerp(originY, targetCenterY, entryEase),
    modelSizePx,
    particleScale: overlayMetrics.modelSizePx > 0 ? modelSizePx / overlayMetrics.modelSizePx : 1,
  };
};

const getAtomicExpansionEntryProgress = (atomicExpansionAtom, now = performance.now()) => {
  if (!atomicExpansionAtom?.openedAt) {
    return 1;
  }

  return clampValue(
    (now - atomicExpansionAtom.openedAt) / ATOMIC_EXPANSION_ENTRY_DURATION_MS,
    0,
    1
  );
};

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);
  const moleculesRef = useRef([]);
  const bondsRef = useRef([]);
  // Keyed by "mouse" plus one dynamic key per tracked hand ("hand-<id>").
  const tempBondStateRef = useRef({
    mouse: null,
  });
  const nextAtomIdRef = useRef(3);
  const nextMoleculeIdRef = useRef(1);
  const atomsRef = useRef([
    createAtom(0, "H", { x: 0.32, y: 0.42 }),
    createAtom(1, "O", { x: 0.5, y: 0.5 }),
    createAtom(2, "C", { x: 0.68, y: 0.42 }),
  ]);
  const spawnCountRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [bondingMode, setBondingMode] = useState(false);
  const [atomSizeScale, setAtomSizeScale] = useState(1);
  const [showLonePairs, setShowLonePairs] = useState(false);
  const [selectedAtomIndex, setSelectedAtomIndex] = useState(null);
  const [moleculePrompt, setMoleculePrompt] = useState(null);
  const [bondLimitMessage, setBondLimitMessage] = useState("");
  const [atomicExpansionAtom, setAtomicExpansionAtom] = useState(null);
  const [overlayAnimationFrame, setWaterOverlayFrame] = useState(0);
  const [, setPromptedMoleculeCombos] = useState({});
  const [discoveredFormulas, setDiscoveredFormulas] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DISCOVERED_MOLECULES_STORAGE_KEY));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [questOpen, setQuestOpen] = useState(false);
  const [eventBanner, setEventBanner] = useState(null);
  const [tutorialPromptVisible, setTutorialPromptVisible] = useState(() => {
    try {
      return !localStorage.getItem(TUTORIAL_SEEN_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [tutorialStep, setTutorialStep] = useState(null);
  const [showPolarity, setShowPolarity] = useState(false);
  const [lewisView, setLewisView] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // The branded landing gate: the camera doesn't start (and no permission
  // popup appears) until the user taps "Enter the Lab".
  const [labEntered, setLabEntered] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [notebookEntries, setNotebookEntries] = useState([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  // Energy diagram card shown after each reaction (equation, exo/endo, ΔH).
  const [energyDiagram, setEnergyDiagram] = useState(null);
  // Lab temperature in °C: drives thermal motion, hydrogen-bond stability,
  // combustion ignition, and decomposition rates.
  const [temperature, setTemperature] = useState(25);
  const deleteModeRef = useRef(false);
  const bondingModeRef = useRef(false);
  const atomSizeScaleRef = useRef(1);
  const showLonePairsRef = useRef(false);
  const selectedAtomIndexRef = useRef(null);
  const moleculePromptRef = useRef(null);
  const promptedMoleculeCombosRef = useRef({});
  const bondLimitMessageTimeoutRef = useRef(null);
  const hoveredMoleculeIdRef = useRef(null);
  const grabbedMoleculeIdsRef = useRef(new Set());
  const atomicExpansionAtomRef = useRef(null);
  const atomicExpansionGestureRef = useRef({
    atomId: null,
    startDistancePx: 0,
  });
  const atomicExpansionCollapseGestureRef = useRef({
    atomId: null,
    startDistancePx: 0,
    currentDistancePx: 0,
    shellGripActive: false,
    shellScale: 1,
    isClosing: false,
  });
  const atomicExpansionCollapseTimeoutRef = useRef(null);
  const atomicExpansionNucleusParticlesRef = useRef([]);
  // Transient canvas effects (grab ripples, formation bursts). Positions are
  // normalized canvas coordinates.
  const effectsRef = useRef([]);
  // Touch/mouse drag state so atoms and molecules can be moved without hand tracking.
  const pointerDragRef = useRef(null);
  const discoveredFormulasRef = useRef(null);
  const eventBannerTimeoutRef = useRef(null);
  // First-seen timestamps per bonded component, for the generic prompt delay.
  const genericComponentAgesRef = useRef(new Map());
  const tutorialActiveRef = useRef(false);
  const promptClosedAtRef = useRef(0);
  const deviceScaleRef = useRef(1);
  const notebookNextIdRef = useRef(1);
  const resetArmTimeoutRef = useRef(null);
  const energyDiagramTimeoutRef = useRef(null);
  const temperatureRef = useRef(25);
  // One-time "needs heat" hints per reactant combo (e.g. cold methane).
  const ignitionHintShownRef = useRef(new Set());
  // First-decomposition banner per formula (avoid spamming equilibrium notices).
  const equilibriumBannerShownRef = useRef(new Set());
  const showPolarityRef = useRef(false);
  const lewisViewRef = useRef(false);
  const soundEnabledRef = useRef(true);
  const audioContextRef = useRef(null);

  if (discoveredFormulasRef.current === null) {
    discoveredFormulasRef.current = discoveredFormulas;
  }

  if (import.meta.env.DEV && typeof window !== "undefined") {
    window.__chemDebug = {
      atomsRef,
      bondsRef,
      moleculesRef,
      pointerDragRef,
      effectsRef,
      bondingModeRef,
      tempBondStateRef,
    };
  }

  const spawnGrabRipple = (position, colorRgb, options = {}) => {
    const { soft = false } = options;

    effectsRef.current = [
      ...effectsRef.current,
      {
        kind: "ripple",
        x: position.x,
        y: position.y,
        color: colorRgb,
        startedAt: performance.now(),
        duration: GRAB_RIPPLE_DURATION_MS,
        soft,
      },
    ];
  };

  const spawnFormationEffect = (position, colorRgb) => {
    effectsRef.current = [
      ...effectsRef.current,
      {
        kind: "formation",
        x: position.x,
        y: position.y,
        color: colorRgb,
        startedAt: performance.now(),
        duration: FORMATION_EFFECT_DURATION_MS,
      },
    ];
  };

  const getMoleculeMixedNeonRgb = (molecule) =>
    getMixedNeonRgb(getMoleculeAtoms(molecule).map((atom) => atom.type));

  // Quiet synthesized sounds (no assets). Gains are intentionally low.
  const playTone = (frequency, { duration = 0.35, delay = 0, peak = 0.04, type = "sine" } = {}) => {
    if (!soundEnabledRef.current) {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const startAt = audioContext.currentTime + delay;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.05);
    } catch {
      // Audio unavailable — stay silent.
    }
  };

  const playFormationSound = () => {
    playTone(740, { peak: 0.04 });
    playTone(1108.7, { delay: 0.09, peak: 0.03 });
  };

  const playDiscoverySound = () => {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      playTone(frequency, { delay: 0.15 + index * 0.16, duration: 0.42, peak: 0.035 });
    });
  };

  const playReactionSound = () => {
    playTone(196, { duration: 0.5, peak: 0.045, type: "triangle" });
    playTone(392, { delay: 0.12, duration: 0.45, peak: 0.035 });
    playTone(587.33, { delay: 0.24, duration: 0.5, peak: 0.03 });
  };

  // Reaction burst: staggered formation effects in fire colors (exothermic —
  // energy released) or icy blues (endothermic — energy absorbed).
  const spawnReactionBurst = (position, energy) => {
    const colors =
      energy === "endothermic"
        ? [
            { r: 130, g: 200, b: 255 },
            { r: 90, g: 150, b: 255 },
            { r: 200, g: 240, b: 255 },
          ]
        : [
            { r: 255, g: 120, b: 40 },
            { r: 255, g: 190, b: 70 },
            { r: 255, g: 70, b: 50 },
          ];

    colors.forEach((color, index) => {
      window.setTimeout(() => {
        spawnFormationEffect(
          {
            x: position.x + (index - 1) * 0.025,
            y: position.y - index * 0.018,
          },
          color
        );
      }, index * 130);
    });
  };

  const setAtomPosition = (atomId, position) => {
    atomsRef.current = atomsRef.current.map((atom) =>
      atom.id === atomId ? { ...atom, position: { ...position } } : atom
    );
  };

  const takeAtomsFromPool = (atomPool, composition) => {
    const takenAtoms = [];

    for (const [atomType, count] of Object.entries(composition)) {
      for (let taken = 0; taken < count; taken += 1) {
        const poolIndex = atomPool.findIndex((atom) => atom.type === atomType);

        if (poolIndex < 0) {
          return null;
        }

        takenAtoms.push(atomPool.splice(poolIndex, 1)[0]);
      }
    }

    return takenAtoms;
  };

  // Build one reaction product out of the pooled reactant atoms. The anchor
  // atom teleports to the product's spot; the rest snap over from wherever
  // the reactants were — the rearrangement IS the reaction animation.
  const buildReactionProduct = (formula, atomPool, centerPosition) => {
    const template = GENERIC_MOLECULE_TEMPLATES.find((entry) => entry.formula === formula);

    if (template) {
      const roleAtoms = [];

      for (const entry of template.layout) {
        const poolIndex = atomPool.findIndex((atom) => atom.type === entry.type);

        if (poolIndex < 0) {
          return;
        }

        roleAtoms.push(atomPool.splice(poolIndex, 1)[0]);
      }

      setAtomPosition(roleAtoms[0].id, centerPosition);

      for (const bond of template.bonds) {
        createBond(roleAtoms[bond.a].id, roleAtoms[bond.b].id, { type: bond.order ?? "single" });
      }

      return buildMoleculeRecord({
        type: template.type,
        displayLabel: template.displayLabel,
        formula: template.formula,
        atomIds: roleAtoms.map((atom) => atom.id),
        center: { ...centerPosition },
        snapStartedAt: performance.now(),
        charge: template.charge ?? 0,
        templateType: template.type,
      });
    }

    const composition = LEGACY_PRODUCT_COMPOSITIONS[formula];

    if (!composition) {
      return;
    }

    const takenAtoms = takeAtomsFromPool(atomPool, composition);

    if (!takenAtoms) {
      return;
    }

    if (formula === "H2O") {
      const [oxygenAtom, hydrogenA, hydrogenB] = takenAtoms;

      setAtomPosition(oxygenAtom.id, centerPosition);
      createBond(oxygenAtom.id, hydrogenA.id);
      createBond(oxygenAtom.id, hydrogenB.id);
      return buildMoleculeRecord({
        type: "water",
        displayLabel: "H2O",
        formula: "H2O",
        atomIds: [oxygenAtom.id, hydrogenA.id, hydrogenB.id],
        center: { ...centerPosition },
        snapStartedAt: performance.now(),
      });
    }

    if (formula === "CO2") {
      const carbonAtom = takenAtoms.find((atom) => atom.type === "C");
      const oxygenAtoms = takenAtoms.filter((atom) => atom.type === "O");

      setAtomPosition(carbonAtom.id, centerPosition);
      createBond(carbonAtom.id, oxygenAtoms[0].id, { type: "double" });
      createBond(carbonAtom.id, oxygenAtoms[1].id, { type: "double" });
      return buildMoleculeRecord({
        type: "carbonDioxide",
        displayLabel: "CO2",
        formula: "CO2",
        atomIds: [oxygenAtoms[0].id, carbonAtom.id, oxygenAtoms[1].id],
        center: { ...centerPosition },
        snapStartedAt: performance.now(),
      });
    }

    if (formula === "H2") {
      const [hydrogenA, hydrogenB] = takenAtoms;

      setAtomPosition(hydrogenA.id, centerPosition);
      createBond(hydrogenA.id, hydrogenB.id);
      return buildMoleculeRecord({
        type: "hydrogen",
        displayLabel: "H2",
        formula: "H2",
        atomIds: [hydrogenA.id, hydrogenB.id],
        center: { ...centerPosition },
        snapStartedAt: performance.now(),
      });
    }

    if (formula === "NH3") {
      const nitrogenAtom = takenAtoms.find((atom) => atom.type === "N");
      const hydrogenAtoms = takenAtoms.filter((atom) => atom.type === "H");

      setAtomPosition(nitrogenAtom.id, centerPosition);
      hydrogenAtoms.forEach((hydrogenAtom) => {
        createBond(nitrogenAtom.id, hydrogenAtom.id);
      });
      return buildMoleculeRecord({
        type: "ammonia",
        displayLabel: "NH3",
        formula: "NH3",
        atomIds: [nitrogenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center: { ...centerPosition },
        snapStartedAt: performance.now(),
      });
    }

    return null;
  };

  const showEventBanner = (banner, durationMs = 2800) => {
    if (eventBannerTimeoutRef.current) {
      clearTimeout(eventBannerTimeoutRef.current);
    }

    setEventBanner(banner);
    eventBannerTimeoutRef.current = window.setTimeout(() => {
      setEventBanner(null);
      eventBannerTimeoutRef.current = null;
    }, durationMs);
  };

  const celebrateAllDiscovered = () => {
    const colors = [
      POSITIVE_CHARGE_RGB,
      NEGATIVE_CHARGE_RGB,
      getAtomNeonRgb("O"),
      getAtomNeonRgb("N"),
      getAtomNeonRgb("Cl"),
      getAtomNeonRgb("Na"),
    ];
    const positions = [
      [0.5, 0.5],
      [0.25, 0.3],
      [0.75, 0.3],
      [0.25, 0.7],
      [0.75, 0.7],
      [0.5, 0.18],
      [0.5, 0.82],
      [0.12, 0.5],
      [0.88, 0.5],
    ];

    positions.forEach(([x, y], index) => {
      window.setTimeout(() => {
        spawnFormationEffect({ x, y }, colors[index % colors.length]);
      }, index * 160);
    });
  };

  const registerMoleculeDiscovery = (formula) => {
    const entry = DISCOVERABLE_MOLECULES.find(
      (discoverable) => discoverable.formula === formula
    );

    if (!entry || discoveredFormulasRef.current.includes(formula)) {
      return;
    }

    const nextDiscovered = [...discoveredFormulasRef.current, formula];
    discoveredFormulasRef.current = nextDiscovered;
    setDiscoveredFormulas(nextDiscovered);

    try {
      localStorage.setItem(DISCOVERED_MOLECULES_STORAGE_KEY, JSON.stringify(nextDiscovered));
    } catch {
      // Storage unavailable (private browsing) — discovery still works this session.
    }

    showEventBanner({ kind: "discovery", title: "Molecule discovered!", subtitle: entry.label });
    playDiscoverySound();

    if (nextDiscovered.length === DISCOVERABLE_MOLECULES.length) {
      window.setTimeout(() => {
        showEventBanner(
          {
            kind: "all",
            title: "All molecules discovered!",
            subtitle: "You found every molecule in the lab 🎉",
          },
          5200
        );
        celebrateAllDiscovered();
      }, 3000);
    }
  };

  const playDecomposeSound = () => {
    playTone(523.25, { duration: 0.3, peak: 0.028 });
    playTone(392, { delay: 0.1, duration: 0.35, peak: 0.026 });
  };

  // Break an unstable molecule back into its products (the reverse arrow of
  // an equilibrium). Products are pre-marked so they don't instantly offer
  // to recombine.
  const decomposeMoleculeIntoProducts = (molecule, rule) => {
    const centroid = molecule.center ?? { x: 0.5, y: 0.5 };
    const atomIds = [...molecule.atomIds];

    removeMoleculeRecords([molecule.id]);
    removeBondsForAtomIds(atomIds);

    const atomPool = getAtomsByIds(atomIds);
    const productMoleculeIds = rule.products
      .map((productFormula, productIndex) => {
        const offset = getReactionProductOffset(rule.products.length, productIndex);

        return buildReactionProduct(productFormula, atomPool, {
          x: clampValue(centroid.x + offset.x, 0.12, 0.88),
          y: clampValue(centroid.y + offset.y, 0.12, 0.88),
        });
      })
      .filter((moleculeId) => moleculeId !== null && moleculeId !== undefined);

    // Suppress instant recombination offers between the fresh products —
    // both the legacy carbonic-acid pairing and any reaction template whose
    // reactants exactly match these products.
    const productFormulas = productMoleculeIds.map(
      (moleculeId) => getMoleculeById(moleculeId)?.formula
    );
    const productWaterId = productMoleculeIds.find(
      (moleculeId) => getMoleculeById(moleculeId)?.formula === "H2O"
    );
    const productCO2Id = productMoleculeIds.find(
      (moleculeId) => getMoleculeById(moleculeId)?.formula === "CO2"
    );

    if (productWaterId !== undefined && productCO2Id !== undefined) {
      setPromptedComboStatus(getMoleculeIdComboKey([productWaterId, productCO2Id]), "declined");
    }

    for (const template of REACTION_TEMPLATES) {
      if (Object.keys(template.reactantAtoms ?? {}).length > 0) {
        continue;
      }

      const neededFormulas = template.reactantMolecules ?? {};
      const available = [...productFormulas];
      let satisfiable = true;
      const usedIds = [];

      for (const [formula, count] of Object.entries(neededFormulas)) {
        for (let taken = 0; taken < count; taken += 1) {
          const index = available.indexOf(formula);

          if (index < 0) {
            satisfiable = false;
            break;
          }

          available.splice(index, 1);
          usedIds.push(productMoleculeIds[productFormulas.indexOf(formula)]);
        }

        if (!satisfiable) {
          break;
        }
      }

      if (satisfiable && usedIds.length > 0) {
        const templateProductIds = productMoleculeIds.filter(
          (moleculeId) => neededFormulas[getMoleculeById(moleculeId)?.formula] !== undefined
        );

        setPromptedComboStatus(
          `rx:${template.type}:${getMoleculeIdComboKey(templateProductIds)}:`,
          "declined"
        );
      }
    }

    spawnReactionBurst(centroid, "endothermic");
    playDecomposeSound();
    addNotebookEntry(`Decomposed: ${rule.equation} (endothermic)`);

    if (!equilibriumBannerShownRef.current.has(rule.formula)) {
      equilibriumBannerShownRef.current.add(rule.formula);
      showEventBanner(
        { kind: "discovery", title: "⚖️ Equilibrium!", subtitle: `${rule.equation} — unstable molecules fall apart, faster when heated.` },
        4200
      );
      showEnergyDiagram({
        equation: rule.equation,
        energy: "endothermic",
        deltaH: rule.deltaH,
      });
    }
  };

  const showEnergyDiagram = (diagram, durationMs = 14000) => {
    if (energyDiagramTimeoutRef.current) {
      clearTimeout(energyDiagramTimeoutRef.current);
    }

    setEnergyDiagram(diagram);
    energyDiagramTimeoutRef.current = window.setTimeout(() => {
      setEnergyDiagram(null);
      energyDiagramTimeoutRef.current = null;
    }, durationMs);
  };

  // Session lab notebook: a running record of formations and reactions.
  const addNotebookEntry = (text) => {
    const entry = {
      id: notebookNextIdRef.current,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
    };

    notebookNextIdRef.current += 1;
    setNotebookEntries((current) => [entry, ...current].slice(0, 60));
  };

  const resetLab = () => {
    exitAtomicExpansionMode();
    setMoleculePromptState(null);
    atomsRef.current = [
      createAtom(0, "H", { x: 0.32, y: 0.42 }),
      createAtom(1, "O", { x: 0.5, y: 0.5 }),
      createAtom(2, "C", { x: 0.68, y: 0.42 }),
    ];
    moleculesRef.current = [];
    bondsRef.current = [];
    nextAtomIdRef.current = 3;
    nextMoleculeIdRef.current = 1;
    spawnCountRef.current = 0;
    tempBondStateRef.current = { mouse: null };
    grabbedMoleculeIdsRef.current = new Set();
    hoveredMoleculeIdRef.current = null;
    pointerDragRef.current = null;
    effectsRef.current = [];
    genericComponentAgesRef.current = new Map();
    promptedMoleculeCombosRef.current = {};
    setPromptedMoleculeCombos({});
    setSelectedAtom(null);
    deleteModeRef.current = false;
    setDeleteMode(false);
    setBondingModeState(false);
    addNotebookEntry("Lab reset — fresh bench");
  };

  const handleResetLabClick = () => {
    if (resetArmTimeoutRef.current) {
      clearTimeout(resetArmTimeoutRef.current);
      resetArmTimeoutRef.current = null;
    }

    if (!resetArmed) {
      setResetArmed(true);
      resetArmTimeoutRef.current = window.setTimeout(() => {
        setResetArmed(false);
        resetArmTimeoutRef.current = null;
      }, 3000);
      return;
    }

    setResetArmed(false);
    resetLab();
  };

  const markTutorialSeen = () => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_STORAGE_KEY, "1");
    } catch {
      // Storage unavailable — the prompt may reappear next visit, which is fine.
    }
  };

  const startTutorial = () => {
    markTutorialSeen();
    setTutorialPromptVisible(false);
    setTutorialStep(0);
  };

  const skipTutorial = () => {
    markTutorialSeen();
    setTutorialPromptVisible(false);
    setTutorialStep(null);
  };

  const toggleWaterVisualMode = (moleculeId) => {
    const molecule = moleculesRef.current.find((entry) => entry.id === moleculeId);

    if (!molecule || molecule.formula !== "H2O") {
      return false;
    }

    molecule.visualMode = molecule.visualMode === "waterDroplet" ? "default" : "waterDroplet";
    return true;
  };

  const getWaterToggleTargetMoleculeId = () => {
    const grabbedMoleculeId = [...grabbedMoleculeIdsRef.current].find((moleculeId) => {
      const molecule = moleculesRef.current.find((entry) => entry.id === moleculeId);
      return molecule?.formula === "H2O";
    });

    if (grabbedMoleculeId !== undefined) {
      return grabbedMoleculeId;
    }

    const hoveredMoleculeId = hoveredMoleculeIdRef.current;
    const hoveredMolecule = moleculesRef.current.find((molecule) => molecule.id === hoveredMoleculeId);

    return hoveredMolecule?.formula === "H2O" ? hoveredMoleculeId : null;
  };

  const setMoleculePromptState = (prompt) => {
    // Closing a prompt (accept, decline, or auto-cancel) starts the cooldown
    // window before the next automatic offer.
    if (prompt === null && moleculePromptRef.current !== null) {
      promptClosedAtRef.current = performance.now();
    }

    moleculePromptRef.current = prompt;
    setMoleculePrompt(prompt);
  };

  // Shared gate for every automatic prompt source (molecule detectors,
  // cluster offers, reactions).
  const isAutoPromptBlocked = () =>
    moleculePromptRef.current !== null ||
    performance.now() - promptClosedAtRef.current < PROMPT_COOLDOWN_MS;

  const setPromptedComboStatus = (comboKey, status) => {
    // The ref must update SYNCHRONOUSLY: detectors run in the same frame as
    // decompositions/reactions and would otherwise read a stale combo map
    // (which caused decomposition products to instantly re-offer their
    // reverse reaction).
    promptedMoleculeCombosRef.current = {
      ...promptedMoleculeCombosRef.current,
      [comboKey]: status,
    };
    setPromptedMoleculeCombos(promptedMoleculeCombosRef.current);
  };

  const getMoleculeComboKey = (atomIds) =>
    [...atomIds].sort((left, right) => left - right).join("-");

  const getMoleculeIdComboKey = (moleculeIds) =>
    [...moleculeIds].sort((left, right) => left - right).join("-");

  const getBondKey = (leftAtomId, rightAtomId) =>
    [leftAtomId, rightAtomId].sort((left, right) => left - right).join("-");

  const getAtomBondLimit = (atomType) => {
    if (atomType === "H") {
      return 1;
    }

    // Oxygen normally makes 2 bonds; the 3rd slot is the dative bond that
    // forms hydronium (H3O+).
    if (atomType === "O") {
      return 3;
    }

    // Nitrogen normally makes 3 bonds; the 4th slot forms ammonium (NH4+).
    if (atomType === "N") {
      return 4;
    }

    if (atomType === "C") {
      return 4;
    }

    if (atomType === "Cl" || atomType === "Na") {
      return 1;
    }

    // Sulfur: 2 bonds while building (H2S, SO2 start as singles; SO2's
    // doubles are set when the molecule snaps together).
    if (atomType === "S") {
      return 2;
    }

    return Number.POSITIVE_INFINITY;
  };

  const getLonePairCount = (moleculeFormula, atomType) => {
    if (moleculeFormula === "CO") {
      return atomType === "C" || atomType === "O" ? 1 : 0;
    }

    if (moleculeFormula === "H2O" || moleculeFormula === "2H2O") {
      return atomType === "O" ? 2 : 0;
    }

    if (moleculeFormula === "CO2") {
      return atomType === "O" ? 2 : 0;
    }

    if (moleculeFormula === "CH4") {
      return 0;
    }

    if (moleculeFormula === "NH3") {
      return atomType === "N" ? 1 : 0;
    }

    if (moleculeFormula === "H2") {
      return 0;
    }

    if (moleculeFormula === "O2") {
      return atomType === "O" ? 2 : 0;
    }

    if (moleculeFormula === "N2") {
      return atomType === "N" ? 1 : 0;
    }

    if (moleculeFormula === "H2CO3") {
      return atomType === "O" ? 2 : 0;
    }

    // Hydronium: oxygen keeps 1 lone pair (pyramidal, like ammonia).
    if (moleculeFormula === "H3O+") {
      return atomType === "O" ? 1 : 0;
    }

    // Ammonium: nitrogen's lone pair became the 4th N-H bond.
    if (moleculeFormula === "NH4+") {
      return 0;
    }

    // Ionic NaCl: chloride carries a full octet (4 lone pairs); Na+ has none.
    if (moleculeFormula === "NaCl") {
      return atomType === "Cl" ? 4 : 0;
    }

    return 0;
  };

  // Template molecules key lone pairs by layout role (so e.g. ozone's central
  // O can differ from its terminal O's); legacy molecules key by formula+type.
  const getLonePairCountForAtom = (molecule, atom) => {
    const template = getGenericTemplateForMolecule(molecule);

    if (template) {
      const roleIndex = molecule.atomIds.indexOf(atom.id);
      return template.lonePairs?.[roleIndex] ?? 0;
    }

    return getLonePairCount(molecule.formula, atom.type);
  };

  const getBondCategory = (bond) => bond.category ?? "covalent";

  const getBondType = (bond) =>
    getBondCategory(bond) === "hydrogenBond" ? "single" : bond.type ?? "single";

  const getCovalentBondOrder = (bond) => COVALENT_BOND_ORDER[getBondType(bond)] ?? 1;

  const getBondCountForAtom = (atomId, kind = "covalent") =>
    bondsRef.current.reduce((count, bond) => {
      const bondCategory = getBondCategory(bond);
      const [atomAId, atomBId] = getBondAtomIds(bond);

      if (bondCategory !== kind) {
        return count;
      }

      return atomAId === atomId || atomBId === atomId
        ? count + (bondCategory === "covalent" ? getCovalentBondOrder(bond) : 1)
        : count;
    }, 0);

  const isAllowedIntermolecularHydrogenBond = (startAtom, endAtom) => {
    if (!startAtom || !endAtom) {
      return false;
    }

    if (startAtom.moleculeId === null || endAtom.moleculeId === null) {
      return false;
    }

    if (startAtom.moleculeId === endAtom.moleculeId) {
      return false;
    }

    const atomTypes = [startAtom.type, endAtom.type].sort().join("-");
    return atomTypes === "H-O";
  };

  const showBondLimitMessage = () => {
    setBondLimitMessage("Bond limit reached");

    if (bondLimitMessageTimeoutRef.current) {
      clearTimeout(bondLimitMessageTimeoutRef.current);
    }

    bondLimitMessageTimeoutRef.current = window.setTimeout(() => {
      setBondLimitMessage("");
      bondLimitMessageTimeoutRef.current = null;
    }, 1400);
  };

  const setSelectedAtom = (atomIndex) => {
    selectedAtomIndexRef.current = atomIndex;
    setSelectedAtomIndex(atomIndex);
  };

  const resetAtomicExpansionGesture = () => {
    atomicExpansionGestureRef.current = {
      atomId: null,
      startDistancePx: 0,
    };
  };

  const resetAtomicExpansionCollapseGesture = () => {
    if (atomicExpansionCollapseTimeoutRef.current) {
      clearTimeout(atomicExpansionCollapseTimeoutRef.current);
      atomicExpansionCollapseTimeoutRef.current = null;
    }

    atomicExpansionCollapseGestureRef.current = {
      atomId: null,
      startDistancePx: 0,
      currentDistancePx: 0,
      shellGripActive: false,
      shellScale: 1,
      isClosing: false,
    };
  };

  const setAtomicExpansionAtomState = (nextValue) => {
    if (!nextValue) {
      atomicExpansionNucleusParticlesRef.current = [];
      atomicExpansionAtomRef.current = null;
      setAtomicExpansionAtom(null);
      return;
    }

    const nextAtomicExpansionAtom = {
      ...nextValue,
      openedAt: nextValue.openedAt ?? performance.now(),
      originPosition: nextValue.originPosition ?? { x: 0.5, y: 0.5 },
      modelPosition: nextValue.modelPosition ?? { x: 0.5, y: 0.5 },
    };

    atomicExpansionNucleusParticlesRef.current = createAtomicExpansionNucleusParticles(
      nextAtomicExpansionAtom.type
    );
    atomicExpansionAtomRef.current = nextAtomicExpansionAtom;
    setAtomicExpansionAtom(nextAtomicExpansionAtom);
  };

  const exitAtomicExpansionMode = () => {
    resetAtomicExpansionGesture();
    resetAtomicExpansionCollapseGesture();
    setAtomicExpansionAtomState(null);
  };

  const beginAtomicExpansionCollapse = () => {
    const gesture = atomicExpansionCollapseGestureRef.current;

    if (gesture.isClosing) {
      return;
    }

    atomicExpansionCollapseGestureRef.current = {
      ...gesture,
      shellGripActive: false,
      shellScale: 0.76,
      isClosing: true,
    };
    atomicExpansionCollapseTimeoutRef.current = window.setTimeout(() => {
      atomicExpansionCollapseTimeoutRef.current = null;
      exitAtomicExpansionMode();
    }, ATOMIC_EXPANSION_COLLAPSE_ANIMATION_MS);
  };

  const clearTempBondsForAtomIds = (atomIdSet) => {
    tempBondStateRef.current = Object.fromEntries(
      Object.entries(tempBondStateRef.current).map(([key, tempBond]) => [
        key,
        tempBond && atomIdSet.has(tempBond.startAtomId) ? null : tempBond,
      ])
    );
  };

  // User size slider × device scale. The device scale boosts everything on
  // small viewports so atoms/molecules stay finger-sized and readable on
  // phones instead of shrinking with the screen.
  const getVisualScale = () => atomSizeScaleRef.current * deviceScaleRef.current;

  const getScaledAtomRadiusPx = () => BASE_ATOM_RADIUS_PX * getVisualScale();

  const getScaledAtomBondHitRadiusPx = () => BASE_ATOM_BOND_HIT_RADIUS_PX * getVisualScale();

  const getScaledAtomGrabRadiusPx = () => BASE_ATOM_GRAB_RADIUS_PX * getVisualScale();

  const getScaledMoleculeHitRadiusPx = () => BASE_MOLECULE_HIT_RADIUS_PX * getVisualScale();

  const scaleLayoutOffsetPx = (offsetPx) => offsetPx * getVisualScale();

  const getScaledCanvasOffset = (offset, canvas) => ({
    x: scaleLayoutOffsetPx(offset.x) / canvas.width,
    y: scaleLayoutOffsetPx(offset.y) / canvas.height,
  });

  const getAtomById = (atomId) => atomsRef.current.find((atom) => atom.id === atomId) ?? null;

  const getMoleculeById = (moleculeId) =>
    moleculesRef.current.find((molecule) => molecule.id === moleculeId) ?? null;

  const isCarbonicAcidReactionPairInRange = (waterMolecule, carbonDioxideMolecule) => {
    const canvas = canvasRef.current;

    if (!canvas || !waterMolecule?.center || !carbonDioxideMolecule?.center) {
      return false;
    }

    const distancePx =
      Math.hypot(
        waterMolecule.center.x - carbonDioxideMolecule.center.x,
        waterMolecule.center.y - carbonDioxideMolecule.center.y
      ) * Math.min(canvas.width, canvas.height);

    return distancePx <= CARBONIC_ACID_REACTION_RANGE_PX;
  };

  const isWaterClusterMolecule = (molecule) => molecule?.formula === "2H2O";

  const getClusterForMemberMoleculeId = (moleculeId) =>
    moleculesRef.current.find(
      (molecule) =>
        isWaterClusterMolecule(molecule) &&
        (molecule.memberMoleculeIds ?? []).includes(moleculeId)
    ) ?? null;

  const getAtomsByIds = (atomIds) => atomIds.map((atomId) => getAtomById(atomId)).filter(Boolean);

  const getMoleculeAtoms = (molecule) => getAtomsByIds(molecule.atomIds);

  const getWaterMoleculeOxygenAtom = (molecule) =>
    molecule ? getMoleculeAtoms(molecule).find((atom) => atom.type === "O") ?? null : null;

  const getWaterMoleculeHydrogenAtoms = (molecule) =>
    molecule
      ? getMoleculeAtoms(molecule)
          .filter((atom) => atom.type === "H")
          .sort((left, right) => {
            if (left.position.y !== right.position.y) {
              return left.position.y - right.position.y;
            }

            return left.position.x - right.position.x;
          })
      : [];

  const getHydrogenBondStrength = (
    distancePx,
    minDistancePx,
    targetDistancePx,
    maxDistancePx
  ) => {
    if (distancePx < minDistancePx || distancePx > maxDistancePx) {
      return 0;
    }

    if (distancePx <= targetDistancePx) {
      const denominator = Math.max(1, targetDistancePx - minDistancePx);
      return 1 - (targetDistancePx - distancePx) / denominator;
    }

    const denominator = Math.max(1, maxDistancePx - targetDistancePx);
    return 1 - (distancePx - targetDistancePx) / denominator;
  };

  const getDetectedWaterHydrogenBondForPair = (
    leftMolecule,
    rightMolecule,
    viewportSizePx,
    minDistancePx,
    targetDistancePx,
    maxDistancePx
  ) => {
    if (!leftMolecule || !rightMolecule || leftMolecule.id === rightMolecule.id) {
      return null;
    }

    const leftOxygenAtom = getWaterMoleculeOxygenAtom(leftMolecule);
    const rightOxygenAtom = getWaterMoleculeOxygenAtom(rightMolecule);
    const leftHydrogenAtoms = getWaterMoleculeHydrogenAtoms(leftMolecule);
    const rightHydrogenAtoms = getWaterMoleculeHydrogenAtoms(rightMolecule);

    if (
      !leftOxygenAtom ||
      !rightOxygenAtom ||
      leftHydrogenAtoms.length === 0 ||
      rightHydrogenAtoms.length === 0
    ) {
      return null;
    }

    const candidates = [
      ...leftHydrogenAtoms.map((donorHydrogenAtom) => ({
        donorHydrogenAtom,
        acceptorOxygenAtom: rightOxygenAtom,
        donorMoleculeId: leftMolecule.id,
        acceptorMoleculeId: rightMolecule.id,
      })),
      ...rightHydrogenAtoms.map((donorHydrogenAtom) => ({
        donorHydrogenAtom,
        acceptorOxygenAtom: leftOxygenAtom,
        donorMoleculeId: rightMolecule.id,
        acceptorMoleculeId: leftMolecule.id,
      })),
    ]
      .map((candidate) => {
        const distancePx =
          Math.hypot(
            candidate.donorHydrogenAtom.position.x - candidate.acceptorOxygenAtom.position.x,
            candidate.donorHydrogenAtom.position.y - candidate.acceptorOxygenAtom.position.y
          ) * viewportSizePx;

        return {
          ...candidate,
          distancePx,
        };
      })
      .filter(({ distancePx }) => distancePx >= minDistancePx && distancePx <= maxDistancePx);

    if (candidates.length === 0) {
      return null;
    }

    const closestCandidate = candidates.reduce((bestCandidate, candidate) =>
      candidate.distancePx < bestCandidate.distancePx ? candidate : bestCandidate
    );
    const strength =
      getHydrogenBondStrength(
        closestCandidate.distancePx,
        minDistancePx,
        targetDistancePx,
        maxDistancePx
      ) * getHydrogenBondTemperatureFactor();

    if (strength <= 0) {
      return null;
    }

    return {
      ...closestCandidate,
      sourceMoleculeId: leftMolecule.id,
      targetMoleculeId: rightMolecule.id,
      strength,
    };
  };

  const getWaterClusterHydrogenBond = (memberMoleculeIds) => {
    const memberIdSet = new Set(memberMoleculeIds);

    for (const bond of bondsRef.current) {
      if (getBondCategory(bond) !== "hydrogenBond") {
        continue;
      }

      const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
      const leftAtom = getAtomById(leftAtomId);
      const rightAtom = getAtomById(rightAtomId);

      if (
        !leftAtom ||
        !rightAtom ||
        leftAtom.moleculeId === null ||
        rightAtom.moleculeId === null ||
        leftAtom.moleculeId === rightAtom.moleculeId ||
        !memberIdSet.has(leftAtom.moleculeId) ||
        !memberIdSet.has(rightAtom.moleculeId)
      ) {
        continue;
      }

      const donorHydrogenAtom =
        leftAtom.type === "H" ? leftAtom : rightAtom.type === "H" ? rightAtom : null;
      const acceptorOxygenAtom =
        leftAtom.type === "O" ? leftAtom : rightAtom.type === "O" ? rightAtom : null;

      if (!donorHydrogenAtom || !acceptorOxygenAtom) {
        continue;
      }

      return {
        donorHydrogenAtom,
        acceptorOxygenAtom,
        donorMoleculeId: donorHydrogenAtom.moleculeId,
        acceptorMoleculeId: acceptorOxygenAtom.moleculeId,
      };
    }

    if (memberMoleculeIds.length !== 2) {
      return null;
    }

    const [leftMolecule, rightMolecule] = memberMoleculeIds
      .map((moleculeId) => getMoleculeById(moleculeId))
      .filter(Boolean);

    if (
      !leftMolecule ||
      !rightMolecule ||
      leftMolecule.formula !== "H2O" ||
      rightMolecule.formula !== "H2O"
    ) {
      return null;
    }

    const viewportSizePx = Math.max(
      320,
      Math.min(
        viewportRef.current?.clientWidth ?? 600,
        viewportRef.current?.clientHeight ?? 600
      )
    );
    const scaledHydrogenBondRangePx = WATER_HYDROGEN_BOND_RANGE_PX * getVisualScale();
    const scaledHydrogenBondTargetPx = WATER_HYDROGEN_BOND_TARGET_PX * getVisualScale();
    const scaledHydrogenBondMinPx = WATER_HYDROGEN_BOND_MIN_PX * getVisualScale();

    return getDetectedWaterHydrogenBondForPair(
      leftMolecule,
      rightMolecule,
      viewportSizePx,
      scaledHydrogenBondMinPx,
      scaledHydrogenBondTargetPx,
      scaledHydrogenBondRangePx
    );
  };

  const getWaterDropletDisplayRadius = (molecule, hydrogenBondCount = 0) =>
    WATER_ORB_RADIUS_PX * getVisualScale() + Math.min(10, hydrogenBondCount * 4) * getVisualScale();

  const getWaterDropletOverlayStyle = (molecule, hydrogenBondCount = 0) => {
    const radius = getWaterDropletDisplayRadius(molecule, hydrogenBondCount);
    const diameter = radius * 2;
    const centerX = molecule.center?.x ?? 0.5;
    const centerY = molecule.center?.y ?? 0.5;

    return {
      left: `${(1 - centerX) * 100}%`,
      top: `${centerY * 100}%`,
      width: `${diameter}px`,
      height: `${diameter}px`,
      marginLeft: `${-radius}px`,
      marginTop: `${-radius}px`,
    };
  };

  const getMoleculeCanvasHitRadius = (molecule, canvas) =>
    Math.max(
      (molecule.radius ?? 0) * Math.min(canvas.width, canvas.height),
      getScaledMoleculeHitRadiusPx()
    );

  const removeBondsForAtomIds = (atomIds) => {
    const atomIdSet = new Set(atomIds);
    bondsRef.current = bondsRef.current.filter((bond) => {
      const [atomAId, atomBId] = getBondAtomIds(bond);
      return !atomIdSet.has(atomAId) && !atomIdSet.has(atomBId);
    });
  };

  const removeWaterClusterRecord = (clusterId) => {
    moleculesRef.current = moleculesRef.current.filter((molecule) => molecule.id !== clusterId);
    grabbedMoleculeIdsRef.current = new Set(
      [...grabbedMoleculeIdsRef.current].filter((moleculeId) => moleculeId !== clusterId)
    );

    if (hoveredMoleculeIdRef.current === clusterId) {
      hoveredMoleculeIdRef.current = null;
    }
  };

  const removeWaterClustersForMemberMoleculeIds = (moleculeIds) => {
    const memberMoleculeIdSet = new Set(moleculeIds);
    const clusterIdsToRemove = moleculesRef.current
      .filter(
        (molecule) =>
          isWaterClusterMolecule(molecule) &&
          (molecule.memberMoleculeIds ?? []).some((memberMoleculeId) =>
            memberMoleculeIdSet.has(memberMoleculeId)
          )
      )
      .map((molecule) => molecule.id);

    if (clusterIdsToRemove.length === 0) {
      return;
    }

    const clusterIdSet = new Set(clusterIdsToRemove);
    moleculesRef.current = moleculesRef.current.filter((molecule) => !clusterIdSet.has(molecule.id));
    grabbedMoleculeIdsRef.current = new Set(
      [...grabbedMoleculeIdsRef.current].filter((moleculeId) => !clusterIdSet.has(moleculeId))
    );

    if (
      hoveredMoleculeIdRef.current !== null &&
      clusterIdSet.has(hoveredMoleculeIdRef.current)
    ) {
      hoveredMoleculeIdRef.current = null;
    }
  };

  const removeMoleculeRecords = (moleculeIds) => {
    removeWaterClustersForMemberMoleculeIds(moleculeIds);
    const moleculeIdSet = new Set(moleculeIds);
    moleculesRef.current = moleculesRef.current.filter((molecule) => !moleculeIdSet.has(molecule.id));
    atomsRef.current = atomsRef.current.map((atom) =>
      moleculeIdSet.has(atom.moleculeId) ? { ...atom, moleculeId: null } : atom
    );
    grabbedMoleculeIdsRef.current = new Set(
      [...grabbedMoleculeIdsRef.current].filter((moleculeId) => !moleculeIdSet.has(moleculeId))
    );
    if (hoveredMoleculeIdRef.current !== null && moleculeIdSet.has(hoveredMoleculeIdRef.current)) {
      hoveredMoleculeIdRef.current = null;
    }
  };

  const buildMoleculeRecord = ({
    type,
    displayLabel,
    formula,
    atomIds,
    memberMoleculeIds = [],
    memberMoleculeOffsets = {},
    center,
    snapStartedAt,
    visualMode = "default",
    charge = 0,
    templateType = null,
  }) => {
    const promptAtoms = getAtomsByIds(atomIds);
    const moleculeId = nextMoleculeIdRef.current;
    const resolvedCenter = center ?? getAtomGroupCenter(promptAtoms);

    nextMoleculeIdRef.current += 1;
    moleculesRef.current = [
      ...moleculesRef.current,
      createMolecule({
        id: moleculeId,
        type,
        displayLabel,
        formula,
        atomIds,
        memberMoleculeIds,
        memberMoleculeOffsets,
        center: resolvedCenter,
        radius: getAtomGroupRadius(promptAtoms, resolvedCenter),
        atomOffsets: Object.fromEntries(
          promptAtoms.map((atom) => [
            atom.id,
            {
              x: atom.position.x - resolvedCenter.x,
              y: atom.position.y - resolvedCenter.y,
            },
          ])
        ),
        snapStartedAt,
        snapDuration: 260,
        originPositions: Object.fromEntries(
          promptAtoms.map((atom) => [atom.id, { ...atom.position }])
        ),
        visualMode,
        charge,
        templateType,
      }),
    ];
    atomsRef.current = atomsRef.current.map((atom) =>
      atomIds.includes(atom.id) ? { ...atom, moleculeId } : atom
    );

    spawnFormationEffect(resolvedCenter, getMixedNeonRgb(promptAtoms.map((atom) => atom.type)));
    playFormationSound();
    registerMoleculeDiscovery(formula);
    addNotebookEntry(
      `Formed ${displayLabel}${MOLECULE_INFO[formula] ? ` — ${MOLECULE_INFO[formula].name}` : ""}`
    );

    return moleculeId;
  };

  const buildWaterClusterRecord = ({ sourceMoleculeIds, comboKey }) => {
    const sourceMolecules = sourceMoleculeIds
      .map((moleculeId) => getMoleculeById(moleculeId))
      .filter(Boolean);
    const hydrogenBond = getWaterClusterHydrogenBond(sourceMoleculeIds);

    if (
      sourceMolecules.length !== 2 ||
      sourceMolecules.some((molecule) => molecule.formula !== "H2O") ||
      !hydrogenBond
    ) {
      return null;
    }

    const clusterAtoms = sourceMolecules.flatMap((molecule) => getMoleculeAtoms(molecule));
    const center = getAtomGroupCenter(clusterAtoms);
    const clusterId = nextMoleculeIdRef.current;
    const orderedSourceMoleculeIds = [
      hydrogenBond.donorMoleculeId,
      hydrogenBond.acceptorMoleculeId,
    ];

    nextMoleculeIdRef.current += 1;
    moleculesRef.current = moleculesRef.current.map((molecule) =>
      orderedSourceMoleculeIds.includes(molecule.id)
        ? {
            ...molecule,
            visualMode: "default",
          }
        : molecule
    );
    moleculesRef.current = [
      ...moleculesRef.current,
      createMolecule({
        id: clusterId,
        type: "waterCluster",
        displayLabel: "2H2O",
        formula: "2H2O",
        atomIds: sourceMolecules.flatMap((molecule) => molecule.atomIds),
        memberMoleculeIds: orderedSourceMoleculeIds,
        memberMoleculeOffsets: Object.fromEntries(
          sourceMolecules.map((molecule) => [
            molecule.id,
            {
              x: (molecule.center?.x ?? center.x) - center.x,
              y: (molecule.center?.y ?? center.y) - center.y,
            },
          ])
        ),
        center,
        radius: getAtomGroupRadius(clusterAtoms, center),
        atomOffsets: Object.fromEntries(
          clusterAtoms.map((atom) => [
            atom.id,
            {
              x: atom.position.x - center.x,
              y: atom.position.y - center.y,
            },
          ])
        ),
        snapStartedAt: performance.now(),
        snapDuration: 260,
        originPositions: Object.fromEntries(
          clusterAtoms.map((atom) => [atom.id, { ...atom.position }])
        ),
      }),
    ];

    setPromptedComboStatus(comboKey, "accepted");
    spawnFormationEffect(center, getMixedNeonRgb(clusterAtoms.map((atom) => atom.type)));
    playFormationSound();
    registerMoleculeDiscovery("2H2O");
    addNotebookEntry("Formed 2H2O — Water dimer (hydrogen bonded)");
    return clusterId;
  };

  const getWaterHydrogenBondData = () => {
    const waterMolecules = moleculesRef.current.filter(
      (molecule) => molecule.formula === "H2O" && !getClusterForMemberMoleculeId(molecule.id)
    );
    const bonds = [];
    const counts = new Map();
    const viewportSizePx = Math.max(
      320,
      Math.min(
        viewportRef.current?.clientWidth ?? 600,
        viewportRef.current?.clientHeight ?? 600
      )
    );

    const scaledHydrogenBondRangePx = WATER_HYDROGEN_BOND_RANGE_PX * getVisualScale();
    const scaledHydrogenBondTargetPx = WATER_HYDROGEN_BOND_TARGET_PX * getVisualScale();
    const scaledHydrogenBondMinPx = WATER_HYDROGEN_BOND_MIN_PX * getVisualScale();

    for (let leftIndex = 0; leftIndex < waterMolecules.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < waterMolecules.length; rightIndex += 1) {
        const leftMolecule = waterMolecules[leftIndex];
        const rightMolecule = waterMolecules[rightIndex];
        const hasExplicitHydrogenBond = bondsRef.current.some((bond) => {
          if (getBondCategory(bond) !== "hydrogenBond") {
            return false;
          }

          const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
          const leftAtom = getAtomById(leftAtomId);
          const rightAtom = getAtomById(rightAtomId);

          if (!leftAtom || !rightAtom) {
            return false;
          }

          const bondMoleculeIds = [leftAtom.moleculeId, rightAtom.moleculeId].sort(
            (left, right) => left - right
          );
          const waterMoleculeIds = [leftMolecule.id, rightMolecule.id].sort(
            (left, right) => left - right
          );

          return (
            bondMoleculeIds[0] === waterMoleculeIds[0] &&
            bondMoleculeIds[1] === waterMoleculeIds[1]
          );
        });

        if (hasExplicitHydrogenBond) {
          continue;
        }

        const hydrogenBond = getDetectedWaterHydrogenBondForPair(
          leftMolecule,
          rightMolecule,
          viewportSizePx,
          scaledHydrogenBondMinPx,
          scaledHydrogenBondTargetPx,
          scaledHydrogenBondRangePx
        );

        if (!hydrogenBond) {
          continue;
        }

        bonds.push(hydrogenBond);
        counts.set(leftMolecule.id, (counts.get(leftMolecule.id) ?? 0) + 1);
        counts.set(rightMolecule.id, (counts.get(rightMolecule.id) ?? 0) + 1);
      }
    }

    return { bonds, counts };
  };

  const hasDetectedWaterHydrogenBondBetweenMolecules = (moleculeIds) => {
    const sourceIds = [...moleculeIds].sort((left, right) => left - right);

    return getWaterHydrogenBondData().bonds.some((bond) => {
      const bondMoleculeIds = [bond.sourceMoleculeId, bond.targetMoleculeId].sort(
        (left, right) => left - right
      );

      return (
        bondMoleculeIds[0] === sourceIds[0] &&
        bondMoleculeIds[1] === sourceIds[1]
      );
    });
  };

  const getAtomGroupCenter = (groupAtoms) => {
    if (groupAtoms.length === 0) {
      return { x: 0.5, y: 0.5 };
    }

    const total = groupAtoms.reduce(
      (sum, atom) => ({
        x: sum.x + atom.position.x,
        y: sum.y + atom.position.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: total.x / groupAtoms.length,
      y: total.y / groupAtoms.length,
    };
  };

  const getAtomGroupRadius = (groupAtoms, center) => {
    if (groupAtoms.length === 0) {
      return 0.08;
    }

    return (
      groupAtoms.reduce(
        (maxDistance, atom) =>
          Math.max(
            maxDistance,
            Math.hypot(atom.position.x - center.x, atom.position.y - center.y)
          ),
        0
      ) + 0.06
    );
  };

  const releaseMolecule = (moleculeId) => {
    const molecule = getMoleculeById(moleculeId);

    if (!molecule) {
      return;
    }

    if (isWaterClusterMolecule(molecule)) {
      removeWaterClusterRecord(moleculeId);
      return;
    }

    removeWaterClustersForMemberMoleculeIds([moleculeId]);
    moleculesRef.current = moleculesRef.current.filter((entry) => entry.id !== moleculeId);
    atomsRef.current = atomsRef.current.map((atom) =>
      atom.moleculeId === moleculeId ? { ...atom, moleculeId: null } : atom
    );
  };

  const deleteMoleculeCompletely = (moleculeId) => {
    const molecule = getMoleculeById(moleculeId);

    if (isWaterClusterMolecule(molecule)) {
      const memberMolecules = (molecule.memberMoleculeIds ?? [])
        .map((memberMoleculeId) => getMoleculeById(memberMoleculeId))
        .filter(Boolean);
      const atomIdsToDelete = new Set(
        memberMolecules.flatMap((memberMolecule) => memberMolecule.atomIds)
      );
      const moleculeIdsToDelete = new Set([moleculeId, ...memberMolecules.map(({ id }) => id)]);
      const selectedAtomId =
        selectedAtomIndexRef.current !== null ? atomsRef.current[selectedAtomIndexRef.current]?.id : null;

      moleculesRef.current = moleculesRef.current.filter(
        (entry) => !moleculeIdsToDelete.has(entry.id)
      );
      atomsRef.current = atomsRef.current.filter((atom) => !atomIdsToDelete.has(atom.id));
      bondsRef.current = bondsRef.current.filter((bond) => {
        const atomIds = getBondAtomIds(bond);
        return !atomIds.some((atomId) => atomIdsToDelete.has(atomId));
      });
      clearTempBondsForAtomIds(atomIdsToDelete);
      hoveredMoleculeIdRef.current =
        hoveredMoleculeIdRef.current !== null && moleculeIdsToDelete.has(hoveredMoleculeIdRef.current)
          ? null
          : hoveredMoleculeIdRef.current;
      grabbedMoleculeIdsRef.current = new Set(
        [...grabbedMoleculeIdsRef.current].filter(
          (grabbedMoleculeId) => !moleculeIdsToDelete.has(grabbedMoleculeId)
        )
      );

      if (selectedAtomId !== null && atomIdsToDelete.has(selectedAtomId)) {
        setSelectedAtom(null);
        return;
      }

      if (selectedAtomId !== null) {
        const nextSelectedAtomIndex = atomsRef.current.findIndex((atom) => atom.id === selectedAtomId);
        setSelectedAtom(nextSelectedAtomIndex >= 0 ? nextSelectedAtomIndex : null);
      }

      return;
    }

    const atomIdsToDelete = new Set(
      atomsRef.current
        .filter((atom) => atom.moleculeId === moleculeId)
        .map((atom) => atom.id)
    );

    if (atomIdsToDelete.size === 0) {
      releaseMolecule(moleculeId);
      return;
    }

    const selectedAtomId =
      selectedAtomIndexRef.current !== null ? atomsRef.current[selectedAtomIndexRef.current]?.id : null;

    removeWaterClustersForMemberMoleculeIds([moleculeId]);
    moleculesRef.current = moleculesRef.current.filter((molecule) => molecule.id !== moleculeId);
    atomsRef.current = atomsRef.current.filter((atom) => !atomIdsToDelete.has(atom.id));
    bondsRef.current = bondsRef.current.filter((bond) => {
      const atomIds = getBondAtomIds(bond);
      return !atomIds.some((atomId) => atomIdsToDelete.has(atomId));
    });
    clearTempBondsForAtomIds(atomIdsToDelete);
    hoveredMoleculeIdRef.current =
      hoveredMoleculeIdRef.current === moleculeId ? null : hoveredMoleculeIdRef.current;
    grabbedMoleculeIdsRef.current = new Set(
      [...grabbedMoleculeIdsRef.current].filter((grabbedMoleculeId) => grabbedMoleculeId !== moleculeId)
    );

    if (selectedAtomId !== null && atomIdsToDelete.has(selectedAtomId)) {
      setSelectedAtom(null);
      return;
    }

    if (selectedAtomId !== null) {
      const nextSelectedAtomIndex = atomsRef.current.findIndex((atom) => atom.id === selectedAtomId);
      setSelectedAtom(nextSelectedAtomIndex >= 0 ? nextSelectedAtomIndex : null);
    }
  };

  const setBondingModeState = (nextValueOrUpdater) => {
    setBondingMode((current) => {
      const nextValue =
        typeof nextValueOrUpdater === "function" ? nextValueOrUpdater(current) : nextValueOrUpdater;
      bondingModeRef.current = nextValue;

      if (nextValue) {
        tempBondStateRef.current = { mouse: null };
      }

      return nextValue;
    });
  };

  const toggleBondingMode = () => {
    setBondingModeState((current) => !current);
  };

  const createBond = (startAtomId, endAtomId, options = {}) => {
      const { enforceBondLimits = false, type = "single" } = options;

    if (startAtomId === endAtomId) {
      return false;
    }

    const bondKey = getBondKey(startAtomId, endAtomId);

    if (
      bondsRef.current.some(
        (bond) => {
          const [atomAId, atomBId] = getBondAtomIds(bond);
          return getBondKey(atomAId, atomBId) === bondKey;
        }
      )
    ) {
      return false;
    }

    const startAtom = getAtomById(startAtomId);
    const endAtom = getAtomById(endAtomId);

    if (!startAtom || !endAtom) {
      return false;
    }

    const isIntermolecularHydrogenBond = isAllowedIntermolecularHydrogenBond(startAtom, endAtom);

    // Sodium is a metal: it doesn't share electrons covalently. Only allow
    // ionic pairings (Na-Cl, and Na-O for NaOH / Na2O).
    if (
      enforceBondLimits &&
      ((startAtom.type === "Na" && endAtom.type !== "Cl" && endAtom.type !== "O") ||
        (endAtom.type === "Na" && startAtom.type !== "Cl" && startAtom.type !== "O"))
    ) {
      showBondLimitMessage();
      return false;
    }

    if (enforceBondLimits && !isIntermolecularHydrogenBond) {
      const startBondLimit = getAtomBondLimit(startAtom.type);
      const endBondLimit = getAtomBondLimit(endAtom.type);
      const startBondCount = getBondCountForAtom(startAtomId);
      const endBondCount = getBondCountForAtom(endAtomId);

      if (startBondCount >= startBondLimit || endBondCount >= endBondLimit) {
        showBondLimitMessage();
        return false;
      }
    }

    if (
      enforceBondLimits &&
      startAtom.moleculeId !== null &&
      endAtom.moleculeId !== null &&
      !isIntermolecularHydrogenBond
    ) {
      return false;
    }

    bondsRef.current = [
      ...bondsRef.current,
      createBondRecord(
        startAtomId,
        endAtomId,
        isIntermolecularHydrogenBond ? "single" : type,
        isIntermolecularHydrogenBond ? "hydrogenBond" : "covalent"
      ),
    ];
    return true;
  };

  const setBondType = (leftAtomId, rightAtomId, type) => {
    const bondKey = getBondKey(leftAtomId, rightAtomId);
    let didUpdate = false;

    bondsRef.current = bondsRef.current.map((bond) => {
      const [atomAId, atomBId] = getBondAtomIds(bond);

      if (getBondKey(atomAId, atomBId) !== bondKey || getBondCategory(bond) !== "covalent") {
        return bond;
      }

      didUpdate = true;
      return {
        ...bond,
        type,
      };
    });

    return didUpdate;
  };

  const confirmMoleculeFormation = (prompt) => {
    if (!prompt) {
      return;
    }

    const promptAtoms = getAtomsByIds(prompt.atomIds);
    const availablePromptAtoms = promptAtoms.filter((atom) => atom.moleculeId === null);

    if (prompt.kind === "generic") {
      const template = GENERIC_MOLECULE_TEMPLATES.find((entry) => entry.type === prompt.type);
      // prompt.atomIds are already role-ordered (matched to template.layout).
      const roleAtoms = prompt.atomIds.map((atomId) => getAtomById(atomId));

      if (
        !template ||
        roleAtoms.length !== template.layout.length ||
        roleAtoms.some(
          (atom, roleIndex) => !atom || atom.moleculeId !== null || atom.type !== template.layout[roleIndex].type
        )
      ) {
        setMoleculePromptState(null);
        return;
      }

      // Normalize the user's bonds into the template's correct structure
      // (right connectivity and bond orders).
      removeBondsForAtomIds(prompt.atomIds);

      for (const bond of template.bonds) {
        createBond(roleAtoms[bond.a].id, roleAtoms[bond.b].id, { type: bond.order ?? "single" });
      }

      buildMoleculeRecord({
        type: template.type,
        displayLabel: template.displayLabel,
        formula: template.formula,
        atomIds: prompt.atomIds,
        center: { ...roleAtoms[0].position },
        snapStartedAt: performance.now(),
        charge: template.charge ?? 0,
        templateType: template.type,
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.kind === "genericReaction") {
      const reaction = REACTION_TEMPLATES.find((entry) => entry.type === prompt.type);
      const sourceMolecules = prompt.sourceMoleculeIds
        .map((moleculeId) => getMoleculeById(moleculeId))
        .filter(Boolean);
      const sourceAtoms = (prompt.sourceAtomIds ?? [])
        .map((atomId) => getAtomById(atomId))
        .filter(Boolean);

      if (
        !reaction ||
        sourceMolecules.length !== prompt.sourceMoleculeIds.length ||
        sourceAtoms.length !== (prompt.sourceAtomIds ?? []).length ||
        sourceAtoms.some((atom) => atom.moleculeId !== null)
      ) {
        setMoleculePromptState(null);
        return;
      }

      const allAtomIds = [
        ...sourceMolecules.flatMap((molecule) => molecule.atomIds),
        ...sourceAtoms.map((atom) => atom.id),
      ];
      const reactionCentroid = getAtomGroupCenter(getAtomsByIds(allAtomIds));

      removeMoleculeRecords(prompt.sourceMoleculeIds);
      removeBondsForAtomIds(allAtomIds);

      const atomPool = getAtomsByIds(allAtomIds);

      const productMoleculeIds = reaction.products
        .map((productFormula, productIndex) => {
          const offset = getReactionProductOffset(reaction.products.length, productIndex);

          return buildReactionProduct(productFormula, atomPool, {
            x: clampValue(reactionCentroid.x + offset.x, 0.12, 0.88),
            y: clampValue(reactionCentroid.y + offset.y, 0.12, 0.88),
          });
        })
        .filter((moleculeId) => moleculeId !== null && moleculeId !== undefined);

      // Products sit close together, which would immediately re-trigger the
      // follow-up detectors (CO2+H2O -> carbonic acid, H2O+H2O -> dimer).
      // Pre-mark those combos so freshly made products don't nag the user.
      const productWaterIds = productMoleculeIds.filter(
        (moleculeId) => getMoleculeById(moleculeId)?.formula === "H2O"
      );
      const productCarbonDioxideIds = productMoleculeIds.filter(
        (moleculeId) => getMoleculeById(moleculeId)?.formula === "CO2"
      );

      for (const carbonDioxideId of productCarbonDioxideIds) {
        for (const waterId of productWaterIds) {
          setPromptedComboStatus(getMoleculeIdComboKey([waterId, carbonDioxideId]), "declined");
        }
      }

      for (let leftIndex = 0; leftIndex < productWaterIds.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < productWaterIds.length; rightIndex += 1) {
          const waterPairIds = [productWaterIds[leftIndex], productWaterIds[rightIndex]];
          const dimerComboKey = getMoleculeIdComboKey(waterPairIds);

          if (reaction.autoClusterWaters) {
            // The "2 H2O" in the equation becomes the water dimer directly —
            // snap them together once the product waters settle, no prompt.
            setPromptedComboStatus(dimerComboKey, "accepted");
            window.setTimeout(() => {
              const clusterId = buildWaterClusterRecord({
                sourceMoleculeIds: waterPairIds,
                comboKey: dimerComboKey,
              });

              if (clusterId === null) {
                // Waters may still be settling — one retry.
                window.setTimeout(() => {
                  buildWaterClusterRecord({
                    sourceMoleculeIds: waterPairIds,
                    comboKey: dimerComboKey,
                  });
                }, 1100);
              }
            }, 900);
          } else {
            setPromptedComboStatus(dimerComboKey, "declined");
          }
        }
      }

      spawnReactionBurst(reactionCentroid, reaction.energy);
      playReactionSound();
      addNotebookEntry(
        `Reaction: ${reaction.equation} (${reaction.energy}${
          reaction.deltaH !== undefined ? `, ΔH ≈ ${reaction.deltaH} kJ/mol` : ""
        })`
      );
      showEnergyDiagram({
        equation: reaction.equation,
        energy: reaction.energy,
        deltaH: reaction.deltaH,
      });
      showEventBanner(
        { kind: "reaction", title: "Reaction!", subtitle: reaction.equation },
        3400
      );
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.kind === "reaction" && prompt.type === "carbonicAcid") {
      const sourceMolecules = prompt.sourceMoleculeIds
        .map((moleculeId) => getMoleculeById(moleculeId))
        .filter(Boolean);

      if (sourceMolecules.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      const waterMolecule = sourceMolecules.find((molecule) => molecule.formula === "H2O");
      const carbonDioxideMolecule = sourceMolecules.find((molecule) => molecule.formula === "CO2");

      if (!waterMolecule || !carbonDioxideMolecule) {
        setMoleculePromptState(null);
        return;
      }

      const reactionAtoms = getAtomsByIds(prompt.atomIds);
      const carbonAtom = reactionAtoms.find((atom) => atom.type === "C");
      const hydrogenAtoms = reactionAtoms
        .filter((atom) => atom.type === "H")
        .sort((left, right) => left.position.x - right.position.x);
      const oxygenAtoms = reactionAtoms
        .filter((atom) => atom.type === "O")
        .sort((left, right) => left.position.x - right.position.x);

      if (!carbonAtom || hydrogenAtoms.length !== 2 || oxygenAtoms.length !== 3) {
        setMoleculePromptState(null);
        return;
      }

      removeMoleculeRecords(prompt.sourceMoleculeIds);
      removeBondsForAtomIds(prompt.atomIds);

      createBond(carbonAtom.id, oxygenAtoms[1].id, { type: "double" });
      createBond(carbonAtom.id, oxygenAtoms[0].id);
      createBond(carbonAtom.id, oxygenAtoms[2].id);
      createBond(oxygenAtoms[0].id, hydrogenAtoms[0].id);
      createBond(oxygenAtoms[2].id, hydrogenAtoms[1].id);

      buildMoleculeRecord({
        type: "carbonicAcid",
        displayLabel: "H2CO3",
        formula: "H2CO3",
        atomIds: [
          carbonAtom.id,
          oxygenAtoms[1].id,
          oxygenAtoms[0].id,
          oxygenAtoms[2].id,
          hydrogenAtoms[0].id,
          hydrogenAtoms[1].id,
        ],
        center: { ...carbonAtom.position },
        snapStartedAt: performance.now(),
      });

      addNotebookEntry("Reaction: CO2 + H2O → H2CO3 (exothermic, ΔH ≈ −20 kJ/mol)");
      showEnergyDiagram({
        equation: "CO2 + H2O → H2CO3",
        energy: "exothermic",
        deltaH: -20,
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "water") {
      const oxygenAtom = availablePromptAtoms.find((atom) => atom.type === "O");
      const hydrogenAtoms = availablePromptAtoms.filter((atom) => atom.type === "H");

      if (!oxygenAtom || hydrogenAtoms.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      createBond(oxygenAtom.id, hydrogenAtoms[0].id);
      createBond(oxygenAtom.id, hydrogenAtoms[1].id);
      buildMoleculeRecord({
        type: "water",
        displayLabel: "H2O",
        formula: "H2O",
        atomIds: [oxygenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
        visualMode: "default",
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "hydrogen") {
      const hydrogenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "H")
        .sort((left, right) => left.position.x - right.position.x);

      if (hydrogenAtoms.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      setBondType(hydrogenAtoms[0].id, hydrogenAtoms[1].id, "single");
      buildMoleculeRecord({
        type: "hydrogen",
        displayLabel: "H2",
        formula: "H2",
        atomIds: hydrogenAtoms.map((atom) => atom.id),
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "carbonMonoxide") {
      const carbonAtom = availablePromptAtoms.find((atom) => atom.type === "C");
      const oxygenAtom = availablePromptAtoms.find((atom) => atom.type === "O");

      if (!carbonAtom || !oxygenAtom) {
        setMoleculePromptState(null);
        return;
      }

      setBondType(carbonAtom.id, oxygenAtom.id, "triple");
      buildMoleculeRecord({
        type: "carbonMonoxide",
        displayLabel: "CO",
        formula: "CO",
        atomIds: [carbonAtom.id, oxygenAtom.id],
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "oxygen") {
      const oxygenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "O")
        .sort((left, right) => left.position.x - right.position.x);

      if (oxygenAtoms.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      setBondType(oxygenAtoms[0].id, oxygenAtoms[1].id, "double");
      buildMoleculeRecord({
        type: "oxygen",
        displayLabel: "O2",
        formula: "O2",
        atomIds: oxygenAtoms.map((atom) => atom.id),
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "nitrogen") {
      const nitrogenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "N")
        .sort((left, right) => left.position.x - right.position.x);

      if (nitrogenAtoms.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      setBondType(nitrogenAtoms[0].id, nitrogenAtoms[1].id, "triple");
      buildMoleculeRecord({
        type: "nitrogen",
        displayLabel: "N2",
        formula: "N2",
        atomIds: nitrogenAtoms.map((atom) => atom.id),
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.kind === "cluster" && prompt.type === "waterDimer") {
      const sourceMolecules = prompt.sourceMoleculeIds
        .map((moleculeId) => getMoleculeById(moleculeId))
        .filter(Boolean);

      if (
        sourceMolecules.length !== 2 ||
        sourceMolecules.some((molecule) => molecule.formula !== "H2O")
      ) {
        setMoleculePromptState(null);
        return;
      }

      const hasHydrogenBond =
        bondsRef.current.some((bond) => {
          if (getBondCategory(bond) !== "hydrogenBond") {
            return false;
          }

          const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
          const leftAtom = getAtomById(leftAtomId);
          const rightAtom = getAtomById(rightAtomId);

          if (!leftAtom || !rightAtom) {
            return false;
          }

          const bondMoleculeIds = [leftAtom.moleculeId, rightAtom.moleculeId].sort(
            (left, right) => left - right
          );
          const sourceIds = [...prompt.sourceMoleculeIds].sort((left, right) => left - right);

          return (
            bondMoleculeIds[0] === sourceIds[0] &&
            bondMoleculeIds[1] === sourceIds[1]
          );
        }) ||
        hasDetectedWaterHydrogenBondBetweenMolecules(prompt.sourceMoleculeIds);

      if (!hasHydrogenBond || getClusterForMemberMoleculeId(prompt.sourceMoleculeIds[0])) {
        setMoleculePromptState(null);
        return;
      }

      buildWaterClusterRecord({
        sourceMoleculeIds: prompt.sourceMoleculeIds,
        comboKey: prompt.comboKey,
      });
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "carbonDioxide") {
      const carbonAtom = availablePromptAtoms.find((atom) => atom.type === "C");
      const oxygenAtoms = availablePromptAtoms.filter((atom) => atom.type === "O");

      if (!carbonAtom || oxygenAtoms.length !== 2) {
        setMoleculePromptState(null);
        return;
      }

      createBond(carbonAtom.id, oxygenAtoms[0].id, { type: "double" });
      createBond(carbonAtom.id, oxygenAtoms[1].id, { type: "double" });

      const orderedOxygenAtoms = [...oxygenAtoms].sort(
        (left, right) => left.position.x - right.position.x
      );
      buildMoleculeRecord({
        type: "carbonDioxide",
        displayLabel: "CO2",
        formula: "CO2",
        atomIds: [orderedOxygenAtoms[0].id, carbonAtom.id, orderedOxygenAtoms[1].id],
        center: { ...carbonAtom.position },
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "methane") {
      const carbonAtom = availablePromptAtoms.find((atom) => atom.type === "C");
      const hydrogenAtoms = availablePromptAtoms.filter((atom) => atom.type === "H");

      if (!carbonAtom || hydrogenAtoms.length !== 4) {
        setMoleculePromptState(null);
        return;
      }

      hydrogenAtoms.forEach((hydrogenAtom) => {
        createBond(carbonAtom.id, hydrogenAtom.id);
      });

      const orderedHydrogenAtoms = [...hydrogenAtoms].sort((left, right) => {
        if (left.position.y !== right.position.y) {
          return left.position.y - right.position.y;
        }

        return left.position.x - right.position.x;
      });
      buildMoleculeRecord({
        type: "methane",
        displayLabel: "CH4",
        formula: "CH4",
        atomIds: [carbonAtom.id, ...orderedHydrogenAtoms.map((atom) => atom.id)],
        center: { ...carbonAtom.position },
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "ammonia") {
      const nitrogenAtom = availablePromptAtoms.find((atom) => atom.type === "N");
      const hydrogenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "H")
        .sort((left, right) => {
          if (left.position.y !== right.position.y) {
            return left.position.y - right.position.y;
          }

          return left.position.x - right.position.x;
        });

      if (!nitrogenAtom || hydrogenAtoms.length !== 3) {
        setMoleculePromptState(null);
        return;
      }

      hydrogenAtoms.forEach((hydrogenAtom) => {
        setBondType(nitrogenAtom.id, hydrogenAtom.id, "single");
      });

      buildMoleculeRecord({
        type: "ammonia",
        displayLabel: "NH3",
        formula: "NH3",
        atomIds: [nitrogenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center: { ...nitrogenAtom.position },
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "hydronium") {
      const oxygenAtom = availablePromptAtoms.find((atom) => atom.type === "O");
      const hydrogenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "H")
        .sort((left, right) => {
          if (left.position.y !== right.position.y) {
            return left.position.y - right.position.y;
          }

          return left.position.x - right.position.x;
        });

      if (!oxygenAtom || hydrogenAtoms.length !== 3) {
        setMoleculePromptState(null);
        return;
      }

      hydrogenAtoms.forEach((hydrogenAtom) => {
        setBondType(oxygenAtom.id, hydrogenAtom.id, "single");
      });

      buildMoleculeRecord({
        type: "hydronium",
        displayLabel: "H3O⁺",
        formula: "H3O+",
        atomIds: [oxygenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center: { ...oxygenAtom.position },
        snapStartedAt: performance.now(),
        charge: 1,
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "ammonium") {
      const nitrogenAtom = availablePromptAtoms.find((atom) => atom.type === "N");
      const hydrogenAtoms = [...availablePromptAtoms]
        .filter((atom) => atom.type === "H")
        .sort((left, right) => {
          if (left.position.y !== right.position.y) {
            return left.position.y - right.position.y;
          }

          return left.position.x - right.position.x;
        });

      if (!nitrogenAtom || hydrogenAtoms.length !== 4) {
        setMoleculePromptState(null);
        return;
      }

      hydrogenAtoms.forEach((hydrogenAtom) => {
        setBondType(nitrogenAtom.id, hydrogenAtom.id, "single");
      });

      buildMoleculeRecord({
        type: "ammonium",
        displayLabel: "NH4⁺",
        formula: "NH4+",
        atomIds: [nitrogenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center: { ...nitrogenAtom.position },
        snapStartedAt: performance.now(),
        charge: 1,
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }

    if (prompt.type === "sodiumChloride") {
      const sodiumAtom = availablePromptAtoms.find((atom) => atom.type === "Na");
      const chlorineAtom = availablePromptAtoms.find((atom) => atom.type === "Cl");

      if (!sodiumAtom || !chlorineAtom) {
        setMoleculePromptState(null);
        return;
      }

      setBondType(sodiumAtom.id, chlorineAtom.id, "single");
      buildMoleculeRecord({
        type: "sodiumChloride",
        displayLabel: "NaCl",
        formula: "NaCl",
        atomIds: [sodiumAtom.id, chlorineAtom.id],
        center: getAtomGroupCenter(promptAtoms),
        snapStartedAt: performance.now(),
      });
      setPromptedComboStatus(prompt.comboKey, "accepted");
      setMoleculePromptState(null);
      return;
    }
  };

  const declineMoleculeFormation = (prompt) => {
    if (!prompt) {
      return;
    }

    setPromptedComboStatus(prompt.comboKey, "declined");
    setMoleculePromptState(null);
  };

  const spawnAtom = (type) => {
    const spawnIndex = spawnCountRef.current;
    const offsetX = ((spawnIndex % 3) - 1) * 0.06;
    const offsetY = (Math.floor(spawnIndex / 3) % 2) * 0.06 - 0.03;
    const position = {
      x: Math.min(0.8, Math.max(0.2, 0.5 + offsetX)),
      y: Math.min(0.8, Math.max(0.2, 0.5 + offsetY)),
    };

    atomsRef.current = [
      ...atomsRef.current,
      createAtom(nextAtomIdRef.current, type, position),
    ];
    nextAtomIdRef.current += 1;
    spawnCountRef.current += 1;
  };

  const toggleDeleteMode = () => {
    setDeleteMode((current) => {
      const nextValue = !current;
      deleteModeRef.current = nextValue;
      return nextValue;
    });
  };

  const getCanvasCoordinatesFromMouseEvent = (event) => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;

    if (!viewport || !canvas) {
      return null;
    }

    const bounds = viewport.getBoundingClientRect();
    const relativeX = ((event.clientX - bounds.left) / bounds.width) * canvas.width;
    const relativeY = ((event.clientY - bounds.top) / bounds.height) * canvas.height;

    return {
      x: canvas.width - relativeX,
      y: relativeY,
    };
  };

  // Nearest atom within the hit radius wins (not first-in-array), so
  // overlapping atoms resolve to the one the user actually aimed at.
  const findAtomIndexAtCanvasPoint = (canvasX, canvasY, hitRadius = getScaledAtomRadiusPx()) => {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    atomsRef.current.forEach(({ position }, index) => {
      const atomX = position.x * canvasRef.current.width;
      const atomY = position.y * canvasRef.current.height;
      const distance = Math.hypot(canvasX - atomX, canvasY - atomY);

      if (distance <= hitRadius && distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  const handleAtomSizeScaleChange = (event) => {
    const nextValue = Number(event.target.value);
    atomSizeScaleRef.current = nextValue;
    setAtomSizeScale(nextValue);
  };

  const handleShowLonePairsChange = (event) => {
    const nextValue = event.target.checked;
    showLonePairsRef.current = nextValue;
    setShowLonePairs(nextValue);
  };

  const handleTemperatureChange = (event) => {
    const nextValue = Number(event.target.value);
    temperatureRef.current = nextValue;
    setTemperature(nextValue);
  };

  // Hydrogen bonds weaken as the lab heats up and are gone near boiling;
  // slight strengthening when cold.
  const getHydrogenBondTemperatureFactor = () =>
    clampValue(1.15 - Math.max(0, temperatureRef.current - 40) / 55, 0, 1.15);

  const handleShowPolarityChange = (event) => {
    const nextValue = event.target.checked;
    showPolarityRef.current = nextValue;
    setShowPolarity(nextValue);
  };

  const handleLewisViewChange = (event) => {
    const nextValue = event.target.checked;
    lewisViewRef.current = nextValue;
    setLewisView(nextValue);
  };

  const handleSoundEnabledChange = (event) => {
    const nextValue = event.target.checked;
    soundEnabledRef.current = nextValue;
    setSoundEnabled(nextValue);
  };

  const finalizeBondAtCanvasPoint = (startAtomId, canvasX, canvasY) => {
    const targetAtomIndex = findAtomIndexAtCanvasPoint(
      canvasX,
      canvasY,
      getScaledAtomBondHitRadiusPx()
    );
    const targetAtom = targetAtomIndex >= 0 ? atomsRef.current[targetAtomIndex] : null;

    if (!targetAtom || targetAtom.id === startAtomId) {
      return false;
    }

    return createBond(startAtomId, targetAtom.id, { enforceBondLimits: bondingModeRef.current });
  };

  const findMoleculeAtCanvasPointForPointer = (canvasX, canvasY) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    return (
      [...moleculesRef.current]
        .sort((left, right) => {
          if (left.formula === "2H2O" && right.formula !== "2H2O") {
            return -1;
          }

          if (left.formula !== "2H2O" && right.formula === "2H2O") {
            return 1;
          }

          return 0;
        })
        .find((molecule) => {
          if (!molecule.center || molecule.radius === undefined) {
            return false;
          }

          const centerX = molecule.center.x * canvas.width;
          const centerY = molecule.center.y * canvas.height;
          const hitRadius = getMoleculeCanvasHitRadius(molecule, canvas);

          return Math.hypot(canvasX - centerX, canvasY - centerY) <= hitRadius;
        }) ?? null
    );
  };

  const handleViewportPointerDown = (event) => {
    if (atomicExpansionAtomRef.current) {
      return;
    }

    if (event.target !== viewportRef.current && event.target !== videoRef.current) {
      return;
    }

    if (deleteModeRef.current) {
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event);
    const canvas = canvasRef.current;

    if (!canvasPoint || !canvas) {
      return;
    }

    if (bondingModeRef.current) {
      const atomIndex = findAtomIndexAtCanvasPoint(
        canvasPoint.x,
        canvasPoint.y,
        getScaledAtomBondHitRadiusPx()
      );
      const atom = atomIndex >= 0 ? atomsRef.current[atomIndex] : null;

      if (!atom) {
        return;
      }

      tempBondStateRef.current.mouse = {
        startAtomId: atom.id,
        currentPosition: canvasPoint,
      };
      return;
    }

    // Touch/mouse grab: loose atoms drag directly, atoms in a molecule drag the molecule.
    const normalizedPoint = {
      x: canvasPoint.x / canvas.width,
      y: canvasPoint.y / canvas.height,
    };
    const grabbedAtomIndex = findAtomIndexAtCanvasPoint(
      canvasPoint.x,
      canvasPoint.y,
      getScaledAtomGrabRadiusPx()
    );
    const grabbedAtom = grabbedAtomIndex >= 0 ? atomsRef.current[grabbedAtomIndex] : null;

    if (grabbedAtom && grabbedAtom.moleculeId === null) {
      pointerDragRef.current = {
        kind: "atom",
        atomId: grabbedAtom.id,
        position: normalizedPoint,
        lastRippleAt: performance.now(),
      };
      spawnGrabRipple(grabbedAtom.position, getAtomNeonRgb(grabbedAtom.type));
      return;
    }

    const grabbedMolecule = grabbedAtom
      ? getClusterForMemberMoleculeId(grabbedAtom.moleculeId) ?? getMoleculeById(grabbedAtom.moleculeId)
      : findMoleculeAtCanvasPointForPointer(canvasPoint.x, canvasPoint.y);

    if (grabbedMolecule?.center) {
      pointerDragRef.current = {
        kind: "molecule",
        moleculeId: grabbedMolecule.id,
        grabOffset: {
          x: normalizedPoint.x - grabbedMolecule.center.x,
          y: normalizedPoint.y - grabbedMolecule.center.y,
        },
        position: normalizedPoint,
        lastRippleAt: performance.now(),
      };
      spawnGrabRipple(grabbedMolecule.center, getMoleculeMixedNeonRgb(grabbedMolecule));
    }
  };

  const handleViewportPointerMove = (event) => {
    if (atomicExpansionAtomRef.current) {
      hoveredMoleculeIdRef.current = null;
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event);
    const canvas = canvasRef.current;

    if (canvasPoint && canvas) {
      const hoveredMolecule = [...moleculesRef.current]
        .sort((left, right) => {
          if (left.formula === "2H2O" && right.formula !== "2H2O") {
            return -1;
          }

          if (left.formula !== "2H2O" && right.formula === "2H2O") {
            return 1;
          }

          return 0;
        })
        .find((molecule) => {
          if (!molecule.center || molecule.radius === undefined) {
            return false;
          }

          const centerX = molecule.center.x * canvas.width;
          const centerY = molecule.center.y * canvas.height;
          const hitRadius = getMoleculeCanvasHitRadius(molecule, canvas);

          return Math.hypot(canvasPoint.x - centerX, canvasPoint.y - centerY) <= hitRadius;
        });

      hoveredMoleculeIdRef.current = hoveredMolecule?.id ?? null;
    } else {
      hoveredMoleculeIdRef.current = null;
    }

    if (canvasPoint && canvas && pointerDragRef.current) {
      pointerDragRef.current = {
        ...pointerDragRef.current,
        position: {
          x: canvasPoint.x / canvas.width,
          y: canvasPoint.y / canvas.height,
        },
      };
    }

    if (!tempBondStateRef.current.mouse) {
      return;
    }

    if (!canvasPoint) {
      return;
    }

    tempBondStateRef.current.mouse = {
      ...tempBondStateRef.current.mouse,
      currentPosition: canvasPoint,
    };
  };

  const clearMouseBondDrag = () => {
    tempBondStateRef.current.mouse = null;
    pointerDragRef.current = null;
  };

  const handleViewportPointerUp = (event) => {
    pointerDragRef.current = null;

    if (atomicExpansionAtomRef.current) {
      clearMouseBondDrag();
      return;
    }

    const mouseBondState = tempBondStateRef.current.mouse;

    if (!mouseBondState) {
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event) ?? mouseBondState.currentPosition;

    if (canvasPoint) {
      finalizeBondAtCanvasPoint(mouseBondState.startAtomId, canvasPoint.x, canvasPoint.y);
    }

    clearMouseBondDrag();
  };

  const handleViewportPointerLeave = (event) => {
    if (atomicExpansionAtomRef.current) {
      hoveredMoleculeIdRef.current = null;
      clearMouseBondDrag();
      return;
    }

    hoveredMoleculeIdRef.current = null;
    handleViewportPointerUp(event);
  };

  const handleViewportClick = (event) => {
    if (atomicExpansionAtomRef.current) {
      return;
    }

    if (bondingModeRef.current && !deleteModeRef.current) {
      return;
    }

    const viewport = viewportRef.current;
    const canvas = canvasRef.current;

    if (!viewport || !canvas) {
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event);
    const atomRadius = getScaledAtomRadiusPx();

    if (!canvasPoint) {
      return;
    }

    const atomIndex = atomsRef.current.findIndex(({ position }) => {
      const atomX = position.x * canvas.width;
      const atomY = position.y * canvas.height;
      return Math.hypot(canvasPoint.x - atomX, canvasPoint.y - atomY) <= atomRadius;
    });

    if (deleteModeRef.current) {
      if (atomIndex >= 0) {
        const atomToDelete = atomsRef.current[atomIndex];

        if (atomToDelete?.moleculeId !== null) {
          deleteMoleculeCompletely(atomToDelete.moleculeId);
          return;
        }

        atomsRef.current = atomsRef.current.filter((_, index) => index !== atomIndex);
        bondsRef.current = bondsRef.current.filter((bond) => {
          const atomIds = getBondAtomIds(bond);
          return !atomIds.includes(atomToDelete.id);
        });
        clearTempBondsForAtomIds(new Set([atomToDelete.id]));

        if (selectedAtomIndexRef.current === atomIndex) {
          setSelectedAtom(null);
        } else if (
          selectedAtomIndexRef.current !== null &&
          selectedAtomIndexRef.current > atomIndex
        ) {
          setSelectedAtom(selectedAtomIndexRef.current - 1);
        }
        return;
      }

      const clickedMolecule = [...moleculesRef.current]
        .sort((left, right) => {
          if (left.formula === "2H2O" && right.formula !== "2H2O") {
            return -1;
          }

          if (left.formula !== "2H2O" && right.formula === "2H2O") {
            return 1;
          }

          return 0;
        })
        .find((molecule) => {
          if (
            (molecule.formula !== "H2O" && molecule.formula !== "2H2O") ||
            !molecule.center ||
            molecule.radius === undefined
          ) {
            return false;
          }

          const centerX = molecule.center.x * canvas.width;
          const centerY = molecule.center.y * canvas.height;
          const hitRadius = getMoleculeCanvasHitRadius(molecule, canvas);

          return Math.hypot(canvasPoint.x - centerX, canvasPoint.y - centerY) <= hitRadius;
        });

      if (clickedMolecule) {
        deleteMoleculeCompletely(clickedMolecule.id);
      }

      return;
    }

    setSelectedAtom(atomIndex >= 0 ? atomIndex : null);
  };

  const selectedAtom = selectedAtomIndex !== null ? atomsRef.current[selectedAtomIndex] : null;
  // eslint-disable-next-line react-hooks/refs
  const selectedAtomDetails = selectedAtom ? ATOM_DETAILS[selectedAtom.type] : null;
  // eslint-disable-next-line react-hooks/refs
  const activeAtomicExpansionAtom = atomicExpansionAtomRef.current ?? atomicExpansionAtom;
  const atomicExpansionDetails = activeAtomicExpansionAtom
    ? ATOM_DETAILS[activeAtomicExpansionAtom.type] ?? null
    : null;
  // eslint-disable-next-line react-hooks/refs
  const atomicExpansionNucleusParticles = atomicExpansionDetails
    ? atomicExpansionNucleusParticlesRef.current
    : [];
  // eslint-disable-next-line react-hooks/refs
  const atomicExpansionCollapseGesture = atomicExpansionCollapseGestureRef.current;
  // eslint-disable-next-line react-hooks/refs
  const currentPH = getEstimatedPH(moleculesRef.current);
  const currentPHLabel = currentPH < 6.5 ? "Acidic" : currentPH > 7.5 ? "Basic" : "Neutral";
  const currentPHColor = currentPH < 6.5 ? "#fb7185" : currentPH > 7.5 ? "#a78bfa" : "#86efac";
  // Molecule inspector target: any grabbed molecule first, else the hovered one.
  // eslint-disable-next-line react-hooks/refs
  const currentInfoMoleculeId = [...grabbedMoleculeIdsRef.current][0] ?? hoveredMoleculeIdRef.current;
  const currentInfoMolecule =
    currentInfoMoleculeId !== null && currentInfoMoleculeId !== undefined
      ? getMoleculeById(currentInfoMoleculeId)
      : null;
  const currentMoleculeInfo = currentInfoMolecule
    ? MOLECULE_INFO[currentInfoMolecule.formula] ?? null
    : null;
  const currentMoleculePolarityColor = currentMoleculeInfo
    ? currentMoleculeInfo.polarity.includes("cation") || currentMoleculeInfo.polarity === "Ionic"
      ? "#fbbf24"
      : currentMoleculeInfo.polarity.includes("anion")
        ? "#67e8f9"
        : currentMoleculeInfo.polarity === "Polar" || currentMoleculeInfo.polarity === "Slightly polar"
          ? "#93c5fd"
          : "rgba(255, 255, 255, 0.75)"
    : "rgba(255, 255, 255, 0.75)";

  // The camera + animation loop intentionally captures the initial handlers and refs.
  // It starts only after the user enters through the landing screen.
  useEffect(() => {
    if (!labEntered) {
      return undefined;
    }

    let stream;
    let handLandmarker;
    let animationFrameId;
    let isMounted = true;
    // Hand interaction state is tracked per detected hand (any number of hands).
    // MediaPipe gives no stable ids across frames, so hands are re-matched to
    // their previous state each frame by wrist proximity.
    let handStatesList = [];
    let nextHandStateId = 1;
    // Only run inference when the camera has produced a NEW frame — rAF often
    // ticks faster than the camera, and re-detecting the same frame just
    // burns CPU (dropped frames read as choppy tracking).
    let lastDetectedVideoTime = -1;
    let lastPhysicsTickAt = 0;
    let lastDetectionResults = { landmarks: [] };

    const createHandState = (wrist) => {
      const id = nextHandStateId;
      nextHandStateId += 1;

      return {
        id,
        key: `hand-${id}`,
        wrist,
        lastSeenAt: 0,
        landmarkFilters: null,
        isPinching: false,
        indexTip: null,
        grabbedAtomIndex: null,
        grabbedMoleculeId: null,
        moleculeGrabOffset: null,
        popupPinchHandled: false,
        bondStartAtomId: null,
        expansionGrabOffset: null,
        lastRippleAt: 0,
      };
    };

    // Run every raw landmark through this hand's One Euro filters. Re-feeding
    // cached detections between camera frames is fine — the filters ease
    // toward the raw value, which doubles as cheap sub-frame interpolation.
    const smoothHandLandmarks = (handState, landmarks, timeMs) => {
      if (!handState.landmarkFilters) {
        handState.landmarkFilters = [];
      }

      return landmarks.map((landmark, landmarkIndex) => {
        if (!handState.landmarkFilters[landmarkIndex]) {
          handState.landmarkFilters[landmarkIndex] = {
            x: createOneEuroFilter(),
            y: createOneEuroFilter(),
          };
        }

        const filters = handState.landmarkFilters[landmarkIndex];

        return {
          ...landmark,
          x: filters.x(landmark.x, timeMs),
          y: filters.y(landmark.y, timeMs),
        };
      });
    };

    const resetHandInteractionState = (handState) => {
      handState.grabbedAtomIndex = null;
      handState.grabbedMoleculeId = null;
      handState.moleculeGrabOffset = null;
      handState.popupPinchHandled = false;
      handState.bondStartAtomId = null;
      tempBondStateRef.current[handState.key] = null;
    };

    const clearHandState = (handState) => {
      handState.isPinching = false;
      handState.indexTip = null;
      handState.expansionGrabOffset = null;
      resetHandInteractionState(handState);
    };

    const matchHandStatesToDetections = (detections) => {
      const candidatePairs = [];

      detections.forEach((detection, detectionIndex) => {
        for (const handState of handStatesList) {
          candidatePairs.push({
            detectionIndex,
            handState,
            distance: Math.hypot(
              detection.wrist.x - handState.wrist.x,
              detection.wrist.y - handState.wrist.y
            ),
          });
        }
      });

      candidatePairs.sort((left, right) => left.distance - right.distance);

      const assignedStates = new Map();
      const usedStates = new Set();

      for (const pair of candidatePairs) {
        if (
          assignedStates.has(pair.detectionIndex) ||
          usedStates.has(pair.handState) ||
          pair.distance > 0.4
        ) {
          continue;
        }

        assignedStates.set(pair.detectionIndex, pair.handState);
        usedStates.add(pair.handState);
      }

      const now = performance.now();
      const nextHandStatesList = detections.map((detection, detectionIndex) => {
        const matchedState = assignedStates.get(detectionIndex);

        if (matchedState) {
          matchedState.wrist = { ...detection.wrist };
          matchedState.lastSeenAt = now;
          return matchedState;
        }

        const createdState = createHandState({ ...detection.wrist });
        createdState.lastSeenAt = now;
        return createdState;
      });

      for (const handState of handStatesList) {
        if (usedStates.has(handState)) {
          continue;
        }

        // Not detected this frame. Tracking blips are common, so keep the
        // hand (and whatever it's holding) alive briefly before letting go.
        if (now - handState.lastSeenAt <= HAND_GRACE_MS) {
          nextHandStatesList.push(handState);
        } else {
          clearHandState(handState);
          delete tempBondStateRef.current[handState.key];
        }
      }

      handStatesList = nextHandStatesList;
      return nextHandStatesList;
    };
    const atomStyles = {
      H: {
        base: "#ffffff",
        highlight: "#ffffff",
        mid: "#f1f5f9",
        edge: "#cbd5e1",
        text: "#334155",
        outline: "#e2e8f0",
      },
      O: {
        base: "#d62828",
        highlight: "#ff6b6b",
        mid: "#ef4444",
        edge: "#991b1b",
        text: "#ffffff",
      },
      C: {
        base: "#2f2f2f",
        highlight: "#8a8a8a",
        mid: "#474747",
        edge: "#111111",
        text: "#ffffff",
        outline: "#bdbdbd",
      },
      N: {
        base: "#1d4ed8",
        highlight: "#60a5fa",
        mid: "#2563eb",
        edge: "#1e3a8a",
        text: "#ffffff",
        outline: "#93c5fd",
      },
      Cl: {
        base: "#22c55e",
        highlight: "#bbf7d0",
        mid: "#4ade80",
        edge: "#166534",
        text: "#ffffff",
        outline: "#dcfce7",
      },
      Na: {
        base: "#a855f7",
        highlight: "#e9d5ff",
        mid: "#c084fc",
        edge: "#6b21a8",
        text: "#ffffff",
        outline: "#f3e8ff",
      },
      S: {
        base: "#eab308",
        highlight: "#fef08a",
        mid: "#facc15",
        edge: "#854d0e",
        text: "#422006",
        outline: "#fde68a",
      },
    };

    async function startCamera() {
      try {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        // Camera / hand tracking is best-effort: if it fails (permission denied,
        // no camera), the lab still runs in touch/mouse-only mode.
        try {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              // 4:3 matches the viewport box, minimizing the cover-crop (and
              // the landmark remapping) on phones.
              video: { facingMode: "user", aspectRatio: { ideal: 4 / 3 } },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
          }

          video.srcObject = stream;
          await video.play();

          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
          );

          // Phones: track fewer hands (2 people max realistically fit a phone
          // frame) so inference stays fast enough to feel smooth.
          const isSmallScreen =
            Math.min(window.screen?.width ?? 1024, window.screen?.height ?? 768) < 700;
          const buildLandmarkerOptions = (delegate) => ({
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate,
            },
            numHands: isSmallScreen ? 3 : 6,
            runningMode: "VIDEO",
          });

          try {
            // GPU inference is dramatically faster, especially on mobile.
            handLandmarker = await HandLandmarker.createFromOptions(
              vision,
              buildLandmarkerOptions("GPU")
            );
          } catch {
            handLandmarker = await HandLandmarker.createFromOptions(
              vision,
              buildLandmarkerOptions("CPU")
            );
          }
        } catch (cameraError) {
          console.error("Camera unavailable, running in touch-only mode:", cameraError);
        }

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context || !isMounted) {
          return;
        }

        const drawFrame = () => {
          // Boost the scene scale on narrow viewports (phones) so atoms render
          // finger-sized; 760px is the desktop reference width where scale = 1.
          const viewportWidthPx = viewportRef.current?.clientWidth ?? 760;
          deviceScaleRef.current = clampValue(760 / Math.max(300, viewportWidthPx), 1, 1.9);

          const atomRadius = getScaledAtomRadiusPx();
          const atomGrabRadius = getScaledAtomGrabRadiusPx();
          const scaledHydrogenBondTargetPx = WATER_HYDROGEN_BOND_TARGET_PX * getVisualScale();
          const getWaterTargetPositions = (oxygenPosition) => ({
            0: clampPosition({
              x: oxygenPosition.x + getScaledCanvasOffset(WATER_LAYOUT_OFFSETS_PX[0], canvas).x,
              y: oxygenPosition.y + getScaledCanvasOffset(WATER_LAYOUT_OFFSETS_PX[0], canvas).y,
            }),
            1: clampPosition({
              x: oxygenPosition.x + getScaledCanvasOffset(WATER_LAYOUT_OFFSETS_PX[1], canvas).x,
              y: oxygenPosition.y + getScaledCanvasOffset(WATER_LAYOUT_OFFSETS_PX[1], canvas).y,
            }),
          });

          const getDiatomicTargetPositions = (centerPosition) => ({
            0: clampPosition({
              x: centerPosition.x + getScaledCanvasOffset(DIATOMIC_LAYOUT_OFFSETS_PX[0], canvas).x,
              y: centerPosition.y + getScaledCanvasOffset(DIATOMIC_LAYOUT_OFFSETS_PX[0], canvas).y,
            }),
            1: clampPosition({
              x: centerPosition.x + getScaledCanvasOffset(DIATOMIC_LAYOUT_OFFSETS_PX[1], canvas).x,
              y: centerPosition.y + getScaledCanvasOffset(DIATOMIC_LAYOUT_OFFSETS_PX[1], canvas).y,
            }),
          });

          const getMethaneTargetPositions = (carbonPosition) => ({
            0: clampPosition({
              x: carbonPosition.x + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[0], canvas).x,
              y: carbonPosition.y + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[0], canvas).y,
            }),
            1: clampPosition({
              x: carbonPosition.x + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[1], canvas).x,
              y: carbonPosition.y + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[1], canvas).y,
            }),
            2: clampPosition({
              x: carbonPosition.x + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[2], canvas).x,
              y: carbonPosition.y + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[2], canvas).y,
            }),
            3: clampPosition({
              x: carbonPosition.x + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[3], canvas).x,
              y: carbonPosition.y + getScaledCanvasOffset(METHANE_LAYOUT_OFFSETS_PX[3], canvas).y,
            }),
          });

          const getAmmoniaTargetPositions = (nitrogenPosition) => ({
            nitrogen: clampPosition(nitrogenPosition),
            hydrogen0: clampPosition({
              x: nitrogenPosition.x + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[0], canvas).x,
              y: nitrogenPosition.y + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[0], canvas).y,
            }),
            hydrogen1: clampPosition({
              x: nitrogenPosition.x + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[1], canvas).x,
              y: nitrogenPosition.y + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[1], canvas).y,
            }),
            hydrogen2: clampPosition({
              x: nitrogenPosition.x + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[2], canvas).x,
              y: nitrogenPosition.y + getScaledCanvasOffset(AMMONIA_LAYOUT_OFFSETS_PX[2], canvas).y,
            }),
          });

          const getCarbonicAcidTargetPositions = (carbonPosition) => ({
            carbon: clampPosition(carbonPosition),
            doubleOxygen: clampPosition({
              x:
                carbonPosition.x +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.doubleOxygen, canvas).x,
              y:
                carbonPosition.y +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.doubleOxygen, canvas).y,
            }),
            hydroxylLeftOxygen: clampPosition({
              x:
                carbonPosition.x +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylLeftOxygen, canvas).x,
              y:
                carbonPosition.y +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylLeftOxygen, canvas).y,
            }),
            hydroxylRightOxygen: clampPosition({
              x:
                carbonPosition.x +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylRightOxygen, canvas).x,
              y:
                carbonPosition.y +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylRightOxygen, canvas).y,
            }),
            hydroxylHydrogenLeft: clampPosition({
              x:
                carbonPosition.x +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylHydrogenLeft, canvas).x,
              y:
                carbonPosition.y +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylHydrogenLeft, canvas).y,
            }),
            hydroxylHydrogenRight: clampPosition({
              x:
                carbonPosition.x +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylHydrogenRight, canvas).x,
              y:
                carbonPosition.y +
                getScaledCanvasOffset(CARBONIC_ACID_LAYOUT_OFFSETS_PX.hydroxylHydrogenRight, canvas).y,
            }),
          });

          const getWaterDimerTargetPositions = (clusterCenter) => ({
            donorOxygen: clampPosition({
              x: clusterCenter.x + getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorOxygen, canvas).x,
              y: clusterCenter.y + getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorOxygen, canvas).y,
            }),
            donorHydrogenFar: clampPosition({
              x:
                clusterCenter.x +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorHydrogenFar, canvas).x,
              y:
                clusterCenter.y +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorHydrogenFar, canvas).y,
            }),
            donorHydrogenBonding: clampPosition({
              x:
                clusterCenter.x +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorHydrogenBonding, canvas).x,
              y:
                clusterCenter.y +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.donorHydrogenBonding, canvas).y,
            }),
            acceptorOxygen: clampPosition({
              x: clusterCenter.x + getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorOxygen, canvas).x,
              y: clusterCenter.y + getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorOxygen, canvas).y,
            }),
            acceptorHydrogenTop: clampPosition({
              x:
                clusterCenter.x +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorHydrogenTop, canvas).x,
              y:
                clusterCenter.y +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorHydrogenTop, canvas).y,
            }),
            acceptorHydrogenBottom: clampPosition({
              x:
                clusterCenter.x +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorHydrogenBottom, canvas).x,
              y:
                clusterCenter.y +
                getScaledCanvasOffset(WATER_DIMER_LAYOUT_OFFSETS_PX.acceptorHydrogenBottom, canvas).y,
            }),
          });

          const clampPosition = (position) => {
            const xMargin = atomRadius / canvas.width;
            const yMargin = atomRadius / canvas.height;

            return {
              x: Math.min(1 - xMargin, Math.max(xMargin, position.x)),
              y: Math.min(1 - yMargin, Math.max(yMargin, position.y)),
            };
          };

          const getMoleculeAnchor = (molecule, moleculeAtoms) => {
            if (getGenericTemplateForMolecule(molecule)) {
              return (
                moleculeAtoms.find((atom) => atom.id === molecule.atomIds[0]) ?? moleculeAtoms[0]
              );
            }

            if (molecule.formula === "2H2O") {
              return null;
            }

            if (
              molecule.formula === "H2" ||
              molecule.formula === "O2" ||
              molecule.formula === "N2" ||
              molecule.formula === "CO" ||
              molecule.formula === "NaCl"
            ) {
              return null;
            }

            if (molecule.formula === "H2O" || molecule.formula === "H3O+") {
              return moleculeAtoms.find((atom) => atom.type === "O") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "CO2") {
              return moleculeAtoms.find((atom) => atom.type === "C") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "CH4") {
              return moleculeAtoms.find((atom) => atom.type === "C") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "NH3" || molecule.formula === "NH4+") {
              return moleculeAtoms.find((atom) => atom.type === "N") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "H2CO3") {
              return moleculeAtoms.find((atom) => atom.type === "C") ?? moleculeAtoms[0];
            }

            return moleculeAtoms[0] ?? null;
          };

          const normalizeVector = (vector, fallback = { x: 0, y: -1 }) => {
            const magnitude = Math.hypot(vector.x, vector.y);

            if (magnitude <= 0.0001) {
              return fallback;
            }

            return {
              x: vector.x / magnitude,
              y: vector.y / magnitude,
            };
          };

          const rotateVector = (vector, angleRadians) => ({
            x:
              vector.x * Math.cos(angleRadians) - vector.y * Math.sin(angleRadians),
            y:
              vector.x * Math.sin(angleRadians) + vector.y * Math.cos(angleRadians),
          });

          const getMoleculeNeighborsForAtom = (atomId, molecule) =>
            bondsRef.current
              .filter((bond) => {
                if (getBondCategory(bond) !== "covalent") {
                  return false;
                }

                const [atomAId, atomBId] = getBondAtomIds(bond);
                return (
                  molecule.atomIds.includes(atomAId) &&
                  molecule.atomIds.includes(atomBId) &&
                  (atomAId === atomId || atomBId === atomId)
                );
              })
              .map((bond) => {
                const [atomAId, atomBId] = getBondAtomIds(bond);
                return getAtomById(atomAId === atomId ? atomBId : atomAId);
              })
              .filter(Boolean);

          const getLonePairGroupCenters = (atom, molecule, drawRadius) => {
            const lonePairCount = getLonePairCountForAtom(molecule, atom);

            if (lonePairCount === 0) {
              return [];
            }

            const atomCenter = {
              x: atom.position.x * canvas.width,
              y: atom.position.y * canvas.height,
            };
            const neighborAtoms = getMoleculeNeighborsForAtom(atom.id, molecule);
            const neighborDirections = neighborAtoms.map((neighborAtom) =>
              normalizeVector({
                x: neighborAtom.position.x * canvas.width - atomCenter.x,
                y: neighborAtom.position.y * canvas.height - atomCenter.y,
              })
            );
            const averageNeighborDirection = normalizeVector(
              neighborDirections.reduce(
                (sum, direction) => ({
                  x: sum.x + direction.x,
                  y: sum.y + direction.y,
                }),
                { x: 0, y: 0 }
              ),
              { x: 0, y: -1 }
            );
            const oppositeDirection = {
              x: -averageNeighborDirection.x,
              y: -averageNeighborDirection.y,
            };
            const baseDistance = drawRadius * 1.18;
            const outerDistance = drawRadius * 0.22;
            const spreadDistance = drawRadius * 0.84;

            if (lonePairCount === 1) {
              if (molecule.formula === "NH3") {
                const direction = { x: 0, y: -1 };

                return [
                  {
                    center: {
                      x: atomCenter.x,
                      y: atomCenter.y - drawRadius * 1.88,
                    },
                    radialDirection: direction,
                  },
                ];
              }

              const direction =
                molecule.formula === "N2" && neighborDirections[0]
                  ? { x: -neighborDirections[0].x, y: -neighborDirections[0].y }
                  : oppositeDirection;

              return [
                {
                  center: {
                    x: atomCenter.x + direction.x * baseDistance,
                    y: atomCenter.y + direction.y * baseDistance,
                  },
                  radialDirection: direction,
                },
              ];
            }

            if (lonePairCount === 3) {
              const outwardDirection = neighborDirections[0]
                ? { x: -neighborDirections[0].x, y: -neighborDirections[0].y }
                : { x: 0, y: -1 };

              return [-1.25, 0, 1.25].map((rotation) => {
                const direction = normalizeVector(rotateVector(outwardDirection, rotation));

                return {
                  center: {
                    x: atomCenter.x + direction.x * baseDistance,
                    y: atomCenter.y + direction.y * baseDistance,
                  },
                  radialDirection: direction,
                };
              });
            }

            if (lonePairCount === 4) {
              const outwardDirection = neighborDirections[0]
                ? { x: -neighborDirections[0].x, y: -neighborDirections[0].y }
                : { x: 0, y: -1 };

              return [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rotation) => {
                const direction = normalizeVector(rotateVector(outwardDirection, rotation));

                return {
                  center: {
                    x: atomCenter.x + direction.x * baseDistance,
                    y: atomCenter.y + direction.y * baseDistance,
                  },
                  radialDirection: direction,
                };
              });
            }

            if (
              (molecule.formula === "CO2" || molecule.formula === "O2" || molecule.formula === "CO") &&
              neighborDirections[0]
            ) {
              const outwardDirection = {
                x: -neighborDirections[0].x,
                y: -neighborDirections[0].y,
              };
              const perpendicularDirection = rotateVector(outwardDirection, Math.PI / 2);

              return [-1, 1].map((side) => ({
                center: {
                  x:
                    atomCenter.x +
                    outwardDirection.x * outerDistance +
                    perpendicularDirection.x * spreadDistance * side,
                  y:
                    atomCenter.y +
                    outwardDirection.y * outerDistance +
                    perpendicularDirection.y * spreadDistance * side,
                },
                radialDirection: normalizeVector({
                  x:
                    outwardDirection.x * outerDistance +
                    perpendicularDirection.x * spreadDistance * side,
                  y:
                    outwardDirection.y * outerDistance +
                    perpendicularDirection.y * spreadDistance * side,
                }),
              }));
            }

            return [-0.58, 0.58].map((rotation) => {
              const direction = rotateVector(oppositeDirection, rotation);
              const normalizedDirection = normalizeVector(direction, oppositeDirection);

              return {
                center: {
                  x: atomCenter.x + normalizedDirection.x * baseDistance,
                  y: atomCenter.y + normalizedDirection.y * baseDistance,
                },
                radialDirection: normalizedDirection,
              };
            });
          };

          const drawAtomLonePairs = (atom, molecule, drawRadius) => {
            // Lewis view always shows lone pairs — they ARE the structure.
            if ((!showLonePairsRef.current && !lewisViewRef.current) || atom.moleculeId === null) {
              return;
            }

            const lonePairGroups = getLonePairGroupCenters(atom, molecule, drawRadius);

            if (lonePairGroups.length === 0) {
              return;
            }

            const dotRadius = Math.max(2.1, drawRadius * 0.12);
            const dotSpacing = drawRadius * 0.34;

            context.save();
            context.fillStyle = LONE_PAIR_DOT_COLOR;
            context.shadowColor = LONE_PAIR_DOT_GLOW;
            context.shadowBlur = 7 * getVisualScale();

            lonePairGroups.forEach(({ center, radialDirection }) => {
              const tangentDirection = rotateVector(radialDirection, Math.PI / 2);

              [-0.5, 0.5].forEach((offsetSign) => {
                context.beginPath();
                context.arc(
                  center.x + tangentDirection.x * dotSpacing * offsetSign,
                  center.y + tangentDirection.y * dotSpacing * offsetSign,
                  dotRadius,
                  0,
                  Math.PI * 2
                );
                context.fill();
              });
            });

            context.restore();
          };

          // Lewis mode: bonds render as shared electron-dot pairs — one
          // column of 2 dots per bond order (2/4/6 dots for single/double/triple).
          const drawLewisBondPairs = (startPosition, endPosition, order) => {
            const startX = startPosition.x * canvas.width;
            const startY = startPosition.y * canvas.height;
            const endX = endPosition.x * canvas.width;
            const endY = endPosition.y * canvas.height;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const distance = Math.hypot(deltaX, deltaY);

            if (distance <= atomRadius * 1.2) {
              return;
            }

            const unitX = deltaX / distance;
            const unitY = deltaY / distance;
            const normalX = -unitY;
            const normalY = unitX;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            const columnSpacing = 9 * getVisualScale();
            const pairSpacing = 7 * getVisualScale();
            const dotRadius = 2.6 * getVisualScale();

            context.save();
            context.fillStyle = "rgba(226, 240, 255, 0.95)";
            context.shadowColor = "rgba(147, 197, 253, 0.6)";
            context.shadowBlur = 6;

            for (let column = 0; column < order; column += 1) {
              const columnOffset = (column - (order - 1) / 2) * columnSpacing;
              const columnX = midX + unitX * columnOffset;
              const columnY = midY + unitY * columnOffset;

              for (const side of [-0.5, 0.5]) {
                context.beginPath();
                context.arc(
                  columnX + normalX * pairSpacing * side,
                  columnY + normalY * pairSpacing * side,
                  dotRadius,
                  0,
                  Math.PI * 2
                );
                context.fill();
              }
            }

            context.restore();
          };

          const drawBondStick = (
            startPosition,
            endPosition,
            trimScale = 0.88,
            perpendicularOffsetPx = 0,
            atomTypePair = null
          ) => {
            if (lewisViewRef.current && atomTypePair && perpendicularOffsetPx === 0) {
              drawLewisBondPairs(startPosition, endPosition, 1);
              return;
            }
            const startX = startPosition.x * canvas.width;
            const startY = startPosition.y * canvas.height;
            const endX = endPosition.x * canvas.width;
            const endY = endPosition.y * canvas.height;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const distance = Math.hypot(deltaX, deltaY);

            if (distance <= atomRadius * 1.2) {
              return;
            }

            const unitX = deltaX / distance;
            const unitY = deltaY / distance;
            const trim = atomRadius * trimScale;
            const normalX = -unitY;
            const normalY = unitX;
            const offsetX = normalX * perpendicularOffsetPx;
            const offsetY = normalY * perpendicularOffsetPx;
            const lineStartX = startX + unitX * trim + offsetX;
            const lineStartY = startY + unitY * trim + offsetY;
            const lineEndX = endX - unitX * trim + offsetX;
            const lineEndY = endY - unitY * trim + offsetY;

            if (!atomTypePair) {
              context.beginPath();
              context.moveTo(lineStartX, lineStartY);
              context.lineTo(lineEndX, lineEndY);
              context.stroke();
              return;
            }

            // Styled covalent bond: dark underlay for depth, a color gradient
            // between the two atoms' neon colors, and a bright highlight core.
            const startRgb = getAtomNeonRgb(atomTypePair[0]);
            const endRgb = getAtomNeonRgb(atomTypePair[1]);
            const mixedRgb = getMixedNeonRgb(atomTypePair);
            const bondGradient = context.createLinearGradient(
              lineStartX,
              lineStartY,
              lineEndX,
              lineEndY
            );
            bondGradient.addColorStop(0, rgbToCss(startRgb, 0.95));
            bondGradient.addColorStop(0.5, rgbToCss(mixedRgb, 0.85));
            bondGradient.addColorStop(1, rgbToCss(endRgb, 0.95));

            context.save();
            context.lineCap = "round";

            context.beginPath();
            context.moveTo(lineStartX, lineStartY);
            context.lineTo(lineEndX, lineEndY);
            context.strokeStyle = "rgba(2, 6, 23, 0.42)";
            context.lineWidth = 6 * getVisualScale();
            context.shadowBlur = 0;
            context.stroke();

            context.beginPath();
            context.moveTo(lineStartX, lineStartY);
            context.lineTo(lineEndX, lineEndY);
            context.strokeStyle = bondGradient;
            context.lineWidth = 3.2 * getVisualScale();
            context.shadowColor = rgbToCss(mixedRgb, 0.55);
            context.shadowBlur = 9;
            context.stroke();

            context.beginPath();
            context.moveTo(lineStartX, lineStartY);
            context.lineTo(lineEndX, lineEndY);
            context.strokeStyle = "rgba(255, 255, 255, 0.5)";
            context.lineWidth = 1.1 * getVisualScale();
            context.shadowBlur = 0;
            context.stroke();

            context.restore();
          };

          const drawBondOrderStick = (
            startPosition,
            endPosition,
            order = 1,
            trimScale = 0.88,
            atomTypePair = null
          ) => {
            if (lewisViewRef.current && atomTypePair) {
              drawLewisBondPairs(startPosition, endPosition, order);
              return;
            }

            if (order <= 1) {
              drawBondStick(startPosition, endPosition, trimScale, 0, atomTypePair);
              return;
            }

            const offsets =
              order === 2
                ? [-3.4 * getVisualScale(), 3.4 * getVisualScale()]
                : [-4.6 * getVisualScale(), 0, 4.6 * getVisualScale()];

            offsets.forEach((offset) => {
              drawBondStick(startPosition, endPosition, trimScale, offset, atomTypePair);
            });
          };

          const drawMoleculeBondSticks = (molecule) => {
            if (molecule.formula === "H2O" && molecule.visualMode === "waterDroplet") {
              return;
            }

            const genericTemplate = getGenericTemplateForMolecule(molecule);

            if (genericTemplate) {
              for (const bond of genericTemplate.bonds) {
                const leftAtom = getAtomById(molecule.atomIds[bond.a]);
                const rightAtom = getAtomById(molecule.atomIds[bond.b]);

                if (!leftAtom || !rightAtom) {
                  continue;
                }

                if (bond.ionic) {
                  context.save();
                  context.setLineDash([5, 7]);
                  context.strokeStyle = "rgba(226, 232, 240, 0.75)";
                  context.lineWidth = 2.4 * getVisualScale();
                  context.shadowColor = "rgba(226, 232, 240, 0.3)";
                  context.shadowBlur = 7;
                  drawBondStick(leftAtom.position, rightAtom.position, 0.95);
                  context.restore();
                } else {
                  drawBondOrderStick(
                    leftAtom.position,
                    rightAtom.position,
                    COVALENT_BOND_ORDER[bond.order ?? "single"] ?? 1,
                    0.88,
                    [leftAtom.type, rightAtom.type]
                  );
                }
              }

              return;
            }

            if (molecule.formula === "H2O") {
              const oxygenAtom = getAtomById(molecule.atomIds[0]);
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (!oxygenAtom || hydrogenAtoms.length !== 2) {
                return;
              }

              hydrogenAtoms.forEach((hydrogenAtom) => {
                drawBondStick(oxygenAtom.position, hydrogenAtom.position, 0.88, 0, ["O", "H"]);
              });
            }

            if (
              molecule.formula === "H2" ||
              molecule.formula === "O2" ||
              molecule.formula === "N2" ||
              molecule.formula === "CO"
            ) {
              const leftAtom = getAtomById(molecule.atomIds[0]);
              const rightAtom = getAtomById(molecule.atomIds[1]);

              if (!leftAtom || !rightAtom) {
                return;
              }

              const bondOrder =
                molecule.formula === "O2"
                  ? 2
                  : molecule.formula === "N2" || molecule.formula === "CO"
                    ? 3
                    : 1;
              drawBondOrderStick(leftAtom.position, rightAtom.position, bondOrder, 0.88, [
                leftAtom.type,
                rightAtom.type,
              ]);
            }

            if (molecule.formula === "CO2") {
              const leftOxygenAtom = getAtomById(molecule.atomIds[0]);
              const carbonAtom = getAtomById(molecule.atomIds[1]);
              const rightOxygenAtom = getAtomById(molecule.atomIds[2]);

              if (!leftOxygenAtom || !carbonAtom || !rightOxygenAtom) {
                return;
              }

              drawBondOrderStick(leftOxygenAtom.position, carbonAtom.position, 2, 0.88, ["O", "C"]);
              drawBondOrderStick(carbonAtom.position, rightOxygenAtom.position, 2, 0.88, ["C", "O"]);
            }

            if (molecule.formula === "CH4") {
              const carbonAtom = getAtomById(molecule.atomIds[0]);
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (!carbonAtom || hydrogenAtoms.length !== 4) {
                return;
              }

              hydrogenAtoms.forEach((hydrogenAtom) => {
                drawBondStick(carbonAtom.position, hydrogenAtom.position, 0.88, 0, ["C", "H"]);
              });
            }

            if (molecule.formula === "NH3") {
              const nitrogenAtom = getAtomById(molecule.atomIds[0]);
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (!nitrogenAtom || hydrogenAtoms.length !== 3) {
                return;
              }

              hydrogenAtoms.forEach((hydrogenAtom) => {
                drawBondStick(nitrogenAtom.position, hydrogenAtom.position, 0.88, 0, ["N", "H"]);
              });
            }

            if (molecule.formula === "H3O+") {
              const oxygenAtom = getAtomById(molecule.atomIds[0]);
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (!oxygenAtom || hydrogenAtoms.length !== 3) {
                return;
              }

              hydrogenAtoms.forEach((hydrogenAtom) => {
                drawBondStick(oxygenAtom.position, hydrogenAtom.position, 0.88, 0, ["O", "H"]);
              });
            }

            if (molecule.formula === "NH4+") {
              const nitrogenAtom = getAtomById(molecule.atomIds[0]);
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (!nitrogenAtom || hydrogenAtoms.length !== 4) {
                return;
              }

              hydrogenAtoms.forEach((hydrogenAtom) => {
                drawBondStick(nitrogenAtom.position, hydrogenAtom.position, 0.88, 0, ["N", "H"]);
              });
            }

            if (molecule.formula === "NaCl") {
              const sodiumAtom = getAtomById(molecule.atomIds[0]);
              const chlorineAtom = getAtomById(molecule.atomIds[1]);

              if (!sodiumAtom || !chlorineAtom) {
                return;
              }

              // Ionic "bond": electrostatic attraction, not a shared pair —
              // drawn dashed to distinguish it from covalent sticks.
              context.save();
              context.setLineDash([5, 7]);
              context.strokeStyle = "rgba(226, 232, 240, 0.75)";
              context.lineWidth = 2.4 * getVisualScale();
              context.shadowColor = "rgba(226, 232, 240, 0.3)";
              context.shadowBlur = 7;
              drawBondStick(sodiumAtom.position, chlorineAtom.position, 0.95);
              context.restore();
            }

            if (molecule.formula === "H2CO3") {
              const carbonAtom = getAtomById(molecule.atomIds[0]);
              const doubleOxygenAtom = getAtomById(molecule.atomIds[1]);
              const leftHydroxylOxygenAtom = getAtomById(molecule.atomIds[2]);
              const rightHydroxylOxygenAtom = getAtomById(molecule.atomIds[3]);
              const leftHydrogenAtom = getAtomById(molecule.atomIds[4]);
              const rightHydrogenAtom = getAtomById(molecule.atomIds[5]);

              if (
                !carbonAtom ||
                !doubleOxygenAtom ||
                !leftHydroxylOxygenAtom ||
                !rightHydroxylOxygenAtom ||
                !leftHydrogenAtom ||
                !rightHydrogenAtom
              ) {
                return;
              }

              drawBondOrderStick(carbonAtom.position, doubleOxygenAtom.position, 2, 0.88, ["C", "O"]);
              drawBondStick(carbonAtom.position, leftHydroxylOxygenAtom.position, 0.88, 0, ["C", "O"]);
              drawBondStick(carbonAtom.position, rightHydroxylOxygenAtom.position, 0.88, 0, ["C", "O"]);
              drawBondStick(leftHydroxylOxygenAtom.position, leftHydrogenAtom.position, 0.7, 0, ["O", "H"]);
              drawBondStick(rightHydroxylOxygenAtom.position, rightHydrogenAtom.position, 0.7, 0, ["O", "H"]);
            }
          };

          const drawWaterDimerAnnotations = (molecule) => {
            if (molecule.formula !== "2H2O") {
              return;
            }

            const hydrogenBond = getWaterClusterHydrogenBond(molecule.memberMoleculeIds ?? []);
            const donorMolecule = hydrogenBond ? getMoleculeById(hydrogenBond.donorMoleculeId) : null;
            const acceptorMolecule = hydrogenBond ? getMoleculeById(hydrogenBond.acceptorMoleculeId) : null;
            const donorOxygenAtom = getWaterMoleculeOxygenAtom(donorMolecule);
            const acceptorOxygenAtom = getWaterMoleculeOxygenAtom(acceptorMolecule);

            if (!hydrogenBond || !donorOxygenAtom || !acceptorOxygenAtom) {
              return;
            }

            const labelEntries = [
              {
                text: "\u03b4\u2212",
                atom: donorOxygenAtom,
                offsetX: scaleLayoutOffsetPx(-20),
                offsetY: scaleLayoutOffsetPx(-20),
                color: HYDROGEN_BOND_NEON_PINK,
              },
              {
                text: "\u03b4\u2212",
                atom: acceptorOxygenAtom,
                offsetX: scaleLayoutOffsetPx(18),
                offsetY: scaleLayoutOffsetPx(-20),
                color: HYDROGEN_BOND_NEON_PINK,
              },
              {
                text: "\u03b4+",
                atom: hydrogenBond.donorHydrogenAtom,
                offsetX: scaleLayoutOffsetPx(16),
                offsetY: scaleLayoutOffsetPx(-14),
                color: HYDROGEN_BOND_NEON_PINK,
              },
            ];

            context.save();
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = `600 ${12 * getVisualScale()}px system-ui`;
            context.shadowColor = HYDROGEN_BOND_GLOW;
            context.shadowBlur = 8;

            for (const entry of labelEntries) {
              context.save();
              context.translate(
                entry.atom.position.x * canvas.width + entry.offsetX,
                entry.atom.position.y * canvas.height + entry.offsetY
              );
              context.scale(-1, 1);
              context.fillStyle = entry.color;
              context.fillText(entry.text, 0, 0);
              context.restore();
            }

            context.restore();
          };

          const getWaterDropletRadiusPx = () => WATER_ORB_RADIUS_PX * getVisualScale();

          const getMoleculeLabelTopY = (molecule, moleculeAtoms) => {
            if (molecule.visualMode === "waterDroplet" && molecule.formula === "H2O") {
              return molecule.center.y * canvas.height - getWaterDropletRadiusPx() - 28;
            }

            return Math.min(...moleculeAtoms.map((atom) => atom.position.y)) * canvas.height - 28;
          };

          const syncMoleculeGeometry = (molecule) => {
            if (molecule.formula === "2H2O") {
              const memberMolecules = (molecule.memberMoleculeIds ?? [])
                .map((moleculeId) => getMoleculeById(moleculeId))
                .filter(Boolean);
              const clusterAtoms = memberMolecules.flatMap((memberMolecule) => getMoleculeAtoms(memberMolecule));

              if (memberMolecules.length === 0 || clusterAtoms.length === 0) {
                return molecule;
              }

              const center = getAtomGroupCenter(clusterAtoms);

              molecule.atomIds = memberMolecules.flatMap((memberMolecule) => memberMolecule.atomIds);
              molecule.center = center;
              molecule.radius = getAtomGroupRadius(clusterAtoms, center);
              molecule.memberMoleculeOffsets = Object.fromEntries(
                memberMolecules.map((memberMolecule) => [
                  memberMolecule.id,
                  {
                    x: (memberMolecule.center?.x ?? center.x) - center.x,
                    y: (memberMolecule.center?.y ?? center.y) - center.y,
                  },
                ])
              );
              molecule.atomOffsets = Object.fromEntries(
                clusterAtoms.map((atom) => [
                  atom.id,
                  {
                    x: atom.position.x - center.x,
                    y: atom.position.y - center.y,
                  },
                ])
              );

              return molecule;
            }

            const moleculeAtoms = getMoleculeAtoms(molecule);

            if (moleculeAtoms.length === 0) {
              return molecule;
            }

            const anchorAtom = getMoleculeAnchor(molecule, moleculeAtoms);
            const center = anchorAtom ? { ...anchorAtom.position } : getAtomGroupCenter(moleculeAtoms);

            molecule.center = center;
            molecule.radius = getAtomGroupRadius(moleculeAtoms, center);
            molecule.atomOffsets = Object.fromEntries(
              moleculeAtoms.map((atom) => [
                atom.id,
                {
                  x: atom.position.x - center.x,
                  y: atom.position.y - center.y,
                },
              ])
            );

            return molecule;
          };

          const getMoleculeLabelBounds = (molecule, moleculeAtoms, center) => {
            if (!molecule.displayLabel || moleculeAtoms.length === 0) {
              return null;
            }

            const labelCenterY = getMoleculeLabelTopY(molecule, moleculeAtoms);

            context.save();
            context.font = "600 14px system-ui";
            const metrics = context.measureText(molecule.displayLabel);
            context.restore();

            const labelWidth = Math.max(
              metrics.width,
              (metrics.actualBoundingBoxLeft ?? 0) + (metrics.actualBoundingBoxRight ?? 0)
            );
            const labelHeight = Math.max(
              14,
              (metrics.actualBoundingBoxAscent ?? 0) + (metrics.actualBoundingBoxDescent ?? 0)
            );

            return {
              minX: -labelWidth / 2 / canvas.width,
              maxX: labelWidth / 2 / canvas.width,
              minY: (labelCenterY - labelHeight / 2) / canvas.height - center.y,
              maxY: (labelCenterY + labelHeight / 2) / canvas.height - center.y,
            };
          };

          const getMoleculeVisualBounds = (molecule) => {
            const moleculeAtoms = getMoleculeAtoms(molecule);

            if (moleculeAtoms.length === 0) {
              return null;
            }

            const center = molecule.center ?? getAtomGroupCenter(moleculeAtoms);
            const atomBounds = moleculeAtoms.reduce(
              (bounds, atom) => ({
                minX: Math.min(bounds.minX, atom.position.x - center.x - atomRadius / canvas.width),
                maxX: Math.max(bounds.maxX, atom.position.x - center.x + atomRadius / canvas.width),
                minY: Math.min(bounds.minY, atom.position.y - center.y - atomRadius / canvas.height),
                maxY: Math.max(bounds.maxY, atom.position.y - center.y + atomRadius / canvas.height),
              }),
              {
                minX: Number.POSITIVE_INFINITY,
                maxX: Number.NEGATIVE_INFINITY,
                minY: Number.POSITIVE_INFINITY,
                maxY: Number.NEGATIVE_INFINITY,
              }
            );
            const labelBounds = getMoleculeLabelBounds(molecule, moleculeAtoms, center);

            if (!labelBounds) {
              return atomBounds;
            }

            return {
              minX: Math.min(atomBounds.minX, labelBounds.minX),
              maxX: Math.max(atomBounds.maxX, labelBounds.maxX),
              minY: Math.min(atomBounds.minY, labelBounds.minY),
              maxY: Math.max(atomBounds.maxY, labelBounds.maxY),
            };
          };

          const clampMoleculeCenter = (molecule, center) => {
            const bounds = getMoleculeVisualBounds(molecule);

            if (!bounds) {
              return center;
            }

            return {
              x: Math.min(1 - bounds.maxX, Math.max(-bounds.minX, center.x)),
              y: Math.min(1 - bounds.maxY, Math.max(-bounds.minY, center.y)),
            };
          };

          const moveMoleculeTo = (molecule, nextCenter) => {
            if (molecule.formula === "2H2O") {
              const memberOffsets = molecule.memberMoleculeOffsets ?? {};
              const clampedCenter = clampMoleculeCenter(molecule, nextCenter);

              molecule.center = clampedCenter;
              for (const memberMoleculeId of molecule.memberMoleculeIds ?? []) {
                const memberMolecule = getMoleculeById(memberMoleculeId);

                if (!memberMolecule) {
                  continue;
                }

                const memberOffset = memberOffsets[memberMoleculeId] ?? { x: 0, y: 0 };
                moveMoleculeTo(memberMolecule, {
                  x: clampedCenter.x + memberOffset.x,
                  y: clampedCenter.y + memberOffset.y,
                });
              }

              syncMoleculeGeometry(molecule);
              return;
            }

            const atomOffsets = molecule.atomOffsets ?? {};
            const clampedCenter = clampMoleculeCenter(molecule, nextCenter);

            delete molecule.snapStartedAt;
            delete molecule.snapDuration;
            delete molecule.originPositions;
            molecule.center = clampedCenter;
            atomsRef.current = atomsRef.current.map((atom) => {
              if (atom.moleculeId !== molecule.id) {
                return atom;
              }

              const offset = atomOffsets[atom.id] ?? { x: 0, y: 0 };
              return {
                ...atom,
                position: clampPosition({
                  x: clampedCenter.x + offset.x,
                  y: clampedCenter.y + offset.y,
                }),
              };
            });
            syncMoleculeGeometry(molecule);
          };

          const findMoleculeAtCanvasPoint = (canvasX, canvasY, excludedMoleculeIds = new Set()) =>
            [...moleculesRef.current]
              .sort((left, right) => {
                if (left.formula === "2H2O" && right.formula !== "2H2O") {
                  return -1;
                }

                if (left.formula !== "2H2O" && right.formula === "2H2O") {
                  return 1;
                }

                return 0;
              })
              .find((molecule) => {
              if (excludedMoleculeIds.has(molecule.id)) {
                return false;
              }

              syncMoleculeGeometry(molecule);

              const centerX = (molecule.center?.x ?? 0) * canvas.width;
              const centerY = (molecule.center?.y ?? 0) * canvas.height;
              const hitRadius = getMoleculeCanvasHitRadius(molecule, canvas);

              return Math.hypot(canvasX - centerX, canvasY - centerY) <= hitRadius;
              }) ?? null;

          const layoutWaterMolecule = (molecule, oxygenAtom) => {
            const hydrogenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "H")
              .sort((left, right) => left.position.x - right.position.x);
            const targetPositions = getWaterTargetPositions(oxygenAtom.position);
            const atomMap = new Map(
              atomsRef.current.map((atom) => [
                atom.id,
                atom.id === oxygenAtom.id
                  ? atom
                  : hydrogenAtoms.some((hydrogenAtom) => hydrogenAtom.id === atom.id)
                    ? {
                        ...atom,
                        position:
                          targetPositions[
                            hydrogenAtoms.findIndex(
                              (hydrogenAtom) => hydrogenAtom.id === atom.id
                            )
                          ],
                      }
                    : atom,
              ])
            );

            atomMap.set(oxygenAtom.id, {
              ...atomMap.get(oxygenAtom.id),
              position: clampPosition(oxygenAtom.position),
            });

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          const layoutWaterDimerCluster = (molecule, clusterCenter = molecule.center) => {
            const memberMolecules = (molecule.memberMoleculeIds ?? [])
              .map((moleculeId) => getMoleculeById(moleculeId))
              .filter(Boolean);
            const hydrogenBond = getWaterClusterHydrogenBond(molecule.memberMoleculeIds ?? []);

            if (!clusterCenter || memberMolecules.length !== 2 || !hydrogenBond) {
              return;
            }

            const donorMolecule = getMoleculeById(hydrogenBond.donorMoleculeId);
            const acceptorMolecule = getMoleculeById(hydrogenBond.acceptorMoleculeId);
            const donorOxygenAtom = getWaterMoleculeOxygenAtom(donorMolecule);
            const acceptorOxygenAtom = getWaterMoleculeOxygenAtom(acceptorMolecule);
            const donorHydrogenAtoms = getWaterMoleculeHydrogenAtoms(donorMolecule);
            const acceptorHydrogenAtoms = getWaterMoleculeHydrogenAtoms(acceptorMolecule);
            const donorHydrogenFarAtom =
              donorHydrogenAtoms.find(
                (hydrogenAtom) => hydrogenAtom.id !== hydrogenBond.donorHydrogenAtom.id
              ) ?? null;
            const [acceptorHydrogenTopAtom, acceptorHydrogenBottomAtom] = acceptorHydrogenAtoms;

            if (
              !donorMolecule ||
              !acceptorMolecule ||
              !donorOxygenAtom ||
              !acceptorOxygenAtom ||
              donorHydrogenAtoms.length !== 2 ||
              acceptorHydrogenAtoms.length !== 2 ||
              !donorHydrogenFarAtom ||
              !acceptorHydrogenTopAtom ||
              !acceptorHydrogenBottomAtom
            ) {
              return;
            }

            const targetPositions = getWaterDimerTargetPositions(clusterCenter);
            const atomTargets = new Map([
              [donorOxygenAtom.id, targetPositions.donorOxygen],
              [donorHydrogenFarAtom.id, targetPositions.donorHydrogenFar],
              [hydrogenBond.donorHydrogenAtom.id, targetPositions.donorHydrogenBonding],
              [acceptorOxygenAtom.id, targetPositions.acceptorOxygen],
              [acceptorHydrogenTopAtom.id, targetPositions.acceptorHydrogenTop],
              [acceptorHydrogenBottomAtom.id, targetPositions.acceptorHydrogenBottom],
            ]);

            atomsRef.current = atomsRef.current.map((atom) =>
              atomTargets.has(atom.id)
                ? {
                    ...atom,
                    position: atomTargets.get(atom.id),
                  }
                : atom
            );

            delete donorMolecule.snapStartedAt;
            delete donorMolecule.snapDuration;
            delete donorMolecule.originPositions;
            delete acceptorMolecule.snapStartedAt;
            delete acceptorMolecule.snapDuration;
            delete acceptorMolecule.originPositions;
            syncMoleculeGeometry(donorMolecule);
            syncMoleculeGeometry(acceptorMolecule);
            syncMoleculeGeometry(molecule);
          };

          const layoutCarbonDioxideMolecule = (molecule, carbonAtom) => {
            const oxygenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "O")
              .sort((left, right) => left.position.x - right.position.x);

            if (oxygenAtoms.length !== 2) {
              return;
            }

            const targetPositions = [
              clampPosition({
                x: carbonAtom.position.x + getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[0], canvas).x,
                y: carbonAtom.position.y + getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[0], canvas).y,
              }),
              clampPosition({
                x: carbonAtom.position.x + getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[1], canvas).x,
                y: carbonAtom.position.y + getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[1], canvas).y,
              }),
            ];
            const atomMap = new Map(
              atomsRef.current.map((atom) => [
                atom.id,
                atom.id === carbonAtom.id
                  ? {
                      ...atom,
                      position: clampPosition(carbonAtom.position),
                    }
                  : oxygenAtoms.some((oxygenAtom) => oxygenAtom.id === atom.id)
                    ? {
                        ...atom,
                        position:
                          targetPositions[
                            oxygenAtoms.findIndex((oxygenAtom) => oxygenAtom.id === atom.id)
                          ],
                      }
                    : atom,
              ])
            );

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          const layoutDiatomicMolecule = (molecule, centerPosition) => {
            const moleculeAtoms = getMoleculeAtoms(molecule)
              .sort((left, right) => {
                if (molecule.formula === "CO") {
                  if (left.type === "C" && right.type === "O") {
                    return -1;
                  }

                  if (left.type === "O" && right.type === "C") {
                    return 1;
                  }
                }

                return left.position.x - right.position.x;
              });

            if (moleculeAtoms.length !== 2) {
              return;
            }

            const targetPositions = getDiatomicTargetPositions(centerPosition);
            const atomMap = new Map(
              atomsRef.current.map((atom) => [
                atom.id,
                moleculeAtoms.some((moleculeAtom) => moleculeAtom.id === atom.id)
                  ? {
                      ...atom,
                      position:
                        targetPositions[
                          moleculeAtoms.findIndex((moleculeAtom) => moleculeAtom.id === atom.id)
                        ],
                    }
                  : atom,
              ])
            );

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          const layoutMethaneMolecule = (molecule, carbonAtom) => {
            const hydrogenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "H")
              .sort((left, right) => {
                if (left.position.y !== right.position.y) {
                  return left.position.y - right.position.y;
                }

                return left.position.x - right.position.x;
              });

            if (hydrogenAtoms.length !== 4) {
              return;
            }

            const targetPositions = getMethaneTargetPositions(carbonAtom.position);
            const atomMap = new Map(
              atomsRef.current.map((atom) => [
                atom.id,
                atom.id === carbonAtom.id
                  ? {
                      ...atom,
                      position: clampPosition(carbonAtom.position),
                    }
                  : hydrogenAtoms.some((hydrogenAtom) => hydrogenAtom.id === atom.id)
                    ? {
                        ...atom,
                        position:
                          targetPositions[
                            hydrogenAtoms.findIndex((hydrogenAtom) => hydrogenAtom.id === atom.id)
                          ],
                      }
                    : atom,
              ])
            );

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          const layoutAmmoniaMolecule = (molecule, nitrogenAtom) => {
            const hydrogenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "H")
              .sort((left, right) => {
                if (left.position.y !== right.position.y) {
                  return left.position.y - right.position.y;
                }

                return left.position.x - right.position.x;
              });

            if (hydrogenAtoms.length !== 3) {
              return;
            }

            const targetPositions = getAmmoniaTargetPositions(nitrogenAtom.position);
            const atomMap = new Map(
              atomsRef.current.map((atom) => {
                let nextAtom = atom;

                if (atom.id === nitrogenAtom.id) {
                  nextAtom = { ...atom, position: targetPositions.nitrogen };
                } else if (atom.id === hydrogenAtoms[0].id) {
                  nextAtom = { ...atom, position: targetPositions.hydrogen0 };
                } else if (atom.id === hydrogenAtoms[1].id) {
                  nextAtom = { ...atom, position: targetPositions.hydrogen1 };
                } else if (atom.id === hydrogenAtoms[2].id) {
                  nextAtom = { ...atom, position: targetPositions.hydrogen2 };
                }

                return [atom.id, nextAtom];
              })
            );

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          const layoutCarbonicAcidMolecule = (molecule, carbonAtom) => {
            const oxygenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "O")
              .sort((left, right) => {
                if (left.position.y !== right.position.y) {
                  return left.position.y - right.position.y;
                }

                return left.position.x - right.position.x;
              });
            const hydrogenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.type === "H")
              .sort((left, right) => left.position.x - right.position.x);

            if (oxygenAtoms.length !== 3 || hydrogenAtoms.length !== 2) {
              return;
            }

            const [doubleOxygenAtom, leftHydroxylOxygenAtom, rightHydroxylOxygenAtom] = oxygenAtoms;
            const targetPositions = getCarbonicAcidTargetPositions(carbonAtom.position);
            const atomMap = new Map(
              atomsRef.current.map((atom) => {
                let nextAtom = atom;

                if (atom.id === carbonAtom.id) {
                  nextAtom = { ...atom, position: targetPositions.carbon };
                } else if (atom.id === doubleOxygenAtom.id) {
                  nextAtom = { ...atom, position: targetPositions.doubleOxygen };
                } else if (atom.id === leftHydroxylOxygenAtom.id) {
                  nextAtom = { ...atom, position: targetPositions.hydroxylLeftOxygen };
                } else if (atom.id === rightHydroxylOxygenAtom.id) {
                  nextAtom = { ...atom, position: targetPositions.hydroxylRightOxygen };
                } else if (atom.id === hydrogenAtoms[0].id) {
                  nextAtom = { ...atom, position: targetPositions.hydroxylHydrogenLeft };
                } else if (atom.id === hydrogenAtoms[1].id) {
                  nextAtom = { ...atom, position: targetPositions.hydroxylHydrogenRight };
                }

                return [atom.id, nextAtom];
              })
            );

            atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
            syncMoleculeGeometry(molecule);
          };

          // Generic template molecules: targets are the anchor position plus
          // each role's scaled layout offset.
          const getGenericTargetPositions = (template, anchorPosition) =>
            template.layout.map((entry) =>
              clampPosition({
                x: anchorPosition.x + getScaledCanvasOffset(entry, canvas).x,
                y: anchorPosition.y + getScaledCanvasOffset(entry, canvas).y,
              })
            );

          const layoutGenericMolecule = (molecule, template) => {
            const anchorAtom = getAtomById(molecule.atomIds[0]);

            if (!anchorAtom) {
              return;
            }

            const targetPositions = getGenericTargetPositions(template, anchorAtom.position);
            const atomTargets = new Map(
              molecule.atomIds.map((atomId, roleIndex) => [atomId, targetPositions[roleIndex]])
            );

            atomsRef.current = atomsRef.current.map((atom) =>
              atomTargets.has(atom.id) && atomTargets.get(atom.id)
                ? { ...atom, position: atomTargets.get(atom.id) }
                : atom
            );
            syncMoleculeGeometry(molecule);
          };

          const getUnmoleculedBondAdjacency = () => {
            const atomById = new Map(atomsRef.current.map((atom) => [atom.id, atom]));
            const adjacency = new Map();

            for (const bond of bondsRef.current) {
              const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
              const leftAtom = atomById.get(leftAtomId);
              const rightAtom = atomById.get(rightAtomId);

              if (!leftAtom || !rightAtom || leftAtom.moleculeId !== null || rightAtom.moleculeId !== null) {
                continue;
              }

              adjacency.set(leftAtomId, [...(adjacency.get(leftAtomId) ?? []), rightAtomId]);
              adjacency.set(rightAtomId, [...(adjacency.get(rightAtomId) ?? []), leftAtomId]);
            }

            return { atomById, adjacency };
          };

          const getBondedComponents = (atomById, adjacency) => {
            const visited = new Set();
            const components = [];

            for (const atom of atomsRef.current) {
              if (atom.moleculeId !== null || visited.has(atom.id) || !adjacency.has(atom.id)) {
                continue;
              }

              const stack = [atom.id];
              const componentAtomIds = [];

              while (stack.length > 0) {
                const currentAtomId = stack.pop();

                if (visited.has(currentAtomId)) {
                  continue;
                }

                visited.add(currentAtomId);
                componentAtomIds.push(currentAtomId);

                for (const neighborAtomId of adjacency.get(currentAtomId) ?? []) {
                  if (!visited.has(neighborAtomId)) {
                    stack.push(neighborAtomId);
                  }
                }
              }

              components.push(
                componentAtomIds.map((atomId) => atomById.get(atomId)).filter(Boolean)
              );
            }

            return components;
          };

          const tryFormWaterMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 3) {
                continue;
              }

              const oxygenAtoms = componentAtoms.filter(({ type }) => type === "O");
              const hydrogenAtoms = componentAtoms.filter(({ type }) => type === "H");

              if (oxygenAtoms.length !== 1 || hydrogenAtoms.length !== 2) {
                continue;
              }

              const oxygenAtom = oxygenAtoms[0];
              const oxygenNeighbors = adjacency.get(oxygenAtom.id) ?? [];

              if (
                oxygenNeighbors.length !== 2 ||
                !hydrogenAtoms.every((hydrogenAtom) => oxygenNeighbors.includes(hydrogenAtom.id))
              ) {
                continue;
              }

              if (
                hydrogenAtoms.some(
                  (hydrogenAtom) =>
                    (adjacency.get(hydrogenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== oxygenAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [oxygenAtom.id, ...hydrogenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "water",
                displayLabel: "H2O",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormHydrogenMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 2 || componentAtoms.some(({ type }) => type !== "H")) {
                continue;
              }

              const [leftHydrogenAtom, rightHydrogenAtom] = [...componentAtoms].sort(
                (left, right) => left.position.x - right.position.x
              );
              const leftNeighbors = adjacency.get(leftHydrogenAtom.id) ?? [];
              const rightNeighbors = adjacency.get(rightHydrogenAtom.id) ?? [];

              if (
                leftNeighbors.length !== 1 ||
                rightNeighbors.length !== 1 ||
                leftNeighbors[0] !== rightHydrogenAtom.id ||
                rightNeighbors[0] !== leftHydrogenAtom.id
              ) {
                continue;
              }

              const atomIds = [leftHydrogenAtom.id, rightHydrogenAtom.id];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "hydrogen",
                displayLabel: "H2",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormCarbonMonoxideMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 2) {
                continue;
              }

              const carbonAtoms = componentAtoms.filter(({ type }) => type === "C");
              const oxygenAtoms = componentAtoms.filter(({ type }) => type === "O");

              if (carbonAtoms.length !== 1 || oxygenAtoms.length !== 1) {
                continue;
              }

              const carbonAtom = carbonAtoms[0];
              const oxygenAtom = oxygenAtoms[0];
              const carbonNeighbors = adjacency.get(carbonAtom.id) ?? [];
              const oxygenNeighbors = adjacency.get(oxygenAtom.id) ?? [];

              if (
                carbonNeighbors.length !== 1 ||
                oxygenNeighbors.length !== 1 ||
                carbonNeighbors[0] !== oxygenAtom.id ||
                oxygenNeighbors[0] !== carbonAtom.id
              ) {
                continue;
              }

              const atomIds = [carbonAtom.id, oxygenAtom.id];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "carbonMonoxide",
                displayLabel: "CO",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormOxygenMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 2 || componentAtoms.some(({ type }) => type !== "O")) {
                continue;
              }

              const [leftOxygenAtom, rightOxygenAtom] = [...componentAtoms].sort(
                (left, right) => left.position.x - right.position.x
              );
              const leftNeighbors = adjacency.get(leftOxygenAtom.id) ?? [];
              const rightNeighbors = adjacency.get(rightOxygenAtom.id) ?? [];

              if (
                leftNeighbors.length !== 1 ||
                rightNeighbors.length !== 1 ||
                leftNeighbors[0] !== rightOxygenAtom.id ||
                rightNeighbors[0] !== leftOxygenAtom.id
              ) {
                continue;
              }

              const atomIds = [leftOxygenAtom.id, rightOxygenAtom.id];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "oxygen",
                displayLabel: "O2",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormNitrogenMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 2 || componentAtoms.some(({ type }) => type !== "N")) {
                continue;
              }

              const [leftNitrogenAtom, rightNitrogenAtom] = [...componentAtoms].sort(
                (left, right) => left.position.x - right.position.x
              );
              const leftNeighbors = adjacency.get(leftNitrogenAtom.id) ?? [];
              const rightNeighbors = adjacency.get(rightNitrogenAtom.id) ?? [];

              if (
                leftNeighbors.length !== 1 ||
                rightNeighbors.length !== 1 ||
                leftNeighbors[0] !== rightNitrogenAtom.id ||
                rightNeighbors[0] !== leftNitrogenAtom.id
              ) {
                continue;
              }

              const atomIds = [leftNitrogenAtom.id, rightNitrogenAtom.id];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "nitrogen",
                displayLabel: "N2",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormCarbonDioxideMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 3) {
                continue;
              }

              const oxygenAtoms = componentAtoms.filter(({ type }) => type === "O");
              const carbonAtoms = componentAtoms.filter(({ type }) => type === "C");

              if (oxygenAtoms.length !== 2 || carbonAtoms.length !== 1) {
                continue;
              }

              const carbonAtom = carbonAtoms[0];
              const carbonNeighbors = adjacency.get(carbonAtom.id) ?? [];

              if (
                carbonNeighbors.length !== 2 ||
                !oxygenAtoms.every((oxygenAtom) => carbonNeighbors.includes(oxygenAtom.id))
              ) {
                continue;
              }

              if (
                oxygenAtoms.some(
                  (oxygenAtom) =>
                    (adjacency.get(oxygenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== carbonAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [carbonAtom.id, ...oxygenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "carbonDioxide",
                displayLabel: "CO2",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormAmmoniaMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 4) {
                continue;
              }

              const nitrogenAtoms = componentAtoms.filter(({ type }) => type === "N");
              const hydrogenAtoms = componentAtoms.filter(({ type }) => type === "H");

              if (nitrogenAtoms.length !== 1 || hydrogenAtoms.length !== 3) {
                continue;
              }

              const nitrogenAtom = nitrogenAtoms[0];
              const nitrogenNeighbors = adjacency.get(nitrogenAtom.id) ?? [];

              if (
                nitrogenNeighbors.length !== 3 ||
                !hydrogenAtoms.every((hydrogenAtom) => nitrogenNeighbors.includes(hydrogenAtom.id))
              ) {
                continue;
              }

              if (
                hydrogenAtoms.some(
                  (hydrogenAtom) =>
                    (adjacency.get(hydrogenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== nitrogenAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [nitrogenAtom.id, ...hydrogenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "ammonia",
                displayLabel: "NH3",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormMethaneMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 5) {
                continue;
              }

              const carbonAtoms = componentAtoms.filter(({ type }) => type === "C");
              const hydrogenAtoms = componentAtoms.filter(({ type }) => type === "H");

              if (carbonAtoms.length !== 1 || hydrogenAtoms.length !== 4) {
                continue;
              }

              const carbonAtom = carbonAtoms[0];
              const carbonNeighbors = adjacency.get(carbonAtom.id) ?? [];

              if (
                carbonNeighbors.length !== 4 ||
                !hydrogenAtoms.every((hydrogenAtom) => carbonNeighbors.includes(hydrogenAtom.id))
              ) {
                continue;
              }

              if (
                hydrogenAtoms.some(
                  (hydrogenAtom) =>
                    (adjacency.get(hydrogenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== carbonAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [carbonAtom.id, ...hydrogenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "methane",
                displayLabel: "CH4",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormHydroniumMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 4) {
                continue;
              }

              const oxygenAtoms = componentAtoms.filter(({ type }) => type === "O");
              const hydrogenAtoms = componentAtoms.filter(({ type }) => type === "H");

              if (oxygenAtoms.length !== 1 || hydrogenAtoms.length !== 3) {
                continue;
              }

              const oxygenAtom = oxygenAtoms[0];
              const oxygenNeighbors = adjacency.get(oxygenAtom.id) ?? [];

              if (
                oxygenNeighbors.length !== 3 ||
                !hydrogenAtoms.every((hydrogenAtom) => oxygenNeighbors.includes(hydrogenAtom.id))
              ) {
                continue;
              }

              if (
                hydrogenAtoms.some(
                  (hydrogenAtom) =>
                    (adjacency.get(hydrogenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== oxygenAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [oxygenAtom.id, ...hydrogenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "hydronium",
                displayLabel: "H3O⁺",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormAmmoniumMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 5) {
                continue;
              }

              const nitrogenAtoms = componentAtoms.filter(({ type }) => type === "N");
              const hydrogenAtoms = componentAtoms.filter(({ type }) => type === "H");

              if (nitrogenAtoms.length !== 1 || hydrogenAtoms.length !== 4) {
                continue;
              }

              const nitrogenAtom = nitrogenAtoms[0];
              const nitrogenNeighbors = adjacency.get(nitrogenAtom.id) ?? [];

              if (
                nitrogenNeighbors.length !== 4 ||
                !hydrogenAtoms.every((hydrogenAtom) => nitrogenNeighbors.includes(hydrogenAtom.id))
              ) {
                continue;
              }

              if (
                hydrogenAtoms.some(
                  (hydrogenAtom) =>
                    (adjacency.get(hydrogenAtom.id) ?? []).some(
                      (neighborAtomId) => neighborAtomId !== nitrogenAtom.id
                    )
                )
              ) {
                continue;
              }

              const atomIds = [nitrogenAtom.id, ...hydrogenAtoms.map(({ id }) => id)];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "ammonium",
                displayLabel: "NH4⁺",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormSodiumChlorideMolecules = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const { atomById, adjacency } = getUnmoleculedBondAdjacency();

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              if (componentAtoms.length !== 2) {
                continue;
              }

              const sodiumAtoms = componentAtoms.filter(({ type }) => type === "Na");
              const chlorineAtoms = componentAtoms.filter(({ type }) => type === "Cl");

              if (sodiumAtoms.length !== 1 || chlorineAtoms.length !== 1) {
                continue;
              }

              const atomIds = [sodiumAtoms[0].id, chlorineAtoms[0].id];
              const comboKey = getMoleculeComboKey(atomIds);

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                type: "sodiumChloride",
                displayLabel: "NaCl",
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const tryFormGenericMolecules = () => {
            const now = performance.now();
            const { atomById, adjacency } = getUnmoleculedBondAdjacency();
            const seenComboKeys = new Set();
            let promptCandidate = null;

            for (const componentAtoms of getBondedComponents(atomById, adjacency)) {
              const comboKey = getMoleculeComboKey(componentAtoms.map(({ id }) => id));

              seenComboKeys.add(comboKey);

              if (!genericComponentAgesRef.current.has(comboKey)) {
                genericComponentAgesRef.current.set(comboKey, now);
              }

              // No template offers during the tutorial — it teaches water, and
              // an OH- prompt mid-lesson would derail (and confuse) the flow.
              if (promptCandidate || isAutoPromptBlocked() || tutorialActiveRef.current) {
                continue;
              }

              if (promptedMoleculeCombosRef.current[comboKey]) {
                continue;
              }

              const composition = getComponentComposition(componentAtoms);
              const template = GENERIC_MOLECULE_TEMPLATES.find(
                (entry) => !entry.reactionOnly && compositionMatchesTemplate(entry, composition)
              );

              if (!template) {
                continue;
              }

              if (
                GENERIC_TEMPLATE_NEEDS_DELAY[template.type] &&
                now - genericComponentAgesRef.current.get(comboKey) < GENERIC_PROMPT_DELAY_MS
              ) {
                continue;
              }

              // Assign atoms to template roles by type (deterministic order).
              const atomsByType = {};

              for (const atom of [...componentAtoms].sort((left, right) => {
                if (left.position.y !== right.position.y) {
                  return left.position.y - right.position.y;
                }

                return left.position.x - right.position.x;
              })) {
                atomsByType[atom.type] = [...(atomsByType[atom.type] ?? []), atom];
              }

              const orderedAtomIds = template.layout.map((entry) => atomsByType[entry.type].shift().id);

              promptCandidate = { template, comboKey, orderedAtomIds };
            }

            // Purge age entries for components that no longer exist.
            for (const staleKey of [...genericComponentAgesRef.current.keys()]) {
              if (!seenComboKeys.has(staleKey)) {
                genericComponentAgesRef.current.delete(staleKey);
              }
            }

            if (promptCandidate) {
              setPromptedComboStatus(promptCandidate.comboKey, "prompted");
              setMoleculePromptState({
                kind: "generic",
                type: promptCandidate.template.type,
                displayLabel: promptCandidate.template.displayLabel,
                comboKey: promptCandidate.comboKey,
                atomIds: promptCandidate.orderedAtomIds,
                promptText: promptCandidate.template.prompt,
              });
            }
          };

          const tryTriggerGenericReactions = () => {
            if (isAutoPromptBlocked() || tutorialActiveRef.current) {
              return;
            }

            const rangeNormalized =
              (REACTION_TRIGGER_RANGE_PX * getVisualScale()) /
              Math.min(canvas.width, canvas.height);

            for (const reaction of REACTION_TEMPLATES) {
              const reactantFormulas = Object.keys(reaction.reactantMolecules ?? {});
              const moleculePool = {};
              let poolShortage = false;

              for (const formula of reactantFormulas) {
                moleculePool[formula] = moleculesRef.current.filter(
                  (molecule) =>
                    molecule.formula === formula &&
                    molecule.center &&
                    !isWaterClusterMolecule(molecule) &&
                    !getClusterForMemberMoleculeId(molecule.id)
                );

                if (moleculePool[formula].length < reaction.reactantMolecules[formula]) {
                  poolShortage = true;
                  break;
                }
              }

              if (poolShortage || reactantFormulas.length === 0) {
                continue;
              }

              for (const seedMolecule of moleculePool[reactantFormulas[0]]) {
                const chosenMolecules = [];
                let gatherFailed = false;

                for (const formula of reactantFormulas) {
                  const needed = reaction.reactantMolecules[formula];
                  const candidates = moleculePool[formula]
                    .filter((molecule) => !chosenMolecules.includes(molecule))
                    .map((molecule) => ({
                      molecule,
                      distance: Math.hypot(
                        molecule.center.x - seedMolecule.center.x,
                        molecule.center.y - seedMolecule.center.y
                      ),
                    }))
                    .filter(
                      ({ molecule, distance }) =>
                        molecule === seedMolecule || distance <= rangeNormalized
                    )
                    .sort((left, right) => left.distance - right.distance)
                    .map(({ molecule }) => molecule);

                  if (candidates.length < needed) {
                    gatherFailed = true;
                    break;
                  }

                  chosenMolecules.push(...candidates.slice(0, needed));
                }

                if (gatherFailed) {
                  continue;
                }

                const chosenAtomIds = [];

                for (const [atomType, needed] of Object.entries(reaction.reactantAtoms ?? {})) {
                  const looseCandidates = atomsRef.current
                    .filter((atom) => atom.type === atomType && atom.moleculeId === null)
                    .map((atom) => ({
                      atom,
                      distance: Math.hypot(
                        atom.position.x - seedMolecule.center.x,
                        atom.position.y - seedMolecule.center.y
                      ),
                    }))
                    .filter(({ distance }) => distance <= rangeNormalized)
                    .sort((left, right) => left.distance - right.distance)
                    .map(({ atom }) => atom);

                  if (looseCandidates.length < needed) {
                    gatherFailed = true;
                    break;
                  }

                  chosenAtomIds.push(...looseCandidates.slice(0, needed).map(({ id }) => id));
                }

                if (gatherFailed) {
                  continue;
                }

                // Ignition check: some reactions need heat before they'll go.
                if (
                  reaction.minTemperature !== undefined &&
                  temperatureRef.current < reaction.minTemperature
                ) {
                  const hintKey = `${reaction.type}:${getMoleculeIdComboKey(
                    chosenMolecules.map(({ id }) => id)
                  )}`;

                  if (!ignitionHintShownRef.current.has(hintKey)) {
                    ignitionHintShownRef.current.add(hintKey);
                    showEventBanner(
                      {
                        kind: "discovery",
                        title: "🔥 Needs heat!",
                        subtitle: `Raise the temperature to at least ${reaction.minTemperature}°C to ignite this reaction.`,
                      },
                      3400
                    );
                  }

                  continue;
                }

                const comboKey = `rx:${reaction.type}:${getMoleculeIdComboKey(
                  chosenMolecules.map(({ id }) => id)
                )}:${[...chosenAtomIds].sort((left, right) => left - right).join("-")}`;

                if (promptedMoleculeCombosRef.current[comboKey]) {
                  continue;
                }

                setPromptedComboStatus(comboKey, "prompted");
                setMoleculePromptState({
                  kind: "genericReaction",
                  type: reaction.type,
                  displayLabel: reaction.equation,
                  comboKey,
                  sourceMoleculeIds: chosenMolecules.map(({ id }) => id),
                  sourceAtomIds: chosenAtomIds,
                  promptText: reaction.prompt,
                  atomIds: [
                    ...chosenMolecules.flatMap((molecule) => molecule.atomIds),
                    ...chosenAtomIds,
                  ],
                });
                return;
              }
            }
          };

          const tryTriggerCarbonicAcidReaction = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            const waterMolecules = moleculesRef.current.filter((molecule) => molecule.formula === "H2O");
            const carbonDioxideMolecules = moleculesRef.current.filter(
              (molecule) => molecule.formula === "CO2"
            );

            for (const waterMolecule of waterMolecules) {
              for (const carbonDioxideMolecule of carbonDioxideMolecules) {
                if (!isCarbonicAcidReactionPairInRange(waterMolecule, carbonDioxideMolecule)) {
                  continue;
                }

                const comboKey = getMoleculeIdComboKey([waterMolecule.id, carbonDioxideMolecule.id]);

                if (promptedMoleculeCombosRef.current[comboKey]) {
                  continue;
                }

                setPromptedComboStatus(comboKey, "prompted");
                setMoleculePromptState({
                  kind: "reaction",
                  type: "carbonicAcid",
                  displayLabel: "H2CO3",
                  comboKey,
                  sourceMoleculeIds: [waterMolecule.id, carbonDioxideMolecule.id],
                  atomIds: [...waterMolecule.atomIds, ...carbonDioxideMolecule.atomIds],
                });
                return;
              }
            }
          };

          const tryFormWaterCluster = () => {
            if (isAutoPromptBlocked()) {
              return;
            }

            for (const bond of getWaterHydrogenBondData().bonds) {
              const leftMolecule = getMoleculeById(bond.sourceMoleculeId);
              const rightMolecule = getMoleculeById(bond.targetMoleculeId);

              if (!leftMolecule || !rightMolecule) {
                continue;
              }

              const comboKey = getMoleculeIdComboKey([leftMolecule.id, rightMolecule.id]);

              if (
                promptedMoleculeCombosRef.current[comboKey] ||
                getClusterForMemberMoleculeId(leftMolecule.id)
              ) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setMoleculePromptState({
                kind: "cluster",
                type: "waterDimer",
                displayLabel: "2H2O",
                comboKey,
                sourceMoleculeIds: [leftMolecule.id, rightMolecule.id],
                atomIds: [...leftMolecule.atomIds, ...rightMolecule.atomIds],
              });
              return;
            }
          };

          const syncPendingMoleculePrompt = () => {
            const currentPrompt = moleculePromptRef.current;

            if (!currentPrompt) {
              return;
            }

            if (currentPrompt.kind === "reaction" && currentPrompt.type === "carbonicAcid") {
              const sourceMolecules = currentPrompt.sourceMoleculeIds
                .map((moleculeId) => getMoleculeById(moleculeId))
                .filter(Boolean);

              if (sourceMolecules.length !== 2) {
                setMoleculePromptState(null);
                return;
              }

              const waterMolecule = sourceMolecules.find((molecule) => molecule.formula === "H2O");
              const carbonDioxideMolecule = sourceMolecules.find((molecule) => molecule.formula === "CO2");

              if (!waterMolecule || !carbonDioxideMolecule) {
                setMoleculePromptState(null);
                return;
              }

              if (!isCarbonicAcidReactionPairInRange(waterMolecule, carbonDioxideMolecule)) {
                setMoleculePromptState(null);
              }
              return;
            }

            if (currentPrompt.kind === "cluster" && currentPrompt.type === "waterDimer") {
              const sourceMolecules = currentPrompt.sourceMoleculeIds
                .map((moleculeId) => getMoleculeById(moleculeId))
                .filter(Boolean);

              if (
                sourceMolecules.length !== 2 ||
                sourceMolecules.some((molecule) => molecule.formula !== "H2O")
              ) {
                setMoleculePromptState(null);
                return;
              }

              const hasHydrogenBond =
                bondsRef.current.some((bond) => {
                  if (getBondCategory(bond) !== "hydrogenBond") {
                    return false;
                  }

                  const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
                  const leftAtom = getAtomById(leftAtomId);
                  const rightAtom = getAtomById(rightAtomId);

                  if (!leftAtom || !rightAtom) {
                    return false;
                  }

                  const bondMoleculeIds = [leftAtom.moleculeId, rightAtom.moleculeId].sort(
                    (left, right) => left - right
                  );
                  const sourceIds = [...currentPrompt.sourceMoleculeIds].sort(
                    (left, right) => left - right
                  );

                  return (
                    bondMoleculeIds[0] === sourceIds[0] &&
                    bondMoleculeIds[1] === sourceIds[1]
                  );
                }) ||
                hasDetectedWaterHydrogenBondBetweenMolecules(
                  currentPrompt.sourceMoleculeIds
                );

              if (!hasHydrogenBond || getClusterForMemberMoleculeId(currentPrompt.sourceMoleculeIds[0])) {
                setMoleculePromptState(null);
              }

              return;
            }

            if (currentPrompt.kind === "genericReaction") {
              const reaction = REACTION_TEMPLATES.find(
                (entry) => entry.type === currentPrompt.type
              );
              const sourceMolecules = currentPrompt.sourceMoleculeIds
                .map((moleculeId) => getMoleculeById(moleculeId))
                .filter(Boolean);
              const sourceAtoms = (currentPrompt.sourceAtomIds ?? [])
                .map((atomId) => getAtomById(atomId))
                .filter(Boolean);

              if (
                !reaction ||
                sourceMolecules.length !== currentPrompt.sourceMoleculeIds.length ||
                sourceAtoms.length !== (currentPrompt.sourceAtomIds ?? []).length ||
                sourceAtoms.some((atom) => atom.moleculeId !== null)
              ) {
                setMoleculePromptState(null);
                return;
              }

              // Cancel the offer if the reactants get dragged apart.
              const reactantPoints = [
                ...sourceMolecules.map((molecule) => molecule.center).filter(Boolean),
                ...sourceAtoms.map((atom) => atom.position),
              ];
              const reactantCentroid = reactantPoints.reduce(
                (sum, point) => ({
                  x: sum.x + point.x / reactantPoints.length,
                  y: sum.y + point.y / reactantPoints.length,
                }),
                { x: 0, y: 0 }
              );
              const cancelRangeNormalized =
                ((REACTION_TRIGGER_RANGE_PX * getVisualScale()) /
                  Math.min(canvas.width, canvas.height)) *
                1.7;

              if (
                reactantPoints.some(
                  (point) =>
                    Math.hypot(point.x - reactantCentroid.x, point.y - reactantCentroid.y) >
                    cancelRangeNormalized
                )
              ) {
                setMoleculePromptState(null);
              }

              return;
            }

            if (currentPrompt.kind === "generic") {
              const template = GENERIC_MOLECULE_TEMPLATES.find(
                (entry) => entry.type === currentPrompt.type
              );
              const genericPromptAtoms = getAtomsByIds(currentPrompt.atomIds);

              if (
                !template ||
                genericPromptAtoms.length !== currentPrompt.atomIds.length ||
                genericPromptAtoms.some((atom) => atom.moleculeId !== null) ||
                !compositionMatchesTemplate(template, getComponentComposition(genericPromptAtoms))
              ) {
                setMoleculePromptState(null);
              }

              return;
            }

            const promptAtoms = getAtomsByIds(currentPrompt.atomIds);

            if (promptAtoms.some((atom) => atom.moleculeId !== null)) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "water" &&
              (
                promptAtoms.filter((atom) => atom.type === "O").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 2
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "hydrogen" &&
              (
                promptAtoms.length !== 2 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 2
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "carbonMonoxide" &&
              (
                promptAtoms.length !== 2 ||
                promptAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "O").length !== 1
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "oxygen" &&
              (
                promptAtoms.length !== 2 ||
                promptAtoms.filter((atom) => atom.type === "O").length !== 2
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "nitrogen" &&
              (
                promptAtoms.length !== 2 ||
                promptAtoms.filter((atom) => atom.type === "N").length !== 2
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "carbonDioxide" &&
              (
                promptAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "O").length !== 2
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "methane" &&
              (
                promptAtoms.length !== 5 ||
                promptAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 4
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "ammonia" &&
              (
                promptAtoms.length !== 4 ||
                promptAtoms.filter((atom) => atom.type === "N").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 3
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "hydronium" &&
              (
                promptAtoms.length !== 4 ||
                promptAtoms.filter((atom) => atom.type === "O").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 3
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "ammonium" &&
              (
                promptAtoms.length !== 5 ||
                promptAtoms.filter((atom) => atom.type === "N").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "H").length !== 4
              )
            ) {
              setMoleculePromptState(null);
              return;
            }

            if (
              currentPrompt.type === "sodiumChloride" &&
              (
                promptAtoms.length !== 2 ||
                promptAtoms.filter((atom) => atom.type === "Na").length !== 1 ||
                promptAtoms.filter((atom) => atom.type === "Cl").length !== 1
              )
            ) {
              setMoleculePromptState(null);
            }
          };

          const animateMolecules = () => {
            const now = performance.now();

            for (const molecule of moleculesRef.current) {
              if (!molecule.snapStartedAt) {
                continue;
              }

              const progress = Math.min(
                1,
                (now - molecule.snapStartedAt) / molecule.snapDuration
              );
              const easedProgress = 1 - (1 - progress) * (1 - progress);
              const atomMap = new Map(atomsRef.current.map((atom) => [atom.id, { ...atom }]));
              const genericTemplate = getGenericTemplateForMolecule(molecule);

              if (genericTemplate) {
                const anchorAtom = getAtomById(molecule.atomIds[0]);

                if (anchorAtom) {
                  const anchorStartPosition =
                    molecule.originPositions?.[anchorAtom.id] ?? anchorAtom.position;
                  const targetPositions = getGenericTargetPositions(
                    genericTemplate,
                    anchorStartPosition
                  );

                  molecule.atomIds.forEach((atomId, roleIndex) => {
                    const atom = getAtomById(atomId);
                    const targetPosition = targetPositions[roleIndex];

                    if (!atom || !targetPosition) {
                      return;
                    }

                    const startPosition = molecule.originPositions?.[atom.id] ?? atom.position;

                    atomMap.set(atomId, {
                      ...atomMap.get(atomId),
                      position: clampPosition({
                        x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                        y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                      }),
                    });
                  });
                }
              }

              if (molecule.formula === "2H2O") {
                const clusterAtoms = getMoleculeAtoms(molecule);
                const hydrogenBond = getWaterClusterHydrogenBond(molecule.memberMoleculeIds ?? []);
                const donorMolecule = hydrogenBond
                  ? getMoleculeById(hydrogenBond.donorMoleculeId)
                  : null;
                const acceptorMolecule = hydrogenBond
                  ? getMoleculeById(hydrogenBond.acceptorMoleculeId)
                  : null;
                const donorOxygenAtom = getWaterMoleculeOxygenAtom(donorMolecule);
                const acceptorOxygenAtom = getWaterMoleculeOxygenAtom(acceptorMolecule);
                const donorHydrogenAtoms = getWaterMoleculeHydrogenAtoms(donorMolecule);
                const acceptorHydrogenAtoms = getWaterMoleculeHydrogenAtoms(acceptorMolecule);
                const donorHydrogenFarAtom =
                  donorHydrogenAtoms.find(
                    (hydrogenAtom) => hydrogenAtom.id !== hydrogenBond?.donorHydrogenAtom.id
                  ) ?? null;
                const [acceptorHydrogenTopAtom, acceptorHydrogenBottomAtom] = acceptorHydrogenAtoms;

                if (
                  clusterAtoms.length !== 6 ||
                  !hydrogenBond ||
                  !donorOxygenAtom ||
                  !acceptorOxygenAtom ||
                  !donorHydrogenFarAtom ||
                  !acceptorHydrogenTopAtom ||
                  !acceptorHydrogenBottomAtom
                ) {
                  continue;
                }

                const clusterStartCenter = clusterAtoms.reduce(
                  (sum, atom) => {
                    const originPosition = molecule.originPositions?.[atom.id] ?? atom.position;
                    return {
                      x: sum.x + originPosition.x,
                      y: sum.y + originPosition.y,
                    };
                  },
                  { x: 0, y: 0 }
                );
                const targetPositions = getWaterDimerTargetPositions({
                  x: clusterStartCenter.x / clusterAtoms.length,
                  y: clusterStartCenter.y / clusterAtoms.length,
                });
                const atomTargets = new Map([
                  [donorOxygenAtom.id, targetPositions.donorOxygen],
                  [donorHydrogenFarAtom.id, targetPositions.donorHydrogenFar],
                  [hydrogenBond.donorHydrogenAtom.id, targetPositions.donorHydrogenBonding],
                  [acceptorOxygenAtom.id, targetPositions.acceptorOxygen],
                  [acceptorHydrogenTopAtom.id, targetPositions.acceptorHydrogenTop],
                  [acceptorHydrogenBottomAtom.id, targetPositions.acceptorHydrogenBottom],
                ]);

                for (const atom of clusterAtoms) {
                  const startPosition = molecule.originPositions?.[atom.id] ?? atom.position;
                  const targetPosition = atomTargets.get(atom.id) ?? atom.position;

                  atomMap.set(atom.id, {
                    ...atomMap.get(atom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                }
              }

              if (molecule.formula === "H2O") {
                const oxygenAtom = getAtomById(molecule.atomIds[0]);
                const hydrogenAtoms = molecule.atomIds
                  .slice(1)
                  .map((atomId) => getAtomById(atomId))
                  .filter(Boolean)
                  .sort((left, right) => left.position.x - right.position.x);

                if (!oxygenAtom || oxygenAtom.type !== "O" || hydrogenAtoms.length !== 2) {
                  continue;
                }

                const targetPositions = getWaterTargetPositions(
                  molecule.originPositions?.[oxygenAtom.id] ?? oxygenAtom.position
                );

                atomMap.set(oxygenAtom.id, {
                  ...atomMap.get(oxygenAtom.id),
                  position: clampPosition(
                    molecule.originPositions?.[oxygenAtom.id] ?? oxygenAtom.position
                  ),
                });

                hydrogenAtoms.forEach((hydrogenAtom, hydrogenIndex) => {
                  const startPosition =
                    molecule.originPositions?.[hydrogenAtom.id] ?? hydrogenAtom.position;
                  const targetPosition = targetPositions[hydrogenIndex];

                  atomMap.set(hydrogenAtom.id, {
                    ...atomMap.get(hydrogenAtom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              if (molecule.formula === "CO2") {
                const leftOxygenAtom = getAtomById(molecule.atomIds[0]);
                const carbonAtom = getAtomById(molecule.atomIds[1]);
                const rightOxygenAtom = getAtomById(molecule.atomIds[2]);

                if (
                  !leftOxygenAtom ||
                  leftOxygenAtom.type !== "O" ||
                  !carbonAtom ||
                  carbonAtom.type !== "C" ||
                  !rightOxygenAtom ||
                  rightOxygenAtom.type !== "O"
                ) {
                  continue;
                }

                const carbonStartPosition =
                  molecule.originPositions?.[carbonAtom.id] ?? carbonAtom.position;
                const targetPositions = {
                  [leftOxygenAtom.id]: clampPosition({
                    x:
                      carbonStartPosition.x +
                      getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[0], canvas).x,
                    y:
                      carbonStartPosition.y +
                      getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[0], canvas).y,
                  }),
                  [carbonAtom.id]: clampPosition(carbonStartPosition),
                  [rightOxygenAtom.id]: clampPosition({
                    x:
                      carbonStartPosition.x +
                      getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[1], canvas).x,
                    y:
                      carbonStartPosition.y +
                      getScaledCanvasOffset(CARBON_DIOXIDE_LAYOUT_OFFSETS_PX[1], canvas).y,
                  }),
                };

                [leftOxygenAtom, carbonAtom, rightOxygenAtom].forEach((atom) => {
                  const startPosition = molecule.originPositions?.[atom.id] ?? atom.position;
                  const targetPosition = targetPositions[atom.id] ?? atom.position;

                  atomMap.set(atom.id, {
                    ...atomMap.get(atom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              if (
                molecule.formula === "H2" ||
                molecule.formula === "O2" ||
                molecule.formula === "N2" ||
                molecule.formula === "NaCl"
              ) {
                const leftAtom = getAtomById(molecule.atomIds[0]);
                const rightAtom = getAtomById(molecule.atomIds[1]);

                if (!leftAtom || !rightAtom) {
                  continue;
                }

                const centerStartPosition = molecule.originPositions?.[leftAtom.id]
                  ? getAtomGroupCenter([
                      {
                        ...leftAtom,
                        position: molecule.originPositions[leftAtom.id],
                      },
                      {
                        ...rightAtom,
                        position: molecule.originPositions?.[rightAtom.id] ?? rightAtom.position,
                      },
                    ])
                  : molecule.center ?? getAtomGroupCenter([leftAtom, rightAtom]);
                const targetPositions = getDiatomicTargetPositions(centerStartPosition);

                [leftAtom, rightAtom].forEach((atom, atomIndex) => {
                  const startPosition = molecule.originPositions?.[atom.id] ?? atom.position;
                  const targetPosition = targetPositions[atomIndex];

                  atomMap.set(atom.id, {
                    ...atomMap.get(atom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              if (molecule.formula === "CH4" || molecule.formula === "NH4+") {
                const carbonAtom = getAtomById(molecule.atomIds[0]);
                const hydrogenAtoms = molecule.atomIds
                  .slice(1)
                  .map((atomId) => getAtomById(atomId))
                  .filter(Boolean)
                  .sort((left, right) => {
                    if (left.position.y !== right.position.y) {
                      return left.position.y - right.position.y;
                    }

                    return left.position.x - right.position.x;
                  });

                if (
                  !carbonAtom ||
                  (carbonAtom.type !== "C" && carbonAtom.type !== "N") ||
                  hydrogenAtoms.length !== 4
                ) {
                  continue;
                }

                const carbonStartPosition =
                  molecule.originPositions?.[carbonAtom.id] ?? carbonAtom.position;
                const targetPositions = getMethaneTargetPositions(carbonStartPosition);

                atomMap.set(carbonAtom.id, {
                  ...atomMap.get(carbonAtom.id),
                  position: clampPosition(carbonStartPosition),
                });

                hydrogenAtoms.forEach((hydrogenAtom, hydrogenIndex) => {
                  const startPosition =
                    molecule.originPositions?.[hydrogenAtom.id] ?? hydrogenAtom.position;
                  const targetPosition = targetPositions[hydrogenIndex];

                  atomMap.set(hydrogenAtom.id, {
                    ...atomMap.get(hydrogenAtom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              if (molecule.formula === "NH3" || molecule.formula === "H3O+") {
                const nitrogenAtom = getAtomById(molecule.atomIds[0]);
                const hydrogenAtoms = molecule.atomIds
                  .slice(1)
                  .map((atomId) => getAtomById(atomId))
                  .filter(Boolean)
                  .sort((left, right) => {
                    if (left.position.y !== right.position.y) {
                      return left.position.y - right.position.y;
                    }

                    return left.position.x - right.position.x;
                  });

                if (
                  !nitrogenAtom ||
                  (nitrogenAtom.type !== "N" && nitrogenAtom.type !== "O") ||
                  hydrogenAtoms.length !== 3
                ) {
                  continue;
                }

                const nitrogenStartPosition =
                  molecule.originPositions?.[nitrogenAtom.id] ?? nitrogenAtom.position;
                const targetPositions = getAmmoniaTargetPositions(nitrogenStartPosition);

                atomMap.set(nitrogenAtom.id, {
                  ...atomMap.get(nitrogenAtom.id),
                  position: clampPosition(nitrogenStartPosition),
                });

                hydrogenAtoms.forEach((hydrogenAtom, hydrogenIndex) => {
                  const startPosition =
                    molecule.originPositions?.[hydrogenAtom.id] ?? hydrogenAtom.position;
                  const targetPosition = targetPositions[`hydrogen${hydrogenIndex}`];

                  atomMap.set(hydrogenAtom.id, {
                    ...atomMap.get(hydrogenAtom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              if (molecule.formula === "H2CO3") {
                const carbonAtom = getAtomById(molecule.atomIds[0]);
                const doubleOxygenAtom = getAtomById(molecule.atomIds[1]);
                const leftHydroxylOxygenAtom = getAtomById(molecule.atomIds[2]);
                const rightHydroxylOxygenAtom = getAtomById(molecule.atomIds[3]);
                const leftHydrogenAtom = getAtomById(molecule.atomIds[4]);
                const rightHydrogenAtom = getAtomById(molecule.atomIds[5]);

                if (
                  !carbonAtom ||
                  !doubleOxygenAtom ||
                  !leftHydroxylOxygenAtom ||
                  !rightHydroxylOxygenAtom ||
                  !leftHydrogenAtom ||
                  !rightHydrogenAtom
                ) {
                  continue;
                }

                const carbonStartPosition =
                  molecule.originPositions?.[carbonAtom.id] ?? carbonAtom.position;
                const targetPositions = getCarbonicAcidTargetPositions(carbonStartPosition);

                [
                  [carbonAtom, targetPositions.carbon],
                  [doubleOxygenAtom, targetPositions.doubleOxygen],
                  [leftHydroxylOxygenAtom, targetPositions.hydroxylLeftOxygen],
                  [rightHydroxylOxygenAtom, targetPositions.hydroxylRightOxygen],
                  [leftHydrogenAtom, targetPositions.hydroxylHydrogenLeft],
                  [rightHydrogenAtom, targetPositions.hydroxylHydrogenRight],
                ].forEach(([atom, targetPosition]) => {
                  const startPosition = molecule.originPositions?.[atom.id] ?? atom.position;

                  atomMap.set(atom.id, {
                    ...atomMap.get(atom.id),
                    position: clampPosition({
                      x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
                      y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
                    }),
                  });
                });
              }

              atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
              syncMoleculeGeometry(molecule);

              if (progress >= 1) {
                delete molecule.snapStartedAt;
                delete molecule.snapDuration;
                delete molecule.originPositions;

                if (genericTemplate) {
                  layoutGenericMolecule(molecule, genericTemplate);
                } else if (molecule.formula === "H2O") {
                  const oxygenAtom = getAtomById(molecule.atomIds[0]);

                  if (oxygenAtom) {
                    layoutWaterMolecule(molecule, atomMap.get(oxygenAtom.id) ?? oxygenAtom);
                  }
                } else if (molecule.formula === "CO2") {
                  const carbonAtom = getAtomById(molecule.atomIds[1]);

                  if (carbonAtom) {
                    layoutCarbonDioxideMolecule(molecule, atomMap.get(carbonAtom.id) ?? carbonAtom);
                  }
                } else if (
                  molecule.formula === "CO" ||
                  molecule.formula === "H2" ||
                  molecule.formula === "O2" ||
                  molecule.formula === "N2" ||
                  molecule.formula === "NaCl"
                ) {
                  layoutDiatomicMolecule(
                    molecule,
                    molecule.center ?? getAtomGroupCenter(getMoleculeAtoms(molecule))
                  );
                } else if (molecule.formula === "CH4" || molecule.formula === "NH4+") {
                  const carbonAtom = getAtomById(molecule.atomIds[0]);

                  if (carbonAtom) {
                    layoutMethaneMolecule(molecule, atomMap.get(carbonAtom.id) ?? carbonAtom);
                  }
                } else if (molecule.formula === "NH3" || molecule.formula === "H3O+") {
                  const nitrogenAtom = getAtomById(molecule.atomIds[0]);

                  if (nitrogenAtom) {
                    layoutAmmoniaMolecule(molecule, atomMap.get(nitrogenAtom.id) ?? nitrogenAtom);
                  }
                } else if (molecule.formula === "H2CO3") {
                  const carbonAtom = getAtomById(molecule.atomIds[0]);

                  if (carbonAtom) {
                    layoutCarbonicAcidMolecule(molecule, atomMap.get(carbonAtom.id) ?? carbonAtom);
                  }
                } else if (molecule.formula === "2H2O") {
                  layoutWaterDimerCluster(
                    molecule,
                    molecule.center ?? getAtomGroupCenter(getMoleculeAtoms(molecule))
                  );
                } else {
                  syncMoleculeGeometry(molecule);
                }
              }
            }
          };

          const applyWaterHydrogenBondForces = () => {
            const { bonds } = getWaterHydrogenBondData();
            const queuedForces = new Map();

            for (const bond of bonds) {
              const donorMolecule = getMoleculeById(bond.donorMoleculeId);
              const acceptorMolecule = getMoleculeById(bond.acceptorMoleculeId);

              if (!donorMolecule?.center || !acceptorMolecule?.center) {
                continue;
              }

              const isDonorGrabbed = grabbedMoleculeIdsRef.current.has(donorMolecule.id);
              const isAcceptorGrabbed = grabbedMoleculeIdsRef.current.has(acceptorMolecule.id);

              if (isDonorGrabbed && isAcceptorGrabbed) {
                continue;
              }

              const deltaX = acceptorMolecule.center.x - donorMolecule.center.x;
              const deltaY = acceptorMolecule.center.y - donorMolecule.center.y;
              const pairDeltaX =
                bond.acceptorOxygenAtom.position.x - bond.donorHydrogenAtom.position.x;
              const pairDeltaY =
                bond.acceptorOxygenAtom.position.y - bond.donorHydrogenAtom.position.y;
              const directionX = pairDeltaX || deltaX;
              const directionY = pairDeltaY || deltaY;
              const distance = Math.hypot(directionX, directionY) || 0.0001;
              const distancePx = distance * Math.min(canvas.width, canvas.height);
              const normalizedForce =
                ((distancePx - scaledHydrogenBondTargetPx) / Math.min(canvas.width, canvas.height)) *
                0.045 *
                bond.strength;
              const forceX = (directionX / distance) * normalizedForce;
              const forceY = (directionY / distance) * normalizedForce;

              if (!isDonorGrabbed) {
                const queuedForce = queuedForces.get(donorMolecule.id) ?? { x: 0, y: 0 };
                queuedForces.set(donorMolecule.id, {
                  x: queuedForce.x + forceX,
                  y: queuedForce.y + forceY,
                });
              }

              if (!isAcceptorGrabbed) {
                const queuedForce = queuedForces.get(acceptorMolecule.id) ?? { x: 0, y: 0 };
                queuedForces.set(acceptorMolecule.id, {
                  x: queuedForce.x - forceX,
                  y: queuedForce.y - forceY,
                });
              }
            }

            for (const [moleculeId, queuedForce] of queuedForces.entries()) {
              const molecule = getMoleculeById(moleculeId);

              if (!molecule?.center) {
                continue;
              }

              moveMoleculeTo(molecule, {
                x: molecule.center.x + queuedForce.x,
                y: molecule.center.y + queuedForce.y,
              });
            }
          };

          const triggerPopupActionFromHand = (buttonRef, action, handX, handY, handState) => {
            const viewport = viewportRef.current;
            const button = buttonRef.current;

            if (!viewport || !button) {
              return false;
            }

            const viewportBounds = viewport.getBoundingClientRect();
            const buttonBounds = button.getBoundingClientRect();
            const screenX = viewportBounds.left + (1 - handX) * viewportBounds.width;
            const screenY = viewportBounds.top + handY * viewportBounds.height;

            const isInsideButton =
              screenX >= buttonBounds.left &&
              screenX <= buttonBounds.right &&
              screenY >= buttonBounds.top &&
              screenY <= buttonBounds.bottom;

            if (!isInsideButton || handState.popupPinchHandled) {
              return false;
            }

            handState.popupPinchHandled = true;
            action();
            return true;
          };

          // Fixed internal resolution (4:3, same as the viewport box) so atoms
          // stay circular and molecule geometry renders identically on every
          // device — phone cameras often deliver portrait or odd aspect
          // frames, which previously stretched the canvas and squashed
          // everything drawn on it.
          if (canvas.width !== 960 || canvas.height !== 720) {
            canvas.width = 960;
            canvas.height = 720;
          }

          if (handLandmarker && (!video.videoWidth || !video.videoHeight)) {
            animationFrameId = requestAnimationFrame(drawFrame);
            return;
          }

          let results = { landmarks: [] };

          if (handLandmarker && video.videoWidth && video.videoHeight) {
            if (video.currentTime !== lastDetectedVideoTime) {
              lastDetectedVideoTime = video.currentTime;
              lastDetectionResults = handLandmarker.detectForVideo(video, performance.now());
            }

            results = lastDetectionResults;
          }

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = "#67e8f9";
          const frameNow = performance.now();

          // Landmarks are normalized to the raw camera frame, but the video is
          // displayed with object-fit: cover inside a 4:3 box — anything the
          // crop hides must be remapped or fingers drift off their on-screen
          // position (worst on portrait phone cameras).
          const boxAspect = 4 / 3;
          const videoAspect =
            video.videoWidth && video.videoHeight
              ? video.videoWidth / video.videoHeight
              : boxAspect;
          const mapVideoPointToBox = (point) => {
            if (Math.abs(videoAspect - boxAspect) < 0.001) {
              return point;
            }

            if (videoAspect > boxAspect) {
              // Wider than the box: left/right edges are cropped.
              const visibleFraction = boxAspect / videoAspect;
              return { ...point, x: (point.x - (1 - visibleFraction) / 2) / visibleFraction };
            }

            // Taller than the box (portrait cameras): top/bottom are cropped.
            const visibleFraction = videoAspect / boxAspect;
            return { ...point, y: (point.y - (1 - visibleFraction) / 2) / visibleFraction };
          };

          const detections = results.landmarks.map((rawLandmarks) => {
            const mappedLandmarks = rawLandmarks.map(mapVideoPointToBox);

            return {
              landmarks: mappedLandmarks,
              wrist: mappedLandmarks[0] ?? { x: 0.5, y: 0.5 },
            };
          });
          const matchedHandStates = matchHandStatesToDetections(detections);

          for (const [handIndex, detection] of detections.entries()) {
            const handState = matchedHandStates[handIndex] ?? null;
            const landmarks = handState
              ? smoothHandLandmarks(handState, detection.landmarks, frameNow)
              : detection.landmarks;
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            let pinchDetected = false;

            if (thumbTip && indexTip) {
              // Measure the pinch in raw video-frame units: the crop remap
              // stretches one axis on non-4:3 cameras (portrait phones), which
              // would otherwise inflate the distance and make pinches
              // impossible to register.
              const pinchScaleX = videoAspect > boxAspect ? boxAspect / videoAspect : 1;
              const pinchScaleY = videoAspect < boxAspect ? videoAspect / boxAspect : 1;
              const dx = (thumbTip.x - indexTip.x) * pinchScaleX;
              const dy = (thumbTip.y - indexTip.y) * pinchScaleY;
              const distance = Math.hypot(dx, dy);
              const pinchStartThreshold = 0.05;
              const pinchEndThreshold = 0.07;

              if (distance < pinchStartThreshold) {
                pinchDetected = true;
              } else if (handState?.isPinching && distance <= pinchEndThreshold) {
                pinchDetected = true;
              }
            }

            if (handState) {
              handState.indexTip = pinchDetected && indexTip ? { x: indexTip.x, y: indexTip.y } : null;
            }

            if (atomicExpansionAtomRef.current && handState) {
              handState.isPinching = pinchDetected;
              resetHandInteractionState(handState);
              const expansionAtom = atomicExpansionAtomRef.current;
              const expansionDisplayState = getAtomicExpansionDisplayState(
                expansionAtom,
                canvas.width,
                canvas.height,
                getScaledAtomRadiusPx()
              );
              const expansionEntryProgress = getAtomicExpansionEntryProgress(
                expansionAtom,
                performance.now()
              );

              if (
                !pinchDetected ||
                !indexTip ||
                atomicExpansionCollapseGestureRef.current.isClosing ||
                expansionEntryProgress < 0.82
              ) {
                handState.expansionGrabOffset = null;
                continue;
              }

              const indexTipScreenX = (1 - indexTip.x) * canvas.width;
              const indexTipY = indexTip.y * canvas.height;
              const nucleusHitRadiusPx = Math.max(
                44,
                expansionDisplayState.overlayMetrics.nucleusDragRadiusPx *
                  expansionDisplayState.particleScale
              );

              if (handState.expansionGrabOffset === null) {
                const distanceToNucleus = Math.hypot(
                  indexTipScreenX - expansionDisplayState.modelCenterX,
                  indexTipY - expansionDisplayState.modelCenterY
                );

                if (distanceToNucleus <= nucleusHitRadiusPx) {
                  expansionAtom.openedAt = null;
                  expansionAtom.originPosition = { ...expansionAtom.modelPosition };
                  handState.expansionGrabOffset = {
                    x: 1 - indexTip.x - expansionAtom.modelPosition.x,
                    y: indexTip.y - expansionAtom.modelPosition.y,
                  };
                }
              }

              if (handState.expansionGrabOffset !== null) {
                const halfWidth = expansionDisplayState.modelSizePx / (2 * canvas.width);
                const halfHeight = expansionDisplayState.modelSizePx / (2 * canvas.height);

                expansionAtom.modelPosition = {
                  x: Math.min(
                    1 - halfWidth,
                    Math.max(halfWidth, 1 - indexTip.x - handState.expansionGrabOffset.x)
                  ),
                  y: Math.min(
                    1 - halfHeight,
                    Math.max(halfHeight, indexTip.y - handState.expansionGrabOffset.y)
                  ),
                };
              }

              continue;
            }

            if (!deleteModeRef.current && handState) {
              if (!pinchDetected) {
                handState.popupPinchHandled = false;
              }

              if (moleculePromptRef.current && pinchDetected && indexTip) {
                const yesTriggered = triggerPopupActionFromHand(
                  yesButtonRef,
                  () => confirmMoleculeFormation(moleculePromptRef.current),
                  indexTip.x,
                  indexTip.y,
                  handState
                );

                if (!yesTriggered) {
                  triggerPopupActionFromHand(
                    noButtonRef,
                    () => declineMoleculeFormation(moleculePromptRef.current),
                    indexTip.x,
                    indexTip.y,
                    handState
                  );
                }
              }

              if (pinchDetected && indexTip) {
                handState.isPinching = true;

                if (bondingModeRef.current) {
                  if (handState.bondStartAtomId === null) {
                    const bondStartAtomIndex = atomsRef.current.findIndex(({ position }) => {
                      const atomScreenX = position.x * canvas.width;
                      const atomScreenY = position.y * canvas.height;
                      return (
                        Math.hypot(
                          indexTip.x * canvas.width - atomScreenX,
                          indexTip.y * canvas.height - atomScreenY
                        ) <= atomGrabRadius
                      );
                    });

                    if (bondStartAtomIndex >= 0) {
                      handState.bondStartAtomId = atomsRef.current[bondStartAtomIndex].id;
                    }
                  }

                  if (handState.bondStartAtomId !== null) {
                    tempBondStateRef.current[handState.key] = {
                      startAtomId: handState.bondStartAtomId,
                      currentPosition: {
                        x: indexTip.x * canvas.width,
                        y: indexTip.y * canvas.height,
                      },
                    };
                  }
                } else {
                  const indexTipX = indexTip.x * canvas.width;
                  const indexTipY = indexTip.y * canvas.height;
                  const otherHandStates = matchedHandStates.filter(
                    (otherHandState) => otherHandState && otherHandState !== handState
                  );
                  const otherGrabbedAtomIndexes = new Set(
                    otherHandStates
                      .map((otherHandState) => otherHandState.grabbedAtomIndex)
                      .filter((atomIndex) => atomIndex !== null)
                  );
                  const occupiedMoleculeIds = new Set(
                    otherHandStates.flatMap((otherHandState) => {
                      const otherGrabbedMoleculeId = otherHandState.grabbedMoleculeId;

                      if (otherGrabbedMoleculeId === null) {
                        return [];
                      }

                      const otherGrabbedMolecule = getMoleculeById(otherGrabbedMoleculeId);

                      return isWaterClusterMolecule(otherGrabbedMolecule)
                        ? [otherGrabbedMoleculeId, ...(otherGrabbedMolecule.memberMoleculeIds ?? [])]
                        : [
                            otherGrabbedMoleculeId,
                            ...(
                              getClusterForMemberMoleculeId(otherGrabbedMoleculeId)
                                ?.memberMoleculeIds ?? []
                            ),
                          ];
                    })
                  );

                  if (pointerDragRef.current?.kind === "molecule") {
                    occupiedMoleculeIds.add(pointerDragRef.current.moleculeId);
                    const pointerCluster = getClusterForMemberMoleculeId(
                      pointerDragRef.current.moleculeId
                    );
                    for (const memberMoleculeId of pointerCluster?.memberMoleculeIds ?? []) {
                      occupiedMoleculeIds.add(memberMoleculeId);
                    }
                  }

                  if (handState.grabbedAtomIndex === null && handState.grabbedMoleculeId === null) {
                    const grabbedMolecule = findMoleculeAtCanvasPoint(
                      indexTipX,
                      indexTipY,
                      occupiedMoleculeIds
                    );

                    if (grabbedMolecule) {
                      syncMoleculeGeometry(grabbedMolecule);
                      handState.grabbedMoleculeId = grabbedMolecule.id;
                      handState.moleculeGrabOffset = {
                        x: indexTip.x - grabbedMolecule.center.x,
                        y: indexTip.y - grabbedMolecule.center.y,
                      };
                      handState.lastRippleAt = performance.now();
                      spawnGrabRipple(
                        grabbedMolecule.center,
                        getMoleculeMixedNeonRgb(grabbedMolecule)
                      );
                    }
                  }

                  if (handState.grabbedAtomIndex === null && handState.grabbedMoleculeId === null) {
                    const looseAtomSharedGrabIndex = atomsRef.current.findIndex(
                      ({ position, moleculeId }, atomIndex) => {
                        if (!otherGrabbedAtomIndexes.has(atomIndex) || moleculeId !== null) {
                          return false;
                        }

                        const atomScreenX = position.x * canvas.width;
                        const atomScreenY = position.y * canvas.height;
                        const distanceToAtom = Math.hypot(
                          indexTipX - atomScreenX,
                          indexTipY - atomScreenY
                        );

                        return distanceToAtom <= atomGrabRadius;
                      }
                    );

                    handState.grabbedAtomIndex =
                      looseAtomSharedGrabIndex >= 0
                        ? looseAtomSharedGrabIndex
                        : atomsRef.current.findIndex(({ position, moleculeId }, atomIndex) => {
                            if (otherGrabbedAtomIndexes.has(atomIndex)) {
                              return false;
                            }

                            if (moleculeId !== null && occupiedMoleculeIds.has(moleculeId)) {
                              return false;
                            }

                            const atomScreenX = position.x * canvas.width;
                            const atomScreenY = position.y * canvas.height;
                            const distanceToAtom = Math.hypot(
                              indexTipX - atomScreenX,
                              indexTipY - atomScreenY
                            );

                            return distanceToAtom <= atomGrabRadius;
                          });

                    if (handState.grabbedAtomIndex < 0) {
                      handState.grabbedAtomIndex = null;
                    } else {
                      const grabbedAtom = atomsRef.current[handState.grabbedAtomIndex];

                      if (grabbedAtom) {
                        handState.lastRippleAt = performance.now();
                        spawnGrabRipple(grabbedAtom.position, getAtomNeonRgb(grabbedAtom.type));
                      }
                    }
                  }

                  if (handState.grabbedMoleculeId !== null) {
                    const grabbedMolecule = moleculesRef.current.find(
                      (molecule) => molecule.id === handState.grabbedMoleculeId
                    );

                    if (grabbedMolecule) {
                      const grabTargetX = indexTip.x - (handState.moleculeGrabOffset?.x ?? 0);
                      const grabTargetY = indexTip.y - (handState.moleculeGrabOffset?.y ?? 0);
                      const currentCenter = grabbedMolecule.center ?? {
                        x: grabTargetX,
                        y: grabTargetY,
                      };

                      moveMoleculeTo(grabbedMolecule, {
                        x: lerp(currentCenter.x, grabTargetX, HAND_GRAB_FOLLOW),
                        y: lerp(currentCenter.y, grabTargetY, HAND_GRAB_FOLLOW),
                      });

                      if (performance.now() - handState.lastRippleAt >= GRAB_RIPPLE_REPEAT_MS) {
                        handState.lastRippleAt = performance.now();
                        spawnGrabRipple(
                          grabbedMolecule.center,
                          getMoleculeMixedNeonRgb(grabbedMolecule),
                          { soft: true }
                        );
                      }
                    } else {
                      handState.grabbedMoleculeId = null;
                      handState.moleculeGrabOffset = null;
                    }
                  } else if (handState.grabbedAtomIndex !== null) {
                    const grabbedAtom = atomsRef.current[handState.grabbedAtomIndex];
                    const isSharedLooseAtomGrab =
                      grabbedAtom?.moleculeId === null &&
                      otherHandStates.some(
                        (otherHandState) =>
                          otherHandState.grabbedAtomIndex === handState.grabbedAtomIndex
                      );

                    if (grabbedAtom?.moleculeId === null && !isSharedLooseAtomGrab) {
                      atomsRef.current[handState.grabbedAtomIndex] = {
                        ...grabbedAtom,
                        position: clampPosition({
                          x: lerp(grabbedAtom.position.x, indexTip.x, HAND_GRAB_FOLLOW),
                          y: lerp(grabbedAtom.position.y, indexTip.y, HAND_GRAB_FOLLOW),
                        }),
                      };

                      if (performance.now() - handState.lastRippleAt >= GRAB_RIPPLE_REPEAT_MS) {
                        handState.lastRippleAt = performance.now();
                        spawnGrabRipple(
                          atomsRef.current[handState.grabbedAtomIndex].position,
                          getAtomNeonRgb(grabbedAtom.type),
                          { soft: true }
                        );
                      }
                    }
                  }
                }
              } else {
                if (bondingModeRef.current && handState.bondStartAtomId !== null) {
                  const releasePoint = tempBondStateRef.current[handState.key]?.currentPosition;

                  if (releasePoint) {
                    finalizeBondAtCanvasPoint(
                      handState.bondStartAtomId,
                      releasePoint.x,
                      releasePoint.y
                    );
                  }

                  tempBondStateRef.current[handState.key] = null;
                  handState.bondStartAtomId = null;
                }

                handState.isPinching = false;
                handState.grabbedAtomIndex = null;
                handState.grabbedMoleculeId = null;
                handState.moleculeGrabOffset = null;
              }
            }

            for (const landmark of landmarks) {
              context.beginPath();
              context.arc(
                landmark.x * canvas.width,
                landmark.y * canvas.height,
                4,
                0,
                Math.PI * 2
              );
              context.fill();
            }
          }

          const pinchingHands = handStatesList.filter(
            (handState) => handState.isPinching && handState.indexTip
          );
          let sharedLooseAtom = null;
          let sharedGrabHandPair = null;

          if (
            !deleteModeRef.current &&
            !bondingModeRef.current &&
            !moleculePromptRef.current
          ) {
            outer: for (let leftIndex = 0; leftIndex < pinchingHands.length; leftIndex += 1) {
              for (
                let rightIndex = leftIndex + 1;
                rightIndex < pinchingHands.length;
                rightIndex += 1
              ) {
                const firstHand = pinchingHands[leftIndex];
                const secondHand = pinchingHands[rightIndex];

                if (
                  firstHand.grabbedAtomIndex === null ||
                  firstHand.grabbedAtomIndex !== secondHand.grabbedAtomIndex
                ) {
                  continue;
                }

                const candidateAtom = atomsRef.current[firstHand.grabbedAtomIndex];

                if (candidateAtom && candidateAtom.moleculeId === null) {
                  sharedLooseAtom = candidateAtom;
                  sharedGrabHandPair = [firstHand, secondHand];
                  break outer;
                }
              }
            }
          }

          if (atomicExpansionAtomRef.current) {
            const leftPinchPoint = pinchingHands[0]?.indexTip ?? null;
            const rightPinchPoint = pinchingHands[1]?.indexTip ?? null;
            const collapseGesture = atomicExpansionCollapseGestureRef.current;
            const expansionEntryProgress = getAtomicExpansionEntryProgress(
              atomicExpansionAtomRef.current,
              performance.now()
            );
            const expansionReadyForCollapse = expansionEntryProgress >= 0.82;

            if (
              leftPinchPoint &&
              rightPinchPoint &&
              !collapseGesture.isClosing &&
              expansionReadyForCollapse
            ) {
              const expansionAtomId = atomicExpansionAtomRef.current.id;
              const expansionDisplayState = getAtomicExpansionDisplayState(
                atomicExpansionAtomRef.current,
                canvas.width,
                canvas.height,
                getScaledAtomRadiusPx()
              );
              const shellCenter = {
                x: expansionDisplayState.modelCenterX,
                y: expansionDisplayState.modelCenterY,
              };
              const shellRadius =
                expansionDisplayState.overlayMetrics.shellRadiusPx *
                expansionDisplayState.particleScale *
                atomicExpansionCollapseGestureRef.current.shellScale;
              const shellTolerance =
                expansionDisplayState.overlayMetrics.shellGrabTolerancePx *
                expansionDisplayState.particleScale;
              const leftPinchX = (1 - leftPinchPoint.x) * canvas.width;
              const leftPinchY = leftPinchPoint.y * canvas.height;
              const rightPinchX = (1 - rightPinchPoint.x) * canvas.width;
              const rightPinchY = rightPinchPoint.y * canvas.height;
              const toLeft = {
                x: leftPinchX - shellCenter.x,
                y: leftPinchY - shellCenter.y,
              };
              const toRight = {
                x: rightPinchX - shellCenter.x,
                y: rightPinchY - shellCenter.y,
              };
              const leftRadius = Math.hypot(toLeft.x, toLeft.y);
              const rightRadius = Math.hypot(toRight.x, toRight.y);
              const leftNearShell = Math.abs(leftRadius - shellRadius) <= shellTolerance;
              const rightNearShell = Math.abs(rightRadius - shellRadius) <= shellTolerance;
              const leftMagnitude = Math.max(leftRadius, 0.0001);
              const rightMagnitude = Math.max(rightRadius, 0.0001);
              const oppositeAlignment =
                ((toLeft.x / leftMagnitude) * (toRight.x / rightMagnitude) +
                  (toLeft.y / leftMagnitude) * (toRight.y / rightMagnitude)) <= -0.55;
              const fingertipDistancePx = Math.hypot(
                leftPinchX - rightPinchX,
                leftPinchY - rightPinchY
              );

              if (
                collapseGesture.atomId !== expansionAtomId ||
                !collapseGesture.shellGripActive ||
                !leftNearShell ||
                !rightNearShell ||
                !oppositeAlignment
              ) {
                atomicExpansionCollapseGestureRef.current = {
                  atomId: expansionAtomId,
                  startDistancePx: fingertipDistancePx,
                  currentDistancePx: fingertipDistancePx,
                  shellGripActive: leftNearShell && rightNearShell && oppositeAlignment,
                  shellScale: 1,
                  isClosing: false,
                };
              } else {
                const inwardDeltaPx = collapseGesture.startDistancePx - fingertipDistancePx;
                const progress = Math.max(
                  0,
                  Math.min(1, inwardDeltaPx / ATOMIC_EXPANSION_COLLAPSE_TRIGGER_DELTA_PX)
                );

                atomicExpansionCollapseGestureRef.current = {
                  ...collapseGesture,
                  currentDistancePx: fingertipDistancePx,
                  shellGripActive: true,
                  shellScale: 1 - progress * 0.1,
                };

                if (inwardDeltaPx >= ATOMIC_EXPANSION_COLLAPSE_TRIGGER_DELTA_PX) {
                  beginAtomicExpansionCollapse();
                }
              }
            } else if (!collapseGesture.isClosing) {
              atomicExpansionCollapseGestureRef.current = {
                ...collapseGesture,
                startDistancePx: 0,
                currentDistancePx: 0,
                shellGripActive: false,
                shellScale: 1,
              };
            }
          } else if (sharedLooseAtom && sharedGrabHandPair) {
            const [firstHand, secondHand] = sharedGrabHandPair;
            const fingertipDistancePx = Math.hypot(
              (firstHand.indexTip.x - secondHand.indexTip.x) * canvas.width,
              (firstHand.indexTip.y - secondHand.indexTip.y) * canvas.height
            );
            const gesture = atomicExpansionGestureRef.current;

            if (gesture.atomId !== sharedLooseAtom.id) {
              atomicExpansionGestureRef.current = {
                atomId: sharedLooseAtom.id,
                startDistancePx: fingertipDistancePx,
              };
            } else {
              gesture.startDistancePx = Math.min(gesture.startDistancePx, fingertipDistancePx);

              if (fingertipDistancePx - gesture.startDistancePx >= ATOMIC_EXPANSION_TRIGGER_DELTA_PX) {
                setAtomicExpansionAtomState({
                  id: sharedLooseAtom.id,
                  type: sharedLooseAtom.type,
                  originPosition: { ...sharedLooseAtom.position },
                  openedAt: performance.now(),
                });
                resetAtomicExpansionGesture();
                resetAtomicExpansionCollapseGesture();

                for (const handState of handStatesList) {
                  clearHandState(handState);
                }
              }
            }
          } else {
            resetAtomicExpansionGesture();
            resetAtomicExpansionCollapseGesture();
          }

          if (deleteModeRef.current) {
            for (const handState of handStatesList) {
              clearHandState(handState);
            }

            pointerDragRef.current = null;
            resetAtomicExpansionGesture();
          }

          // Apply touch/mouse drag (processed in the same loop so it behaves like a hand grab).
          const pointerDrag = pointerDragRef.current;

          if (
            pointerDrag &&
            !deleteModeRef.current &&
            !bondingModeRef.current &&
            !atomicExpansionAtomRef.current
          ) {
            if (pointerDrag.kind === "molecule") {
              const draggedMolecule = getMoleculeById(pointerDrag.moleculeId);

              if (draggedMolecule) {
                moveMoleculeTo(draggedMolecule, {
                  x: pointerDrag.position.x - (pointerDrag.grabOffset?.x ?? 0),
                  y: pointerDrag.position.y - (pointerDrag.grabOffset?.y ?? 0),
                });

                if (performance.now() - pointerDrag.lastRippleAt >= GRAB_RIPPLE_REPEAT_MS) {
                  pointerDrag.lastRippleAt = performance.now();
                  spawnGrabRipple(
                    draggedMolecule.center,
                    getMoleculeMixedNeonRgb(draggedMolecule),
                    { soft: true }
                  );
                }
              } else {
                pointerDragRef.current = null;
              }
            } else {
              const draggedAtomIndex = atomsRef.current.findIndex(
                (atom) => atom.id === pointerDrag.atomId
              );
              const draggedAtom = draggedAtomIndex >= 0 ? atomsRef.current[draggedAtomIndex] : null;

              if (draggedAtom && draggedAtom.moleculeId === null) {
                atomsRef.current[draggedAtomIndex] = {
                  ...draggedAtom,
                  position: clampPosition(pointerDrag.position),
                };

                if (performance.now() - pointerDrag.lastRippleAt >= GRAB_RIPPLE_REPEAT_MS) {
                  pointerDrag.lastRippleAt = performance.now();
                  spawnGrabRipple(
                    atomsRef.current[draggedAtomIndex].position,
                    getAtomNeonRgb(draggedAtom.type),
                    { soft: true }
                  );
                }
              } else {
                pointerDragRef.current = null;
              }
            }
          }

          grabbedMoleculeIdsRef.current = new Set(
            [
              ...handStatesList,
              ...(pointerDragRef.current?.kind === "molecule"
                ? [{ grabbedMoleculeId: pointerDragRef.current.moleculeId }]
                : []),
            ].flatMap((handState) => {
              if (handState.grabbedMoleculeId === null) {
                return [];
              }

              const grabbedMolecule = getMoleculeById(handState.grabbedMoleculeId);

              if (!isWaterClusterMolecule(grabbedMolecule)) {
                return [handState.grabbedMoleculeId];
              }

              return [handState.grabbedMoleculeId, ...(grabbedMolecule.memberMoleculeIds ?? [])];
            })
          );

          const grabbedAtomIdSet = new Set();

          for (const handState of handStatesList) {
            if (handState.grabbedAtomIndex !== null) {
              const grabbedAtom = atomsRef.current[handState.grabbedAtomIndex];

              if (grabbedAtom) {
                grabbedAtomIdSet.add(grabbedAtom.id);
              }
            }
          }

          if (pointerDragRef.current?.kind === "atom") {
            grabbedAtomIdSet.add(pointerDragRef.current.atomId);
          }

          // --- Thermal physics -------------------------------------------
          const physicsNow = performance.now();
          const physicsDtSeconds =
            lastPhysicsTickAt === 0
              ? 1 / 60
              : Math.min(0.1, (physicsNow - lastPhysicsTickAt) / 1000);
          lastPhysicsTickAt = physicsNow;

          // Above ~boiling, explicit hydrogen-bond records break apart.
          if (getHydrogenBondTemperatureFactor() <= 0.05) {
            if (bondsRef.current.some((bond) => getBondCategory(bond) === "hydrogenBond")) {
              bondsRef.current = bondsRef.current.filter(
                (bond) => getBondCategory(bond) !== "hydrogenBond"
              );
            }
          }

          // Brownian jitter: everything loose trembles more as the lab heats.
          const thermalTemperature = temperatureRef.current;

          if (thermalTemperature > 0) {
            const jitterAmplitude =
              Math.min(1, thermalTemperature / 300) * 0.0028 * physicsDtSeconds * 60;

            for (const molecule of moleculesRef.current) {
              if (
                molecule.snapStartedAt ||
                !molecule.center ||
                grabbedMoleculeIdsRef.current.has(molecule.id) ||
                (!isWaterClusterMolecule(molecule) && getClusterForMemberMoleculeId(molecule.id))
              ) {
                continue;
              }

              moveMoleculeTo(molecule, {
                x: molecule.center.x + (Math.random() - 0.5) * jitterAmplitude * 2,
                y: molecule.center.y + (Math.random() - 0.5) * jitterAmplitude * 2,
              });
            }

            atomsRef.current = atomsRef.current.map((atom) => {
              if (atom.moleculeId !== null || grabbedAtomIdSet.has(atom.id)) {
                return atom;
              }

              return {
                ...atom,
                position: clampPosition({
                  x: atom.position.x + (Math.random() - 0.5) * jitterAmplitude * 2,
                  y: atom.position.y + (Math.random() - 0.5) * jitterAmplitude * 2,
                }),
              };
            });
          }

          // Equilibrium: unstable molecules decompose probabilistically,
          // faster when the lab is hot.
          for (const rule of DECOMPOSITION_RULES) {
            if (
              rule.minTemperature !== undefined &&
              temperatureRef.current < rule.minTemperature
            ) {
              continue;
            }

            const rateMultiplier = clampValue(
              1 + (temperatureRef.current - 25) / 40,
              0.15,
              12
            );
            const decomposeProbability =
              1 - Math.pow(2, -physicsDtSeconds / (rule.baseHalfLifeS / rateMultiplier));

            for (const molecule of [...moleculesRef.current]) {
              if (
                molecule.formula !== rule.formula ||
                molecule.snapStartedAt ||
                grabbedMoleculeIdsRef.current.has(molecule.id) ||
                moleculePromptRef.current?.sourceMoleculeIds?.includes(molecule.id)
              ) {
                continue;
              }

              if (Math.random() < decomposeProbability) {
                decomposeMoleculeIntoProducts(molecule, rule);
              }
            }
          }

          syncPendingMoleculePrompt();
          tryFormWaterMolecules();
          tryFormHydrogenMolecules();
          tryFormCarbonMonoxideMolecules();
          tryFormOxygenMolecules();
          tryFormNitrogenMolecules();
          tryFormCarbonDioxideMolecules();
          tryFormAmmoniaMolecules();
          tryFormMethaneMolecules();
          tryFormHydroniumMolecules();
          tryFormAmmoniumMolecules();
          tryFormSodiumChlorideMolecules();
          tryFormGenericMolecules();
          tryTriggerCarbonicAcidReaction();
          tryTriggerGenericReactions();
          tryFormWaterCluster();
          animateMolecules();
          applyWaterHydrogenBondForces();
          const waterHydrogenBondData = getWaterHydrogenBondData();

          const atomAnimationScales = new Map();
          context.save();
          context.strokeStyle = "rgba(241, 245, 249, 0.72)";
          context.lineWidth = 2.25 * getVisualScale();
          context.lineCap = "round";
          context.shadowColor = "rgba(255, 255, 255, 0.2)";
          context.shadowBlur = 6;
          context.setLineDash([]);

          for (const bond of bondsRef.current) {
            if (getBondCategory(bond) !== "covalent") {
              continue;
            }

            const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
            const leftAtom = getAtomById(leftAtomId);
            const rightAtom = getAtomById(rightAtomId);

            if (!leftAtom || !rightAtom) {
              continue;
            }

            if (
              leftAtom.moleculeId !== null &&
              leftAtom.moleculeId === rightAtom.moleculeId
            ) {
              continue;
            }

            drawBondOrderStick(
              leftAtom.position,
              rightAtom.position,
              getCovalentBondOrder(bond),
              0.84,
              [leftAtom.type, rightAtom.type]
            );
          }

          context.restore();

          context.save();
          context.strokeStyle = HYDROGEN_BOND_NEON_PINK;
          context.lineWidth = 1.5 * getVisualScale();
          context.lineCap = "round";
          context.shadowColor = HYDROGEN_BOND_GLOW;
          context.shadowBlur = 8;
          context.setLineDash([5, 7]);

          for (const bond of bondsRef.current) {
            if (getBondCategory(bond) !== "hydrogenBond") {
              continue;
            }

            const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
            const leftAtom = getAtomById(leftAtomId);
            const rightAtom = getAtomById(rightAtomId);

            if (!leftAtom || !rightAtom) {
              continue;
            }

            drawBondStick(leftAtom.position, rightAtom.position, 0.68);
          }

          context.restore();

          context.save();
          context.strokeStyle = "rgba(248, 250, 252, 0.82)";
          context.lineWidth = 2.5 * getVisualScale();
          context.lineCap = "round";
          context.shadowColor = "rgba(255, 255, 255, 0.26)";
          context.shadowBlur = 8;

          for (const molecule of moleculesRef.current) {
            drawMoleculeBondSticks(molecule);
          }

          context.restore();

          context.save();
          context.strokeStyle = HYDROGEN_BOND_NEON_PINK;
          context.lineWidth = 2 * getVisualScale();
          context.lineCap = "round";
          context.shadowColor = HYDROGEN_BOND_GLOW;
          context.shadowBlur = 8;
          context.setLineDash([6, 8]);

          for (const hydrogenBond of waterHydrogenBondData.bonds) {
            if (!hydrogenBond.donorHydrogenAtom || !hydrogenBond.acceptorOxygenAtom) {
              continue;
            }

            context.globalAlpha = 0.32 + hydrogenBond.strength * 0.42;
            drawBondStick(
              hydrogenBond.donorHydrogenAtom.position,
              hydrogenBond.acceptorOxygenAtom.position,
              0.48
            );
          }

          context.restore();

          context.save();
          context.strokeStyle = "rgba(125, 211, 252, 0.9)";
          context.fillStyle = "rgba(125, 211, 252, 0.9)";
          context.lineWidth = 3 * getVisualScale();
          context.lineCap = "round";

          for (const tempBond of Object.values(tempBondStateRef.current)) {
            if (!tempBond?.currentPosition) {
              continue;
            }

            const startAtom = getAtomById(tempBond.startAtomId);

            if (!startAtom) {
              continue;
            }

            const startX = startAtom.position.x * canvas.width;
            const startY = startAtom.position.y * canvas.height;
            const endX = tempBond.currentPosition.x;
            const endY = tempBond.currentPosition.y;
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowSize = 10;

            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.stroke();

            context.beginPath();
            context.moveTo(endX, endY);
            context.lineTo(
              endX - Math.cos(angle - Math.PI / 6) * arrowSize,
              endY - Math.sin(angle - Math.PI / 6) * arrowSize
            );
            context.lineTo(
              endX - Math.cos(angle + Math.PI / 6) * arrowSize,
              endY - Math.sin(angle + Math.PI / 6) * arrowSize
            );
            context.closePath();
            context.fill();
          }

          context.restore();

          for (const molecule of [...moleculesRef.current]) {
            const moleculeAtoms = molecule.atomIds
              .map((atomId) => getAtomById(atomId))
              .filter(Boolean);

            if (
              molecule.formula === "CO" &&
              (
                moleculeAtoms.length !== 2 ||
                moleculeAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 1
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "H2" &&
              (
                moleculeAtoms.length !== 2 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "O2" &&
              (
                moleculeAtoms.length !== 2 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "N2" &&
              (
                moleculeAtoms.length !== 2 ||
                moleculeAtoms.filter((atom) => atom.type === "N").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "H2O" &&
              (
                moleculeAtoms.length !== 3 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "CO2" &&
              (
                moleculeAtoms.length !== 3 ||
                moleculeAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "CH4" &&
              (
                moleculeAtoms.length !== 5 ||
                moleculeAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 4
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "NH3" &&
              (
                moleculeAtoms.length !== 4 ||
                moleculeAtoms.filter((atom) => atom.type === "N").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 3
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "H3O+" &&
              (
                moleculeAtoms.length !== 4 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 3
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "NH4+" &&
              (
                moleculeAtoms.length !== 5 ||
                moleculeAtoms.filter((atom) => atom.type === "N").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 4
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "NaCl" &&
              (
                moleculeAtoms.length !== 2 ||
                moleculeAtoms.filter((atom) => atom.type === "Na").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "Cl").length !== 1
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            const genericMoleculeTemplate = getGenericTemplateForMolecule(molecule);

            if (
              genericMoleculeTemplate &&
              !compositionMatchesTemplate(
                genericMoleculeTemplate,
                getComponentComposition(moleculeAtoms)
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (
              molecule.formula === "H2CO3" &&
              (
                moleculeAtoms.length !== 6 ||
                moleculeAtoms.filter((atom) => atom.type === "C").length !== 1 ||
                moleculeAtoms.filter((atom) => atom.type === "O").length !== 3 ||
                moleculeAtoms.filter((atom) => atom.type === "H").length !== 2
              )
            ) {
              releaseMolecule(molecule.id);
              continue;
            }

            if (molecule.formula === "2H2O") {
              const memberMolecules = (molecule.memberMoleculeIds ?? [])
                .map((moleculeId) => getMoleculeById(moleculeId))
                .filter(Boolean);
              const hasHydrogenBond = Boolean(
                getWaterClusterHydrogenBond(molecule.memberMoleculeIds ?? [])
              );

              if (
                memberMolecules.length !== 2 ||
                memberMolecules.some((memberMolecule) => memberMolecule.formula !== "H2O") ||
                !hasHydrogenBond
              ) {
                releaseMolecule(molecule.id);
                continue;
              }
            }

            if (
              !genericMoleculeTemplate &&
              molecule.formula !== "H2" &&
              molecule.formula !== "O2" &&
              molecule.formula !== "N2" &&
              molecule.formula !== "H2O" &&
              molecule.formula !== "CO2" &&
              molecule.formula !== "CH4" &&
              molecule.formula !== "NH3" &&
              molecule.formula !== "H2CO3" &&
              molecule.formula !== "2H2O" &&
              molecule.formula !== "H3O+" &&
              molecule.formula !== "NH4+" &&
              molecule.formula !== "NaCl"
            ) {
              continue;
            }

            syncMoleculeGeometry(molecule);

            if (molecule.snapStartedAt) {
              const snapProgress = Math.min(
                1,
                (performance.now() - molecule.snapStartedAt) / molecule.snapDuration
              );
              const pulse = Math.sin(snapProgress * Math.PI) * 0.22;

              for (const atomId of molecule.atomIds) {
                atomAnimationScales.set(atomId, 1 + pulse);
              }
            }

            const labelX = molecule.center.x * canvas.width;
            const labelY = getMoleculeLabelTopY(molecule, moleculeAtoms);

            if (molecule.formula === "H2O" && getClusterForMemberMoleculeId(molecule.id)) {
              continue;
            }

            context.save();
            context.translate(labelX, labelY);
            context.scale(-1, 1);
            if ((molecule.charge ?? 0) !== 0) {
              const chargeRgb = molecule.charge > 0 ? POSITIVE_CHARGE_RGB : NEGATIVE_CHARGE_RGB;
              context.fillStyle = rgbToCss(chargeRgb, 0.95);
              context.shadowColor = rgbToCss(chargeRgb, 0.65);
              context.shadowBlur = 7;
            } else if (molecule.formula === "H2O" || molecule.formula === "2H2O") {
              const waterLabelGradient = context.createLinearGradient(-34, -10, 34, 10);
              waterLabelGradient.addColorStop(0, "rgba(190, 245, 255, 0.78)");
              waterLabelGradient.addColorStop(0.5, "rgba(127, 231, 255, 0.9)");
              waterLabelGradient.addColorStop(1, "rgba(77, 196, 255, 0.82)");
              context.fillStyle = waterLabelGradient;
              context.shadowColor = "rgba(0, 200, 255, 0.6)";
              context.shadowBlur = 6;
            } else {
              context.fillStyle = "rgba(255, 255, 255, 0.92)";
            }
            context.font = "600 14px system-ui";
            context.textAlign = "center";
            context.textBaseline = "middle";
            if (!(molecule.formula === "H2O" && molecule.visualMode === "waterDroplet")) {
              context.fillText(molecule.displayLabel, 0, 0);
            }
            context.restore();
          }

          for (const [atomIndex, { type, position }] of atomsRef.current.entries()) {
            const atom = atomsRef.current[atomIndex];
            const atomId = atom.id;
            const parentMolecule =
              atom.moleculeId !== null
                ? moleculesRef.current.find((molecule) => molecule.id === atom.moleculeId)
                : null;

            if (parentMolecule?.formula === "H2O" && parentMolecule.visualMode === "waterDroplet") {
              continue;
            }

            const atomStyle = atomStyles[type] ?? atomStyles.C;
            const atomX = position.x * canvas.width;
            const atomY = position.y * canvas.height;
            const isSelected = selectedAtomIndexRef.current === atomIndex;
            const isGrabbed =
              grabbedAtomIdSet.has(atomId) ||
              (atom.moleculeId !== null && grabbedMoleculeIdsRef.current.has(atom.moleculeId));
            const isForming = atomAnimationScales.has(atomId);
            const atomScale = (atomAnimationScales.get(atomId) ?? 1) * (isGrabbed ? 1.06 : 1);
            const drawRadius = atomRadius * atomScale;
            const neonRgb = getAtomNeonRgb(type);
            // Charged species tint their atoms: amber for cations, cyan for anions.
            // NaCl is neutral overall but ionic, so each ion gets its own tint.
            const moleculeCharge = parentMolecule?.charge ?? 0;
            const parentTemplate = getGenericTemplateForMolecule(parentMolecule);
            const parentRoleIndex =
              parentMolecule && parentTemplate ? parentMolecule.atomIds.indexOf(atomId) : -1;
            const perAtomIonCharge =
              parentMolecule?.formula === "NaCl"
                ? type === "Na"
                  ? 1
                  : type === "Cl"
                    ? -1
                    : 0
                : parentTemplate?.ionCharges?.[parentRoleIndex] ?? 0;
            const chargeValue = moleculeCharge !== 0 ? moleculeCharge : perAtomIonCharge;
            const auraRgb =
              chargeValue > 0
                ? POSITIVE_CHARGE_RGB
                : chargeValue < 0
                  ? NEGATIVE_CHARGE_RGB
                  : neonRgb;

            if (lewisViewRef.current) {
              // Lewis mode: flat "paper" atom — dark disk with a colored
              // outline, oversized symbol, dots carry the bonding info.
              context.beginPath();
              context.arc(atomX, atomY, drawRadius, 0, Math.PI * 2);
              context.fillStyle = "rgba(8, 16, 30, 0.85)";
              context.fill();
              context.strokeStyle = rgbToCss(auraRgb, isGrabbed ? 0.9 : 0.55);
              context.lineWidth = 1.8 * getVisualScale();
              context.stroke();
            } else {
              // Soft neon aura behind every atom; brighter while grabbed or forming.
              const auraStrength =
                isForming ? 0.5 : isGrabbed ? 0.4 : chargeValue !== 0 ? 0.3 : 0.16;
              const auraRadius = drawRadius * (isGrabbed || isForming ? 1.9 : 1.55);
              const auraGradient = context.createRadialGradient(
                atomX,
                atomY,
                drawRadius * 0.55,
                atomX,
                atomY,
                auraRadius
              );
              auraGradient.addColorStop(0, rgbToCss(auraRgb, auraStrength));
              auraGradient.addColorStop(1, rgbToCss(auraRgb, 0));

              context.beginPath();
              context.arc(atomX, atomY, auraRadius, 0, Math.PI * 2);
              context.fillStyle = auraGradient;
              context.fill();

              const atomGradient = context.createRadialGradient(
                atomX - drawRadius * 0.42,
                atomY - drawRadius * 0.42,
                drawRadius * 0.12,
                atomX + drawRadius * 0.24,
                atomY + drawRadius * 0.24,
                drawRadius * 1.12
              );
              atomGradient.addColorStop(0, atomStyle.highlight);
              atomGradient.addColorStop(0.4, atomStyle.mid);
              atomGradient.addColorStop(0.72, atomStyle.base);
              atomGradient.addColorStop(1, atomStyle.edge);

              context.save();

              if (isGrabbed || isForming) {
                context.shadowColor = rgbToCss(auraRgb, 0.75);
                context.shadowBlur = 22 * getVisualScale();
              }

              context.beginPath();
              context.arc(atomX, atomY, drawRadius, 0, Math.PI * 2);
              context.fillStyle = atomGradient;
              context.fill();
              context.restore();

              const shadeGradient = context.createRadialGradient(
                atomX + drawRadius * 0.16,
                atomY + drawRadius * 0.18,
                drawRadius * 0.18,
                atomX + drawRadius * 0.52,
                atomY + drawRadius * 0.56,
                drawRadius * 1.02
              );
              shadeGradient.addColorStop(0, "rgba(120, 0, 0, 0)");
              shadeGradient.addColorStop(0.55, "rgba(120, 0, 0, 0.08)");
              shadeGradient.addColorStop(1, "rgba(40, 0, 0, 0.24)");

              context.beginPath();
              context.arc(atomX, atomY, drawRadius, 0, Math.PI * 2);
              context.fillStyle = shadeGradient;
              context.fill();

              // Colored edge ring + top-left rim light + crisp specular highlight.
              context.save();
              context.beginPath();
              context.arc(atomX, atomY, drawRadius - 0.6, 0, Math.PI * 2);
              context.strokeStyle = rgbToCss(auraRgb, isGrabbed ? 0.85 : chargeValue !== 0 ? 0.6 : 0.42);
              context.lineWidth = 1.6 * getVisualScale();
              context.stroke();

              context.beginPath();
              context.arc(
                atomX,
                atomY,
                drawRadius * 0.86,
                Math.PI * 1.05,
                Math.PI * 1.62
              );
              context.strokeStyle = "rgba(255, 255, 255, 0.5)";
              context.lineWidth = Math.max(1.2, drawRadius * 0.09);
              context.lineCap = "round";
              context.stroke();

              context.beginPath();
              context.arc(
                atomX - drawRadius * 0.36,
                atomY - drawRadius * 0.4,
                Math.max(1.6, drawRadius * 0.13),
                0,
                Math.PI * 2
              );
              context.fillStyle = "rgba(255, 255, 255, 0.85)";
              context.shadowColor = "rgba(255, 255, 255, 0.9)";
              context.shadowBlur = 6;
              context.fill();
              context.restore();
            }

            if (isSelected) {
              context.beginPath();
              context.arc(atomX, atomY, drawRadius + 6 * getVisualScale(), 0, Math.PI * 2);
              context.strokeStyle = "rgba(125, 211, 252, 0.9)";
              context.lineWidth = 3 * getVisualScale();
              context.stroke();
            }

            // Charge badge for ions (Na+ / Cl- / O2-).
            if (perAtomIonCharge !== 0) {
              context.save();
              context.translate(atomX - drawRadius * 0.95, atomY - drawRadius * 0.95);
              context.scale(-1, 1);
              context.fillStyle = rgbToCss(
                perAtomIonCharge > 0 ? POSITIVE_CHARGE_RGB : NEGATIVE_CHARGE_RGB,
                0.95
              );
              context.font = `700 ${Math.max(10, drawRadius * 0.55)}px system-ui`;
              context.textAlign = "center";
              context.textBaseline = "middle";
              context.shadowColor = rgbToCss(
                perAtomIonCharge > 0 ? POSITIVE_CHARGE_RGB : NEGATIVE_CHARGE_RGB,
                0.7
              );
              context.shadowBlur = 8;
              context.fillText(
                `${Math.abs(perAtomIonCharge) > 1 ? Math.abs(perAtomIonCharge) : ""}${
                  perAtomIonCharge > 0 ? "+" : "−"
                }`,
                0,
                0
              );
              context.restore();
            }

            if (parentMolecule) {
              drawAtomLonePairs(atom, parentMolecule, drawRadius);
            }

            context.save();
            context.translate(atomX, atomY);
            context.scale(-1, 1);
            context.fillStyle = lewisViewRef.current ? "#e8f2ff" : atomStyle.text;
            context.font = `600 ${drawRadius * (lewisViewRef.current ? 0.88 : 0.72)}px system-ui`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.shadowColor = "rgba(0, 0, 0, 0.18)";
            context.shadowBlur = 2;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 1;
            context.fillText(type, 0, 0.5);
            context.restore();
          }

          // Polarity overlay: dipole arrows (cross-tail notation) on polar
          // covalent bonds, pointing toward the more electronegative atom.
          if (showPolarityRef.current) {
            context.save();
            context.strokeStyle = "rgba(139, 233, 255, 0.9)";
            context.fillStyle = "rgba(139, 233, 255, 0.9)";
            context.lineWidth = 1.7 * getVisualScale();
            context.lineCap = "round";
            context.shadowColor = "rgba(103, 232, 249, 0.5)";
            context.shadowBlur = 6;

            for (const bond of bondsRef.current) {
              if (getBondCategory(bond) !== "covalent") {
                continue;
              }

              const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
              const leftAtom = getAtomById(leftAtomId);
              const rightAtom = getAtomById(rightAtomId);

              if (!leftAtom || !rightAtom) {
                continue;
              }

              const parentMolecule =
                leftAtom.moleculeId !== null ? getMoleculeById(leftAtom.moleculeId) : null;

              if (parentMolecule?.visualMode === "waterDroplet") {
                continue;
              }

              const leftEN = ELECTRONEGATIVITY[leftAtom.type] ?? 2.5;
              const rightEN = ELECTRONEGATIVITY[rightAtom.type] ?? 2.5;
              const enDifference = Math.abs(leftEN - rightEN);

              if (enDifference < POLAR_BOND_MIN_EN_DIFF || enDifference > IONIC_BOND_EN_DIFF) {
                continue;
              }

              const positiveAtom = leftEN <= rightEN ? leftAtom : rightAtom;
              const negativeAtom = leftEN <= rightEN ? rightAtom : leftAtom;
              const positiveX = positiveAtom.position.x * canvas.width;
              const positiveY = positiveAtom.position.y * canvas.height;
              const negativeX = negativeAtom.position.x * canvas.width;
              const negativeY = negativeAtom.position.y * canvas.height;
              const deltaX = negativeX - positiveX;
              const deltaY = negativeY - positiveY;
              const bondLength = Math.hypot(deltaX, deltaY);

              if (bondLength < atomRadius * 1.4) {
                continue;
              }

              const unitX = deltaX / bondLength;
              const unitY = deltaY / bondLength;
              const normalX = -unitY;
              const normalY = unitX;
              const sideOffset = 15 * getVisualScale();
              const midX = (positiveX + negativeX) / 2 + normalX * sideOffset;
              const midY = (positiveY + negativeY) / 2 + normalY * sideOffset;
              const halfLength = Math.min(19 * getVisualScale(), bondLength * 0.28);
              const tailX = midX - unitX * halfLength;
              const tailY = midY - unitY * halfLength;
              const headX = midX + unitX * halfLength;
              const headY = midY + unitY * halfLength;
              const arrowSize = 6 * getVisualScale();
              const crossSize = 4.5 * getVisualScale();

              context.beginPath();
              context.moveTo(tailX, tailY);
              context.lineTo(headX, headY);
              context.stroke();

              context.beginPath();
              context.moveTo(headX, headY);
              context.lineTo(
                headX - unitX * arrowSize - normalX * arrowSize * 0.6,
                headY - unitY * arrowSize - normalY * arrowSize * 0.6
              );
              context.lineTo(
                headX - unitX * arrowSize + normalX * arrowSize * 0.6,
                headY - unitY * arrowSize + normalY * arrowSize * 0.6
              );
              context.closePath();
              context.fill();

              // Cross at the tail (the δ+ end) — standard dipole notation.
              context.beginPath();
              context.moveTo(tailX + unitX * 3 - normalX * crossSize, tailY + unitY * 3 - normalY * crossSize);
              context.lineTo(tailX + unitX * 3 + normalX * crossSize, tailY + unitY * 3 + normalY * crossSize);
              context.stroke();
            }

            context.restore();
          }

          for (const molecule of moleculesRef.current) {
            drawWaterDimerAnnotations(molecule);
          }

          // Transient neon effects: grab ripples and molecule formation bursts.
          const effectsNow = performance.now();
          effectsRef.current = effectsRef.current.filter(
            (effect) => effectsNow - effect.startedAt < effect.duration
          );

          for (const effect of effectsRef.current) {
            const progress = clampValue(
              (effectsNow - effect.startedAt) / effect.duration,
              0,
              1
            );
            const eased = easeOutCubic(progress);
            const effectX = effect.x * canvas.width;
            const effectY = effect.y * canvas.height;

            if (effect.kind === "ripple") {
              const baseAlpha = effect.soft ? 0.3 : 0.72;
              const startRadius = atomRadius * 1.05;
              const endRadius = atomRadius * (effect.soft ? 2.5 : 3.6);
              const ringOffsets = effect.soft ? [0] : [0, 0.18];

              context.save();
              context.lineCap = "round";

              for (const ringOffset of ringOffsets) {
                const ringProgress = clampValue(eased - ringOffset, 0, 1);

                if (ringProgress <= 0) {
                  continue;
                }

                const ringRadius = lerp(startRadius, endRadius, ringProgress);
                const ringAlpha = baseAlpha * (1 - ringProgress) ** 1.4;

                context.beginPath();
                context.arc(effectX, effectY, ringRadius, 0, Math.PI * 2);
                context.strokeStyle = rgbToCss(effect.color, ringAlpha);
                context.lineWidth = lerp(3.6, 1.1, ringProgress) * getVisualScale();
                context.shadowColor = rgbToCss(effect.color, Math.min(1, ringAlpha * 1.5));
                context.shadowBlur = 16;
                context.stroke();
              }

              context.restore();
            }

            if (effect.kind === "formation") {
              const maxRadius = 108 * getVisualScale();

              context.save();

              // Central bloom.
              const bloomRadius = lerp(atomRadius * 0.8, maxRadius * 0.9, eased);
              const bloomAlpha = 0.5 * (1 - progress) ** 1.2;
              const bloomGradient = context.createRadialGradient(
                effectX,
                effectY,
                0,
                effectX,
                effectY,
                bloomRadius
              );
              bloomGradient.addColorStop(0, rgbToCss(effect.color, bloomAlpha));
              bloomGradient.addColorStop(0.55, rgbToCss(effect.color, bloomAlpha * 0.45));
              bloomGradient.addColorStop(1, rgbToCss(effect.color, 0));

              context.beginPath();
              context.arc(effectX, effectY, bloomRadius, 0, Math.PI * 2);
              context.fillStyle = bloomGradient;
              context.fill();

              // Twin expanding rings.
              context.lineCap = "round";

              for (const ringOffset of [0, 0.22]) {
                const ringProgress = clampValue(eased - ringOffset, 0, 1);

                if (ringProgress <= 0) {
                  continue;
                }

                const ringRadius = ringProgress * maxRadius;
                const ringAlpha = 0.85 * (1 - ringProgress) ** 1.3;

                context.beginPath();
                context.arc(effectX, effectY, ringRadius, 0, Math.PI * 2);
                context.strokeStyle = rgbToCss(effect.color, ringAlpha);
                context.lineWidth = lerp(4, 1.2, ringProgress) * getVisualScale();
                context.shadowColor = rgbToCss(effect.color, Math.min(1, ringAlpha * 1.4));
                context.shadowBlur = 18;
                context.stroke();
              }

              // Sparks flying outward on fixed golden-angle directions.
              const sparkAlpha = (1 - progress) ** 1.2;

              for (let sparkIndex = 0; sparkIndex < FORMATION_SPARK_COUNT; sparkIndex += 1) {
                const sparkAngle = sparkIndex * 2.399963229728653;
                const sparkReach = maxRadius * (0.72 + (sparkIndex % 3) * 0.14);
                const sparkDistance = lerp(atomRadius * 0.5, sparkReach, eased);
                const sparkRadius =
                  Math.max(1.2, (2.8 - (sparkIndex % 3) * 0.7) * getVisualScale()) *
                  (1 - progress * 0.45);

                context.beginPath();
                context.arc(
                  effectX + Math.cos(sparkAngle) * sparkDistance,
                  effectY + Math.sin(sparkAngle) * sparkDistance,
                  sparkRadius,
                  0,
                  Math.PI * 2
                );
                context.fillStyle = rgbToCss(effect.color, sparkAlpha);
                context.shadowColor = rgbToCss(effect.color, sparkAlpha);
                context.shadowBlur = 10;
                context.fill();
              }

              context.restore();
            }
          }

          animationFrameId = requestAnimationFrame(drawFrame);
        };

        drawFrame();
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    startCamera();

    return () => {
      isMounted = false;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      handLandmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labEntered]);

  // Keyboard shortcuts intentionally read the current ref-backed state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "Escape" && atomicExpansionAtomRef.current) {
        exitAtomicExpansionMode();
        return;
      }

      if (event.key === "m" || event.key === "M") {
        setMenuOpen((current) => !current);
        return;
      }

      if (event.key === "p" || event.key === "P") {
        setPresentationMode((current) => !current);
        return;
      }

      if (event.key === "w" || event.key === "W") {
        const targetMoleculeId = getWaterToggleTargetMoleculeId();

        if (targetMoleculeId !== null) {
          toggleWaterVisualMode(targetMoleculeId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => () => {
    if (bondLimitMessageTimeoutRef.current) {
      clearTimeout(bondLimitMessageTimeoutRef.current);
    }

    if (atomicExpansionCollapseTimeoutRef.current) {
      clearTimeout(atomicExpansionCollapseTimeoutRef.current);
    }

    if (eventBannerTimeoutRef.current) {
      clearTimeout(eventBannerTimeoutRef.current);
    }

    if (resetArmTimeoutRef.current) {
      clearTimeout(resetArmTimeoutRef.current);
    }

    if (energyDiagramTimeoutRef.current) {
      clearTimeout(energyDiagramTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    tutorialActiveRef.current = tutorialStep !== null;
  }, [tutorialStep]);

  // Tutorial progression: polls the ref-backed simulation state for the
  // current step's completion condition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tutorialStep === null) {
      return undefined;
    }

    let advanced = false;

    const advance = () => {
      if (advanced) {
        return;
      }

      advanced = true;

      if (tutorialStep + 1 >= TUTORIAL_STEPS.length) {
        setTutorialStep(null);
        showEventBanner(
          {
            kind: "tutorial",
            title: "Tutorial complete!",
            subtitle: "You built water from scratch — the lab is yours 🎉",
          },
          4200
        );
        spawnFormationEffect({ x: 0.5, y: 0.42 }, getAtomNeonRgb("O"));
      } else {
        setTutorialStep(tutorialStep + 1);
      }
    };

    const check = () => {
      const stepId = TUTORIAL_STEPS[tutorialStep].id;

      if (stepId === "move") {
        const reachedTarget = atomsRef.current.some(
          (atom) =>
            atom.type === "H" &&
            atom.moleculeId === null &&
            Math.hypot(
              atom.position.x - TUTORIAL_TARGET_POSITION.x,
              atom.position.y - TUTORIAL_TARGET_POSITION.y
            ) <= TUTORIAL_TARGET_RADIUS
        );

        if (reachedTarget) {
          advance();
        }
        return;
      }

      if (stepId === "menu") {
        if (menuOpen) {
          advance();
        }
        return;
      }

      if (stepId === "spawn") {
        if (atomsRef.current.filter((atom) => atom.type === "H").length >= 2) {
          advance();
        }
        return;
      }

      if (stepId === "bondmode") {
        if (bondingMode) {
          advance();
        }
        return;
      }

      if (stepId === "bond") {
        const hasWaterShape =
          moleculePromptRef.current?.type === "water" ||
          moleculesRef.current.some((molecule) => molecule.formula === "H2O") ||
          atomsRef.current.some((atom) => {
            if (atom.type !== "O") {
              return false;
            }

            const hydrogenBondCount = bondsRef.current.filter((bond) => {
              const [leftAtomId, rightAtomId] = getBondAtomIds(bond);
              const otherAtomId =
                leftAtomId === atom.id ? rightAtomId : rightAtomId === atom.id ? leftAtomId : null;

              if (otherAtomId === null) {
                return false;
              }

              return atomsRef.current.find((entry) => entry.id === otherAtomId)?.type === "H";
            }).length;

            return hydrogenBondCount >= 2;
          });

        if (hasWaterShape) {
          advance();
        }
        return;
      }

      if (stepId === "water") {
        if (moleculesRef.current.some((molecule) => molecule.formula === "H2O")) {
          advance();
        }
      }
    };

    check();
    const timer = window.setInterval(check, 350);

    return () => {
      window.clearInterval(timer);
    };
  }, [tutorialStep, menuOpen, bondingMode]);

  useEffect(() => {
    let animationFrameId = 0;

    const tick = () => {
      setWaterOverlayFrame((current) => (current + 1) % 100000);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // eslint-disable-next-line react-hooks/refs
  const waterOverlayMolecules = moleculesRef.current.filter(
    (molecule) =>
      molecule.formula === "H2O" &&
      molecule.visualMode === "waterDroplet" &&
      !getClusterForMemberMoleculeId(molecule.id)
  );
  // eslint-disable-next-line react-hooks/refs
  const waterOverlayHydrogenBonds = getWaterHydrogenBondData();
  // eslint-disable-next-line react-hooks/refs
  const atomicExpansionViewportWidth = viewportRef.current?.clientWidth ?? 0;
  // eslint-disable-next-line react-hooks/refs
  const atomicExpansionViewportHeight = viewportRef.current?.clientHeight ?? 0;
  const atomicExpansionDisplayState = getAtomicExpansionDisplayState(
    activeAtomicExpansionAtom,
    atomicExpansionViewportWidth,
    atomicExpansionViewportHeight,
    getScaledAtomRadiusPx()
  );
  const atomicExpansionEntryProgress = atomicExpansionDisplayState.entryProgress;
  const atomicExpansionModelCenterX = atomicExpansionDisplayState.modelCenterX;
  const atomicExpansionModelCenterY = atomicExpansionDisplayState.modelCenterY;
  const atomicExpansionModelSizePx = atomicExpansionDisplayState.modelSizePx;
  const atomicExpansionParticleScale = atomicExpansionDisplayState.particleScale;
  const atomicExpansionContentOpacity = clampValue((atomicExpansionEntryProgress - 0.12) / 0.7, 0, 1);
  const atomicExpansionInfoOpacity = clampValue((atomicExpansionEntryProgress - 0.22) / 0.48, 0, 1);
  const atomicExpansionShellScale = atomicExpansionCollapseGesture.isClosing
    ? atomicExpansionCollapseGesture.shellScale
    : atomicExpansionCollapseGesture.shellGripActive
      ? atomicExpansionCollapseGesture.shellScale
      : 1;
  const atomicExpansionShellGlow = atomicExpansionCollapseGesture.isClosing
    ? 0.8
    : atomicExpansionCollapseGesture.shellGripActive
      ? 1
      : 0;

  return (
    <div
      className={presentationMode ? "presentation-mode" : undefined}
      style={{
        textAlign: "center",
        color: "white",
        padding: "clamp(16px, 3vw, 36px) clamp(12px, 2.2vw, 20px) 20px",
      }}
    >
      <style>{`
        @keyframes waterOrbSwirl {
          0% { transform: translate3d(-4%, -2%, 0) rotate(0deg) scale(1); }
          50% { transform: translate3d(5%, 3%, 0) rotate(180deg) scale(1.05); }
          100% { transform: translate3d(-4%, -2%, 0) rotate(360deg) scale(1); }
        }

        @keyframes waterOrbWave {
          0% { transform: translate3d(-6%, 5%, 0) rotate(-8deg) scaleX(1.02); }
          50% { transform: translate3d(4%, -4%, 0) rotate(8deg) scaleX(0.98); }
          100% { transform: translate3d(-6%, 5%, 0) rotate(-8deg) scaleX(1.02); }
        }

        @keyframes waterOrbHighlight {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.92; }
          50% { transform: translate3d(4%, 3%, 0) scale(1.06); opacity: 1; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.92; }
        }

        @keyframes atomicElectronOrbit {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes eventBannerPop {
          0% { opacity: 0; transform: translate(-50%, -16px) scale(0.9); }
          10% { opacity: 1; transform: translate(-50%, 0) scale(1.04); }
          16% { transform: translate(-50%, 0) scale(1); }
          84% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -10px) scale(0.97); }
        }

        @keyframes tutorialTargetPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.4); opacity: 0.95; }
          50% { box-shadow: 0 0 26px 8px rgba(103, 232, 249, 0.22); opacity: 0.55; }
        }

        @keyframes auroraDrift1 {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(6vw, 4vh, 0) scale(1.16); }
        }

        @keyframes auroraDrift2 {
          from { transform: translate3d(0, 0, 0) scale(1.12); }
          to { transform: translate3d(-5vw, -5vh, 0) scale(0.94); }
        }

        .bg-aurora {
          position: fixed;
          border-radius: 999px;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.55;
        }

        .bg-aurora-1 {
          width: 46vw;
          height: 46vw;
          left: -12vw;
          top: -10vw;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(56, 189, 248, 0) 65%);
          animation: auroraDrift1 26s ease-in-out infinite alternate;
        }

        .bg-aurora-2 {
          width: 52vw;
          height: 52vw;
          right: -16vw;
          bottom: -14vw;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 65%);
          animation: auroraDrift2 32s ease-in-out infinite alternate;
        }

        .bg-aurora-3 {
          width: 32vw;
          height: 32vw;
          left: 36vw;
          top: 56vh;
          background: radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, rgba(45, 212, 191, 0) 65%);
          animation: auroraDrift1 40s ease-in-out infinite alternate-reverse;
        }

        .app-shell {
          width: min(100%, 1320px);
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .camera-layout {
          display: grid;
          grid-template-columns: minmax(180px, 240px) minmax(320px, 1fr) minmax(220px, 300px);
          grid-template-areas: "size camera controls";
          align-items: start;
          gap: clamp(12px, 2vw, 24px);
        }

        .camera-column {
          grid-area: camera;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(14px, 1.8vw, 16px);
        }

        .camera-title {
          margin: 0;
          font-size: clamp(1.4rem, 2.8vw, 2rem);
          line-height: 1.1;
          background: linear-gradient(92deg, #e0f2fe 0%, #7dd3fc 48%, #c4b5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 26px rgba(125, 211, 252, 0.16);
        }

        .camera-tagline {
          margin-top: 2px;
          font-size: clamp(12px, 1.5vw, 14px);
          letter-spacing: 0.06em;
          color: rgba(184, 212, 240, 0.75);
        }

        @keyframes emblemSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes landingRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .landing-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(1000px 620px at 50% 12%, rgba(29, 78, 216, 0.28) 0%, rgba(5, 11, 24, 0) 60%),
            radial-gradient(760px 500px at 12% 88%, rgba(124, 58, 237, 0.14) 0%, rgba(5, 11, 24, 0) 60%),
            #050b18;
        }

        .landing-content {
          text-align: center;
          max-width: 620px;
          animation: landingRise 700ms ease both;
        }

        .landing-emblem-orbits {
          animation: emblemSpin 26s linear infinite;
          transform-origin: 60px 60px;
        }

        .landing-title {
          margin: 18px 0 0;
          font-size: clamp(2rem, 6vw, 3.2rem);
          line-height: 1.05;
          background: linear-gradient(92deg, #e0f2fe 0%, #7dd3fc 48%, #c4b5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 0 34px rgba(125, 211, 252, 0.18);
        }

        .landing-tagline {
          margin-top: 10px;
          font-size: clamp(15px, 2.2vw, 18px);
          color: rgba(200, 224, 246, 0.88);
        }

        .landing-stats {
          margin-top: 14px;
          font-size: clamp(12px, 1.6vw, 14px);
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #67e8f9;
          opacity: 0.9;
        }

        .landing-enter-button {
          margin-top: 26px;
          padding: 14px 42px;
          font-size: clamp(15px, 2vw, 17px);
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #06202e;
          background: linear-gradient(92deg, #7dd3fc 0%, #67e8f9 55%, #a5b4fc 100%);
          border: none;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 10px 34px rgba(56, 189, 248, 0.35), 0 0 60px rgba(56, 189, 248, 0.18);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .landing-enter-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 40px rgba(56, 189, 248, 0.45), 0 0 80px rgba(56, 189, 248, 0.24);
        }

        .landing-note {
          margin-top: 18px;
          font-size: clamp(11px, 1.4vw, 12.5px);
          line-height: 1.55;
          color: rgba(184, 212, 240, 0.6);
        }

        /* Presentation mode: full-bleed lab, HUD hidden — for demos/judging. */
        .presentation-mode .size-slider-panel,
        .presentation-mode .control-panel,
        .presentation-mode .brand-note,
        .presentation-mode .camera-title,
        .presentation-mode .camera-tagline {
          display: none !important;
        }

        .presentation-mode .camera-layout {
          grid-template-columns: 1fr;
          grid-template-areas: "camera";
        }

        .presentation-mode .camera-viewport {
          width: min(100%, 1120px);
        }

        .presentation-exit-button {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 60;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid rgba(125, 211, 252, 0.3);
          background: rgba(8, 20, 40, 0.75);
          color: rgba(186, 230, 253, 0.85);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          opacity: 0.55;
          transition: opacity 160ms ease;
        }

        .presentation-exit-button:hover {
          opacity: 1;
        }

        .panel-card {
          width: 100%;
          box-sizing: border-box;
          position: sticky;
          top: clamp(12px, 2vw, 24px);
        }

        .size-slider-panel {
          grid-area: size;
          width: min(100%, 240px);
          max-width: 240px;
          justify-self: start;
        }

        .control-panel {
          grid-area: controls;
          max-width: 300px;
          justify-self: end;
        }

        .camera-frame-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .camera-viewport {
          position: relative;
          width: min(100%, 760px);
          aspect-ratio: 4 / 3;
          margin: 0 auto;
          border-radius: 14px;
          box-shadow:
            0 0 0 1px rgba(125, 211, 252, 0.16),
            0 14px 52px rgba(2, 132, 199, 0.16),
            0 0 110px rgba(56, 189, 248, 0.09);
        }

        @media (max-width: 1100px) {
          .camera-layout {
            grid-template-columns: minmax(160px, 220px) minmax(0, 1fr) minmax(210px, 280px);
          }
        }

        @media (max-width: 860px) {
          .camera-layout {
            grid-template-columns: 1fr;
            grid-template-areas:
              "camera"
              "size"
              "controls";
            justify-items: center;
          }

          /* Stacked layout: let the panels breathe at full width instead of
             staying pinned to their narrow desktop-sidebar sizes. */
          .size-slider-panel {
            justify-self: center;
            width: 100% !important;
            max-width: min(480px, 100%) !important;
          }

          .control-panel {
            justify-self: center;
            width: 100%;
            max-width: min(480px, 100%);
          }

          .panel-card {
            position: static;
            top: auto;
          }
        }

        @media (max-width: 560px) {
          .camera-layout {
            gap: 12px;
          }

          .camera-viewport {
            width: min(100%, calc(100vw - 24px));
          }

          .panel-card {
            padding: 12px !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
      <div aria-hidden="true" className="bg-aurora bg-aurora-1" />
      <div aria-hidden="true" className="bg-aurora bg-aurora-2" />
      <div aria-hidden="true" className="bg-aurora bg-aurora-3" />
      {!labEntered ? (
        <div className="landing-overlay">
          <div className="landing-content">
            <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
              <defs>
                <radialGradient id="landingNucleus" cx="35%" cy="30%" r="80%">
                  <stop offset="0%" stopColor="#9ff0ff" />
                  <stop offset="55%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </radialGradient>
              </defs>
              <g className="landing-emblem-orbits">
                <g stroke="#67e8f9" strokeWidth="3" fill="none" opacity="0.85">
                  <ellipse cx="60" cy="60" rx="52" ry="21" transform="rotate(-30 60 60)" />
                  <ellipse cx="60" cy="60" rx="52" ry="21" transform="rotate(30 60 60)" />
                  <ellipse cx="60" cy="60" rx="52" ry="21" transform="rotate(90 60 60)" />
                </g>
                <circle cx="100" cy="34" r="5.5" fill="#ffd166" />
                <circle cx="19" cy="81" r="5.5" fill="#ff6b81" />
                <circle cx="87" cy="100" r="5.5" fill="#7cff9b" />
              </g>
              <circle cx="60" cy="60" r="15" fill="url(#landingNucleus)" />
              <circle cx="55" cy="55" r="4" fill="#e0f7ff" opacity="0.9" />
            </svg>
            <h1 className="landing-title">Full Chem AR Lab</h1>
            <div className="landing-tagline">Build real chemistry with your hands.</div>
            <div className="landing-stats">27 molecules · 6 reactions · hand-tracked AR</div>
            <button
              type="button"
              className="landing-enter-button"
              onClick={() => setLabEntered(true)}
            >
              Enter the Lab 🧪
            </button>
            <div className="landing-note">
              Uses your camera for hand tracking — the feed stays on your device and is never
              recorded or uploaded. No camera? Everything also works by touch or mouse.
            </div>
          </div>
        </div>
      ) : null}
      {presentationMode ? (
        <button
          type="button"
          className="presentation-exit-button"
          onClick={() => setPresentationMode(false)}
        >
          Exit Presentation (P)
        </button>
      ) : null}
      {aboutOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(2, 6, 23, 0.7)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setAboutOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(640px, 100%)",
              maxHeight: "min(80vh, 640px)",
              overflowY: "auto",
              padding: "clamp(18px, 3vw, 26px)",
              borderRadius: "18px",
              textAlign: "left",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.97) 0%, rgba(2, 6, 23, 0.96) 100%)",
              border: "1px solid rgba(125, 211, 252, 0.28)",
              boxShadow: "0 24px 60px rgba(2, 6, 23, 0.6), 0 0 60px rgba(56, 189, 248, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "clamp(16px, 2.4vw, 20px)", fontWeight: 800 }}>
                🔬 About the Science
              </div>
              <button
                type="button"
                onClick={() => setAboutOpen(false)}
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "white",
                  borderRadius: "999px",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            {[
              {
                heading: "Molecular geometry (VSEPR)",
                body:
                  "Molecules snap into shapes based on VSEPR theory: water is bent at 104.5°, ammonia is trigonal pyramidal (107°), methane tetrahedral (109.5°), CO₂ linear, H₂S bent at 92°. Lone pairs are drawn from each species' Lewis structure — including chloride's full octet in ionic compounds.",
              },
              {
                heading: "Bond polarity",
                body:
                  "The polarity overlay computes each bond's electronegativity difference on the Pauling scale (H 2.20, C 2.55, N 3.04, O 3.44, S 2.58, Cl 3.16, Na 0.93). Differences from 0.4–1.8 are drawn as polar covalent with a dipole arrow toward the more electronegative atom; larger differences transfer the electron outright — shown as dashed ionic attractions with charge badges (Na⁺, Cl⁻, O²⁻).",
              },
              {
                heading: "Bonding rules",
                body:
                  "Atoms enforce their real valences: H forms 1 bond, O 2, N 3, C 4, S 2 — with the extra dative-bond slot that creates the hydronium (H₃O⁺) and ammonium (NH₄⁺) cations. Metals never bond covalently: sodium only pairs ionically.",
              },
              {
                heading: "Reactions conserve mass",
                body:
                  "Every reaction rebuilds its products from the exact atoms of the reactants — conservation of mass isn't checked, it's enforced by construction. Equations shown (like 2Na + 2H₂O → 2NaOH + H₂) are balanced because the atoms literally rearrange on screen. Exothermic reactions burst in fire colors.",
              },
              {
                heading: "Temperature, kinetics & equilibrium",
                body:
                  "The lab thermostat drives real behavior: thermal (Brownian) motion scales with temperature, hydrogen bonds weaken above ~40°C and break near boiling, and methane won't ignite below 100°C. Unstable species — H₂CO₃, H₂SO₃, and NH₄Cl — decompose with temperature-dependent half-lives, the reverse arrow of an equilibrium. Every reaction shows an energy diagram with its activation barrier and an approximate ΔH, and the pH meter tracks the acids and bases currently in the lab.",
              },
              {
                heading: "How the tracking works",
                body:
                  "MediaPipe Hand Landmarker detects 21 landmarks per hand (up to 6 hands) on-device — no video ever leaves your browser. Landmarks are smoothed with a One Euro filter (adaptive low-pass: steady when still, responsive when fast), and grabbed molecules ease toward your fingertip for a stable feel.",
              },
              {
                heading: "Sources",
                body:
                  "Electronegativities: Pauling scale. Bond angles and molar masses: standard reference values (CRC Handbook of Chemistry and Physics). Molecule and reaction definitions are data-driven, so every species can be checked against its template.",
              },
            ].map((section) => (
              <div key={section.heading} style={{ marginBottom: "14px" }}>
                <div
                  style={{
                    fontSize: "clamp(13px, 1.8vw, 14px)",
                    fontWeight: 700,
                    color: "#7dd3fc",
                    marginBottom: "4px",
                  }}
                >
                  {section.heading}
                </div>
                <div
                  style={{
                    fontSize: "clamp(12px, 1.6vw, 13px)",
                    lineHeight: 1.6,
                    color: "rgba(226, 232, 240, 0.88)",
                  }}
                >
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="app-shell">
      <div
        aria-hidden="true"
        className="brand-note"
        style={{
          pointerEvents: "none",
          zIndex: 1,
          fontSize: "clamp(12px, 1.2vw, 12px)",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.74,
          background: "linear-gradient(90deg, #fef08a 0%, #facc15 45%, #fb923c 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          textShadow: "0 0 10px rgba(250, 204, 21, 0.22), 0 0 18px rgba(251, 146, 60, 0.12)",
          fontFamily:
            '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          whiteSpace: "nowrap",
          marginBottom: "clamp(12px, 2vw, 18px)",
        }}
      >
        (C) SHIV PRAHALATHAN
      </div>
      <div className="camera-layout">
      <div
        className="size-slider-panel panel-card"
        style={{
          zIndex: 30,
          width: "min(100%, 240px)",
          padding: "clamp(12px, 1.4vw, 14px) clamp(12px, 1.4vw, 12px)",
          textAlign: "left",
          background: "rgba(15, 23, 42, 0.58)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
        }}
      >
        <div style={{ fontSize: "clamp(13px, 1.4vw, 13px)", fontWeight: 700, marginBottom: "10px" }}>
          Atom / Molecule Size
        </div>
        <input
          type="range"
          min="0.6"
          max="1.6"
          step="0.01"
          value={atomSizeScale}
          onChange={handleAtomSizeScaleChange}
          style={{
            width: "100%",
            accentColor: "#7dd3fc",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            marginTop: "8px",
            fontSize: "clamp(12px, 1.4vw, 12px)",
            opacity: 0.78,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {atomSizeScale.toFixed(2)}x
        </div>
        <div
          style={{
            marginTop: "clamp(12px, 1.6vw, 14px)",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "clamp(13px, 1.4vw, 13px)", fontWeight: 700 }}>🌡️ Temperature</span>
          <span
            style={{
              fontSize: "clamp(13px, 1.4vw, 13px)",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color:
                temperature <= 5
                  ? "#7dd3fc"
                  : temperature < 60
                    ? "rgba(255, 255, 255, 0.85)"
                    : temperature < 150
                      ? "#fdba74"
                      : "#f87171",
            }}
          >
            {temperature}°C
          </span>
        </div>
        <input
          type="range"
          min="-20"
          max="300"
          step="5"
          value={temperature}
          onChange={handleTemperatureChange}
          style={{
            width: "100%",
            accentColor:
              temperature <= 5 ? "#7dd3fc" : temperature < 150 ? "#fdba74" : "#f87171",
            cursor: "pointer",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "3px",
            fontSize: "clamp(9px, 1.1vw, 10px)",
            opacity: 0.55,
            letterSpacing: "0.04em",
          }}
        >
          <span>−20° ice</span>
          <span>100° boil</span>
          <span>300° burn</span>
        </div>
        <label
          style={{
            marginTop: "clamp(11px, 1.5vw, 12px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(9px, 1.2vw, 10px)",
            fontSize: "clamp(12px, 1.2vw, 12px)",
            fontWeight: 600,
            lineHeight: 1.3,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showLonePairs}
            onChange={handleShowLonePairsChange}
            style={{
              width: "14px",
              height: "14px",
              margin: 0,
              accentColor: "#7dd3fc",
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          />
          <span>Show Lone Pairs</span>
        </label>
        <label
          style={{
            marginTop: "clamp(9px, 1.2vw, 10px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(9px, 1.2vw, 10px)",
            fontSize: "clamp(12px, 1.2vw, 12px)",
            fontWeight: 600,
            lineHeight: 1.3,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showPolarity}
            onChange={handleShowPolarityChange}
            style={{
              width: "14px",
              height: "14px",
              margin: 0,
              accentColor: "#7dd3fc",
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          />
          <span>Show Polarity (dipole arrows)</span>
        </label>
        <label
          style={{
            marginTop: "clamp(9px, 1.2vw, 10px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(9px, 1.2vw, 10px)",
            fontSize: "clamp(12px, 1.2vw, 12px)",
            fontWeight: 600,
            lineHeight: 1.3,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={lewisView}
            onChange={handleLewisViewChange}
            style={{
              width: "14px",
              height: "14px",
              margin: 0,
              accentColor: "#7dd3fc",
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          />
          <span>Lewis Structure View</span>
        </label>
        <label
          style={{
            marginTop: "clamp(9px, 1.2vw, 10px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(9px, 1.2vw, 10px)",
            fontSize: "clamp(12px, 1.2vw, 12px)",
            fontWeight: 600,
            lineHeight: 1.3,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={handleSoundEnabledChange}
            style={{
              width: "14px",
              height: "14px",
              margin: 0,
              accentColor: "#7dd3fc",
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          />
          <span>Sound Effects</span>
        </label>
        <div
          style={{
            marginTop: "clamp(13px, 1.8vw, 14px)",
            paddingTop: "clamp(11px, 1.6vw, 12px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "clamp(13px, 1.4vw, 13px)", fontWeight: 700 }}>🧪 Lab pH</span>
            <span
              style={{
                fontSize: "clamp(13px, 1.4vw, 13px)",
                fontWeight: 800,
                color: currentPHColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {currentPH.toFixed(1)} · {currentPHLabel}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              height: "10px",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, #ef4444 0%, #f97316 18%, #facc15 32%, #22c55e 50%, #38bdf8 68%, #6366f1 84%, #8b5cf6 100%)",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-4px",
                left: `${(currentPH / 14) * 100}%`,
                transform: "translateX(-50%)",
                width: "6px",
                height: "18px",
                borderRadius: "3px",
                background: "#f8fafc",
                border: "1px solid rgba(2, 6, 23, 0.55)",
                boxShadow: "0 0 8px rgba(248, 250, 252, 0.6)",
                transition: "left 300ms ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "4px",
              fontSize: "clamp(9px, 1.1vw, 10px)",
              opacity: 0.55,
              letterSpacing: "0.04em",
            }}
          >
            <span>0 acid</span>
            <span>7</span>
            <span>14 base</span>
          </div>
        </div>
        <div
          style={{
            marginTop: "clamp(13px, 1.8vw, 14px)",
            paddingTop: "clamp(11px, 1.6vw, 12px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ fontSize: "clamp(13px, 1.4vw, 13px)", fontWeight: 700, marginBottom: "8px" }}>
            📘 Tutorial
          </div>
          {tutorialStep === null ? (
            <button
              type="button"
              onClick={startTutorial}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(125, 211, 252, 0.3)",
                background: "rgba(14, 116, 144, 0.2)",
                color: "#d9faff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "clamp(12px, 1.3vw, 12px)",
              }}
            >
              Start Tutorial
            </button>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "clamp(11px, 1.2vw, 11px)",
                  color: "#7dd3fc",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "clamp(12px, 1.3vw, 12px)",
                  lineHeight: 1.5,
                  color: "rgba(255, 255, 255, 0.92)",
                }}
              >
                {TUTORIAL_STEPS[tutorialStep].text}
              </div>
              <button
                type="button"
                onClick={skipTutorial}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.75)",
                  cursor: "pointer",
                  fontSize: "clamp(11px, 1.2vw, 11px)",
                  fontWeight: 600,
                }}
              >
                Skip Tutorial
              </button>
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: "clamp(12px, 1.8vw, 14px)",
            paddingTop: "clamp(10px, 1.6vw, 12px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "clamp(12px, 1.3vw, 12px)",
            }}
          >
            🔬 About the Science
          </button>
          <button
            type="button"
            onClick={() => setPresentationMode(true)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "clamp(12px, 1.3vw, 12px)",
            }}
          >
            🎤 Presentation Mode (P)
          </button>
          <button
            type="button"
            onClick={handleResetLabClick}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "10px",
              border: resetArmed
                ? "1px solid rgba(248, 113, 113, 0.75)"
                : "1px solid rgba(255, 255, 255, 0.16)",
              background: resetArmed ? "rgba(127, 29, 29, 0.55)" : "rgba(255, 255, 255, 0.06)",
              color: resetArmed ? "#fecaca" : "rgba(255, 255, 255, 0.9)",
              cursor: "pointer",
              fontWeight: resetArmed ? 700 : 600,
              fontSize: "clamp(12px, 1.3vw, 12px)",
            }}
          >
            {resetArmed ? "Tap again to confirm reset" : "🧹 Reset Lab"}
          </button>
        </div>
      </div>
      <div
        className="control-panel panel-card"
        onClick={(event) => event.stopPropagation()}
        style={{
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          zIndex: 40,
          padding: "clamp(14px, 2vw, 18px)",
          textAlign: "left",
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(2, 6, 23, 0.7) 100%)",
          border: "1px solid rgba(125, 211, 252, 0.22)",
          borderRadius: "18px",
          backdropFilter: "blur(10px)",
          boxShadow:
            "0 18px 40px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 24px rgba(56, 189, 248, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(11px, 1.6vw, 12px)",
            marginBottom: "clamp(12px, 1.6vw, 14px)",
          }}
        >
          <div>
            <div style={{ fontSize: "clamp(14px, 1.8vw, 15px)", fontWeight: 700 }}>Controls</div>
            <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.66, marginTop: "3px" }}>
              Tap the toggle (or press M) for the atom menu
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              background: menuOpen ? "rgba(125, 211, 252, 0.16)" : "rgba(255, 255, 255, 0.06)",
              color: menuOpen ? "#bae6fd" : "rgba(255, 255, 255, 0.72)",
              fontSize: "clamp(11px, 1.2vw, 11px)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {menuOpen ? "Menu Open" : "Menu Closed"}
          </button>
        </div>
        {menuOpen ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(11px, 1.5vw, 12px)" }}>
            <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Atom Menu
            </div>
            <button
              type="button"
              onClick={toggleDeleteMode}
              style={{
                padding: "clamp(9px, 1.4vw, 10px) clamp(11px, 1.6vw, 12px)",
                borderRadius: "10px",
                border: deleteMode
                  ? "1px solid rgba(248, 113, 113, 0.85)"
                  : "1px solid rgba(255, 255, 255, 0.14)",
                background: deleteMode
                  ? "linear-gradient(180deg, rgba(127, 29, 29, 0.85) 0%, rgba(69, 10, 10, 0.85) 100%)"
                  : "rgba(255, 255, 255, 0.08)",
                color: deleteMode ? "#fecaca" : "white",
                cursor: "pointer",
                fontWeight: deleteMode ? 700 : 600,
              }}
            >
              Delete Mode: {deleteMode ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={toggleBondingMode}
              style={{
                padding: "clamp(9px, 1.4vw, 10px) clamp(11px, 1.6vw, 12px)",
                borderRadius: "10px",
                border: bondingMode
                  ? "1px solid rgba(125, 211, 252, 0.85)"
                  : "1px solid rgba(255, 255, 255, 0.14)",
                background: bondingMode
                  ? "linear-gradient(180deg, rgba(12, 74, 110, 0.9) 0%, rgba(8, 47, 73, 0.86) 100%)"
                  : "rgba(255, 255, 255, 0.08)",
                color: bondingMode ? "#bae6fd" : "white",
                cursor: "pointer",
                fontWeight: bondingMode ? 700 : 600,
              }}
            >
              Bonding Mode: {bondingMode ? "ON" : "OFF"}
            </button>
            <div
              style={{
                fontSize: "clamp(11px, 1.2vw, 11px)",
                opacity: 0.6,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Periodic table — tap an element to spawn it
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
                gap: "2px",
              }}
            >
              {PERIODIC_ELEMENTS.map((element) => {
                const isSpawnable = Boolean(ATOM_DETAILS[element.symbol]);
                const neonColor = isSpawnable
                  ? ATOM_NEON_COLORS[element.symbol] ?? "#7dd3fc"
                  : null;

                return (
                  <button
                    key={element.symbol}
                    type="button"
                    disabled={!isSpawnable}
                    onClick={() => spawnAtom(element.symbol)}
                    title={`${element.name} (${element.number})${
                      isSpawnable ? "" : " — coming soon"
                    }`}
                    style={{
                      gridColumn: element.col,
                      gridRow: element.row,
                      aspectRatio: "1 / 1",
                      minWidth: 0,
                      padding: 0,
                      borderRadius: "4px",
                      fontSize: "clamp(8px, 1vw, 10px)",
                      fontWeight: 700,
                      lineHeight: 1,
                      border: isSpawnable
                        ? `1px solid ${neonColor}`
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      background: isSpawnable
                        ? "rgba(125, 211, 252, 0.08)"
                        : "rgba(255, 255, 255, 0.02)",
                      color: isSpawnable ? "#ffffff" : "rgba(255, 255, 255, 0.28)",
                      cursor: isSpawnable ? "pointer" : "default",
                      boxShadow: isSpawnable ? `0 0 6px ${neonColor}44` : "none",
                    }}
                  >
                    {element.symbol}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div
          style={{
            marginTop: menuOpen ? "clamp(14px, 1.8vw, 16px)" : "0",
            paddingTop: menuOpen ? "clamp(14px, 1.8vw, 16px)" : "0",
            borderTop: menuOpen ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(11px, 1.5vw, 12px)",
          }}
        >
          <div
            style={{
              padding: "clamp(11px, 1.6vw, 12px) clamp(13px, 1.8vw, 14px)",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(12px, 1.4vw, 12px)",
                opacity: 0.68,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Current Molecule
            </div>
            {currentInfoMolecule ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: "clamp(14px, 1.7vw, 14px)", fontWeight: 700 }}>
                    {currentMoleculeInfo?.name ?? currentInfoMolecule.displayLabel}
                  </div>
                  <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.65 }}>
                    {currentInfoMolecule.displayLabel}
                  </div>
                </div>
                {currentMoleculeInfo ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      fontSize: "clamp(12px, 1.35vw, 12px)",
                      lineHeight: 1.45,
                      color: "rgba(255, 255, 255, 0.88)",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <span style={{ opacity: 0.6 }}>Molar mass:</span>{" "}
                      {currentMoleculeInfo.molarMass} g/mol
                    </div>
                    <div>
                      <span style={{ opacity: 0.6 }}>Shape:</span> {currentMoleculeInfo.geometry}
                      {currentMoleculeInfo.bondAngle !== "—"
                        ? ` (${currentMoleculeInfo.bondAngle})`
                        : ""}
                    </div>
                    <div>
                      <span style={{ opacity: 0.6 }}>Polarity:</span>{" "}
                      <span style={{ color: currentMoleculePolarityColor, fontWeight: 700 }}>
                        {currentMoleculeInfo.polarity}
                      </span>
                    </div>
                    <div style={{ opacity: 0.72, fontStyle: "italic", marginTop: "2px" }}>
                      {currentMoleculeInfo.fact}
                    </div>
                  </div>
                ) : null}
                {currentInfoMolecule.formula === "H2O" ? (
                  <button
                    type="button"
                    onClick={() => toggleWaterVisualMode(currentInfoMolecule.id)}
                    style={{
                      width: "100%",
                      padding: "clamp(9px, 1.4vw, 10px) clamp(11px, 1.6vw, 12px)",
                      borderRadius: "10px",
                      border: "1px solid rgba(125, 211, 252, 0.24)",
                      background: "rgba(14, 116, 144, 0.18)",
                      color: "#d9faff",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Toggle Water Visual ({currentInfoMolecule.visualMode === "waterDroplet" ? "Orb" : "Default"})
                  </button>
                ) : null}
              </>
            ) : (
              <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.72, lineHeight: 1.5 }}>
                Hover or grab a molecule to inspect it.
              </div>
            )}
          </div>
          <div
            style={{
              padding: "clamp(11px, 1.6vw, 12px) clamp(13px, 1.8vw, 14px)",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setQuestOpen((current) => !current)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: 0,
                border: "none",
                background: "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(12px, 1.4vw, 12px)",
                  opacity: 0.85,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                🧪 Discoveries ({discoveredFormulas.length}/{DISCOVERABLE_MOLECULES.length})
              </span>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>{questOpen ? "▲" : "▼"}</span>
            </button>
            {questOpen ? (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  maxHeight: "230px",
                  overflowY: "auto",
                }}
              >
                {DISCOVERABLE_MOLECULES.map((discoverable) => {
                  const isFound = discoveredFormulas.includes(discoverable.formula);

                  return (
                    <div
                      key={discoverable.formula}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        padding: "5px 8px",
                        borderRadius: "8px",
                        fontSize: "clamp(12px, 1.3vw, 12px)",
                        background: isFound ? "rgba(34, 197, 94, 0.1)" : "rgba(255, 255, 255, 0.03)",
                        border: isFound
                          ? "1px solid rgba(134, 239, 172, 0.22)"
                          : "1px solid rgba(255, 255, 255, 0.05)",
                        color: isFound ? "#bbf7d0" : "rgba(255, 255, 255, 0.42)",
                      }}
                    >
                      <span>{isFound ? discoverable.label : "??? — undiscovered"}</span>
                      {isFound ? <span style={{ fontWeight: 800 }}>✓</span> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div
            style={{
              padding: "clamp(10px, 1.6vw, 12px) clamp(12px, 1.8vw, 14px)",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setNotebookOpen((current) => !current)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: 0,
                border: "none",
                background: "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(12px, 1.4vw, 12px)",
                  opacity: 0.85,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                }}
              >
                📓 Lab Notebook ({notebookEntries.length})
              </span>
              <span style={{ fontSize: "12px", opacity: 0.7 }}>{notebookOpen ? "▲" : "▼"}</span>
            </button>
            {notebookOpen ? (
              notebookEntries.length > 0 ? (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {notebookEntries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "baseline",
                        padding: "5px 8px",
                        borderRadius: "8px",
                        fontSize: "clamp(11px, 1.3vw, 12px)",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          color: "#7dd3fc",
                          fontVariantNumeric: "tabular-nums",
                          flex: "0 0 auto",
                          fontWeight: 700,
                        }}
                      >
                        {entry.time}
                      </span>
                      <span style={{ color: "rgba(255, 255, 255, 0.88)" }}>{entry.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "clamp(11px, 1.4vw, 12px)",
                    opacity: 0.6,
                    lineHeight: 1.5,
                    textAlign: "left",
                  }}
                >
                  Your experiments will be recorded here — every molecule formed and reaction
                  performed this session.
                </div>
              )
            ) : null}
          </div>
          {selectedAtomDetails ? (
            <div
              style={{
                padding: "clamp(11px, 1.6vw, 12px) clamp(13px, 1.8vw, 14px)",
                textAlign: "left",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                color: "white",
              }}
            >
              <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.68, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Selected Atom
              </div>
              <div style={{ fontSize: "clamp(14px, 1.8vw, 15px)", fontWeight: 700, marginTop: "8px" }}>
                {selectedAtomDetails.name}
              </div>
              <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", opacity: 0.8, marginTop: "2px" }}>
                {selectedAtomDetails.symbol}
              </div>
              <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", marginTop: "8px", lineHeight: 1.45 }}>
                <div>Atomic number: {selectedAtomDetails.atomicNumber}</div>
                <div>Valence electrons: {selectedAtomDetails.valenceElectrons}</div>
                <div>Common bonds: {selectedAtomDetails.commonBonds}</div>
              </div>
            </div>
          ) : null}
          {deleteMode ? (
            <div style={{ fontSize: "clamp(13px, 1.5vw, 13px)", color: "#fca5a5", fontWeight: 700 }}>
              Delete Mode is ON
            </div>
          ) : null}
          {bondingMode ? (
            <div style={{ fontSize: "clamp(13px, 1.5vw, 13px)", color: "#7dd3fc", fontWeight: 700 }}>
              Bonding Mode is ON
            </div>
          ) : null}
          {bondLimitMessage ? (
            <div style={{ fontSize: "clamp(12px, 1.4vw, 12px)", color: "#fca5a5", fontWeight: 700 }}>
              {bondLimitMessage}
            </div>
          ) : null}
        </div>
      </div>
        <div className="camera-column">
      <h1 className="camera-title">Full Chem AR Lab</h1>
      <div className="camera-tagline">Build real chemistry with your hands</div>
      <div className="camera-frame-wrap">
          <div
            className="camera-viewport"
            ref={viewportRef}
            onClick={handleViewportClick}
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerLeave={handleViewportPointerLeave}
            onPointerCancel={handleViewportPointerLeave}
            style={{ touchAction: "none" }}
          >
        {tutorialPromptVisible ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2, 6, 23, 0.6)",
              backdropFilter: "blur(5px)",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                width: "min(340px, calc(100% - 32px))",
                padding: "clamp(16px, 3vw, 22px)",
                borderRadius: "16px",
                background: "linear-gradient(180deg, rgba(15, 23, 42, 0.94) 0%, rgba(2, 6, 23, 0.92) 100%)",
                border: "1px solid rgba(125, 211, 252, 0.32)",
                boxShadow: "0 18px 44px rgba(2, 6, 23, 0.5), 0 0 40px rgba(56, 189, 248, 0.12)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "clamp(15px, 2.2vw, 18px)", fontWeight: 800 }}>
                👋 Welcome to Chem AR Lab!
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "clamp(13px, 1.5vw, 13px)",
                  lineHeight: 1.55,
                  opacity: 0.85,
                }}
              >
                Would you like a quick tutorial? It walks you through moving atoms, spawning new
                ones, and building your first molecule.
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={startTutorial}
                  style={{
                    minWidth: "110px",
                    padding: "9px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(125, 211, 252, 0.45)",
                    background: "rgba(14, 116, 144, 0.35)",
                    color: "#d9faff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Yes, show me
                </button>
                <button
                  type="button"
                  onClick={skipTutorial}
                  style={{
                    minWidth: "110px",
                    padding: "9px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "rgba(255, 255, 255, 0.8)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {tutorialStep !== null && TUTORIAL_STEPS[tutorialStep].id === "move" ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${(1 - TUTORIAL_TARGET_POSITION.x) * 100}%`,
              top: `${TUTORIAL_TARGET_POSITION.y * 100}%`,
              width: `${TUTORIAL_TARGET_RADIUS * 2 * 100}%`,
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              borderRadius: "999px",
              border: "2px dashed rgba(103, 232, 249, 0.85)",
              animation: "tutorialTargetPulse 1.6s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        ) : null}
        {eventBanner ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "14%",
              left: "50%",
              zIndex: 6,
              pointerEvents: "none",
              padding: "clamp(14px, 2vw, 16px) clamp(18px, 3vw, 26px)",
              borderRadius: "16px",
              textAlign: "center",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.86) 100%)",
              border:
                eventBanner.kind === "all" || eventBanner.kind === "reaction"
                  ? "1px solid rgba(255, 170, 70, 0.55)"
                  : "1px solid rgba(125, 211, 252, 0.45)",
              boxShadow:
                eventBanner.kind === "all" || eventBanner.kind === "reaction"
                  ? "0 12px 40px rgba(2, 6, 23, 0.5), 0 0 46px rgba(255, 140, 50, 0.3)"
                  : "0 12px 40px rgba(2, 6, 23, 0.5), 0 0 36px rgba(56, 189, 248, 0.22)",
              animation: "eventBannerPop 2.8s ease forwards",
            }}
          >
            <div
              style={{
                fontSize: "clamp(14px, 2vw, 17px)",
                fontWeight: 800,
                background:
                  eventBanner.kind === "all" || eventBanner.kind === "reaction"
                    ? "linear-gradient(90deg, #fde68a 0%, #fb923c 50%, #f87171 100%)"
                    : "linear-gradient(90deg, #bae6fd 0%, #67e8f9 50%, #a5b4fc 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {eventBanner.title}
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "clamp(13px, 1.5vw, 13px)",
                color: "rgba(255, 255, 255, 0.88)",
              }}
            >
              {eventBanner.subtitle}
            </div>
          </div>
        ) : null}
        {energyDiagram ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              left: "10px",
              bottom: "10px",
              zIndex: 5,
              width: "min(300px, calc(100% - 20px))",
              padding: "10px 12px 8px",
              borderRadius: "14px",
              textAlign: "left",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.9) 100%)",
              border:
                energyDiagram.energy === "exothermic"
                  ? "1px solid rgba(251, 146, 60, 0.4)"
                  : "1px solid rgba(125, 211, 252, 0.4)",
              boxShadow: "0 10px 30px rgba(2, 6, 23, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800 }}>
                ⚡ {energyDiagram.equation}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (energyDiagramTimeoutRef.current) {
                    clearTimeout(energyDiagramTimeoutRef.current);
                    energyDiagramTimeoutRef.current = null;
                  }
                  setEnergyDiagram(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "13px",
                  padding: "0 2px",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                fontSize: "10.5px",
                marginTop: "2px",
                color:
                  energyDiagram.energy === "exothermic" ? "#fdba74" : "#7dd3fc",
                fontWeight: 700,
              }}
            >
              {energyDiagram.energy === "exothermic"
                ? "Exothermic — releases energy"
                : "Endothermic — absorbs energy"}
              {energyDiagram.deltaH !== undefined
                ? ` · ΔH ≈ ${energyDiagram.deltaH} kJ/mol`
                : ""}
            </div>
            {(() => {
              const isExo = energyDiagram.energy === "exothermic";
              const reactantY = isExo ? 52 : 96;
              const productY = isExo ? 96 : 52;
              const peakY = 20;
              const curveColor = isExo ? "#fb923c" : "#7dd3fc";

              return (
                <svg
                  viewBox="0 0 260 132"
                  style={{ width: "100%", display: "block", marginTop: "4px" }}
                >
                  <line x1="26" y1="8" x2="26" y2="118" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
                  <line x1="26" y1="118" x2="250" y2="118" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
                  <text x="14" y="66" fill="rgba(148,163,184,0.8)" fontSize="8" transform="rotate(-90 14 66)" textAnchor="middle">
                    Energy
                  </text>
                  <text x="138" y="129" fill="rgba(148,163,184,0.8)" fontSize="8" textAnchor="middle">
                    Reaction progress
                  </text>
                  <line x1="26" y1={reactantY} x2="196" y2={reactantY} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <line x1="26" y1={productY} x2="240" y2={productY} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <path
                    d={`M30,${reactantY} L62,${reactantY} C92,${reactantY} 100,${peakY} 128,${peakY} C156,${peakY} 164,${productY} 194,${productY} L242,${productY}`}
                    fill="none"
                    stroke={curveColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line x1="128" y1={peakY} x2="128" y2={reactantY} stroke="rgba(226,232,240,0.55)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="133" y={(peakY + reactantY) / 2 + 3} fill="rgba(226,232,240,0.9)" fontSize="9" fontWeight="700">
                    Eₐ
                  </text>
                  <line x1="228" y1={reactantY} x2="228" y2={productY} stroke={curveColor} strokeWidth="1.25" />
                  <text x="233" y={(reactantY + productY) / 2 + 3} fill={curveColor} fontSize="9" fontWeight="700">
                    ΔH
                  </text>
                  <text x="30" y={reactantY - 5} fill="rgba(226,232,240,0.75)" fontSize="8.5">
                    reactants
                  </text>
                  <text x="196" y={productY - 5} fill="rgba(226,232,240,0.75)" fontSize="8.5">
                    products
                  </text>
                </svg>
              );
            })()}
          </div>
        ) : null}
        {moleculePrompt ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "clamp(14px, 2vw, 16px)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(9px, 1.5vw, 10px)",
              alignItems: "center",
              padding: "clamp(13px, 1.8vw, 14px) clamp(14px, 2vw, 16px)",
              minWidth: "min(260px, calc(100% - 24px))",
              maxWidth: "calc(100% - 24px)",
              background: "rgba(15, 23, 42, 0.84)",
              border: "1px solid rgba(125, 211, 252, 0.35)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.28)",
              zIndex: 3,
            }}
            >
              <div style={{ fontSize: "clamp(14px, 1.8vw, 15px)", fontWeight: 700 }}>
              {moleculePrompt.kind === "generic" || moleculePrompt.kind === "genericReaction"
                ? moleculePrompt.promptText
                : moleculePrompt.kind === "reaction" && moleculePrompt.type === "carbonicAcid"
                ? "Form carbonic acid (H2CO3)?"
                : moleculePrompt.kind === "cluster" && moleculePrompt.type === "waterDimer"
                ? "Would you like to form 2H2O?"
                : moleculePrompt.type === "hydrogen"
                ? "Would you like to make hydrogen gas (H2)?"
                : moleculePrompt.type === "carbonMonoxide"
                ? "Would you like to make carbon monoxide (CO)?"
                : moleculePrompt.type === "oxygen"
                ? "Would you like to make oxygen gas (O2)?"
                : moleculePrompt.type === "nitrogen"
                ? "Would you like to make nitrogen gas (N2)?"
                : moleculePrompt.type === "carbonDioxide"
                ? "Would you like to make carbon dioxide (CO2)?"
                : moleculePrompt.type === "ammonia"
                  ? "Would you like to make ammonia (NH3)?"
                : moleculePrompt.type === "methane"
                  ? "Would you like to make methane (CH4)?"
                : moleculePrompt.type === "hydronium"
                  ? "Form hydronium (H3O⁺)? This ion carries a +1 charge!"
                : moleculePrompt.type === "ammonium"
                  ? "Form ammonium (NH4⁺)? This ion carries a +1 charge!"
                : moleculePrompt.type === "sodiumChloride"
                  ? "Form sodium chloride (NaCl)? Na gives its electron to Cl — an ionic bond!"
                  : "Would you like to make water (H2O)?"}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                ref={yesButtonRef}
                type="button"
                onClick={() => confirmMoleculeFormation(moleculePrompt)}
                style={{
                  minWidth: "88px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(134, 239, 172, 0.35)",
                  background: "rgba(22, 163, 74, 0.18)",
                  color: "#dcfce7",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Yes
              </button>
              <button
                ref={noButtonRef}
                type="button"
                onClick={() => declineMoleculeFormation(moleculePrompt)}
                style={{
                  minWidth: "88px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  background: "rgba(185, 28, 28, 0.18)",
                  color: "#fecaca",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                No
              </button>
            </div>
          </div>
        ) : null}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "12px",
            transform: "scaleX(-1)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            overflow: "hidden",
            borderRadius: "12px",
          }}
        >
          {waterOverlayMolecules.map((molecule) => {
            const hydrogenBondCount = waterOverlayHydrogenBonds.counts.get(molecule.id) ?? 0;
            const radius = getWaterDropletDisplayRadius(molecule, hydrogenBondCount);
            const overlayStyle = getWaterDropletOverlayStyle(molecule, hydrogenBondCount);

            return (
              <div
                key={molecule.id}
                style={{
                  position: "absolute",
                  ...overlayStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: `${-30 * atomSizeScale}px`,
                    transform: "translateX(-50%)",
                    background: "linear-gradient(90deg, rgba(190, 245, 255, 0.82) 0%, rgba(127, 231, 255, 0.96) 50%, rgba(77, 196, 255, 0.84) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    opacity: 0.92,
                    fontSize: `${14 * atomSizeScale}px`,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textShadow:
                      "0 0 6px rgba(0, 200, 255, 0.6), 0 0 12px rgba(0, 120, 255, 0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {molecule.displayLabel}
                </div>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "999px",
                    overflow: "hidden",
                    backdropFilter: "blur(4px) saturate(1.08)",
                    background:
                      "radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.7) 0%, rgba(222, 247, 255, 0.42) 18%, rgba(109, 197, 255, 0.18) 40%, rgba(20, 119, 186, 0.2) 68%, rgba(4, 50, 99, 0.38) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.38)",
                    transform: `scale(${1 + hydrogenBondCount * 0.04})`,
                    boxShadow: `
                      inset 0 1px 0 rgba(255, 255, 255, 0.5),
                      inset 0 -14px 24px rgba(1, 55, 115, 0.24),
                      0 8px 18px rgba(11, 64, 121, 0.18),
                      0 0 ${14 + hydrogenBondCount * 8}px rgba(125, 211, 252, ${0.08 + hydrogenBondCount * 0.04})
                    `,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: `${Math.max(2, radius * 0.05)}px`,
                      borderRadius: "999px",
                      background: `
                        radial-gradient(circle at 36% 32%, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.08) 18%, rgba(255, 255, 255, 0) 46%),
                        radial-gradient(circle at 54% 70%, rgba(27, 156, 229, 0.36) 0%, rgba(10, 110, 187, 0.26) 34%, rgba(4, 66, 120, 0.12) 62%, rgba(4, 66, 120, 0) 100%),
                        conic-gradient(from 210deg at 52% 54%, rgba(255, 255, 255, 0) 0deg, rgba(147, 220, 255, 0.2) 60deg, rgba(10, 107, 183, 0.34) 170deg, rgba(255, 255, 255, 0.08) 240deg, rgba(255, 255, 255, 0) 360deg)
                      `,
                      filter: "blur(0.4px) saturate(1.2)",
                      animation: `waterOrbSwirl ${8 + (molecule.id % 3)}s ease-in-out infinite`,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-8%",
                        right: "-8%",
                        bottom: "14%",
                        height: "48%",
                        borderRadius: "50%",
                        background:
                          "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.18) 0%, rgba(129, 212, 250, 0.16) 18%, rgba(10, 93, 165, 0.22) 58%, rgba(4, 46, 94, 0.32) 100%)",
                        filter: "blur(1px)",
                        opacity: 0.9,
                        animation: `waterOrbWave ${10 + (molecule.id % 2)}s ease-in-out infinite`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "999px",
                      background: `
                        radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.72) 7%, rgba(255, 255, 255, 0.12) 17%, rgba(255, 255, 255, 0) 28%),
                        radial-gradient(circle at 60% 16%, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 18%),
                        linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 42%)
                      `,
                      mixBlendMode: "screen",
                      animation: "waterOrbHighlight 7.2s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "999px",
                      background: `
                        radial-gradient(circle at 50% 115%, rgba(2, 35, 81, 0.78) 0%, rgba(7, 77, 144, 0.4) 36%, rgba(7, 77, 144, 0.16) 58%, rgba(7, 77, 144, 0) 78%),
                        radial-gradient(circle at 72% 82%, rgba(0, 44, 93, 0.28) 0%, rgba(0, 44, 93, 0) 34%)
                      `,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: "12px",
            pointerEvents: "none",
            transform: "scaleX(-1)",
            zIndex: 0,
          }}
        />
      {atomicExpansionDetails ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            pointerEvents: "none",
            overflow: "hidden",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: `${atomicExpansionModelCenterX}px`,
              top: `${atomicExpansionModelCenterY}px`,
              width: `${atomicExpansionModelSizePx}px`,
              height: `${atomicExpansionModelSizePx}px`,
              transform: `translate(-50%, -50%) scale(${atomicExpansionCollapseGesture.isClosing ? 0.94 : 1})`,
              opacity: atomicExpansionCollapseGesture.isClosing ? 0.72 : 1,
              transition: "transform 180ms ease, opacity 180ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-16% -16%",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at center, rgba(8, 47, 73, 0.12) 0%, rgba(8, 47, 73, 0.08) 36%, rgba(8, 47, 73, 0.02) 54%, rgba(8, 47, 73, 0) 72%)",
                opacity: atomicExpansionContentOpacity,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "68%",
                height: "68%",
                borderRadius: "999px",
                border: "2px solid rgba(103, 232, 249, 0.45)",
                boxShadow:
                  `0 0 ${28 + atomicExpansionShellGlow * 18}px rgba(34, 211, 238, ${0.14 + atomicExpansionShellGlow * 0.18}), inset 0 0 ${36 + atomicExpansionShellGlow * 16}px rgba(34, 211, 238, ${0.06 + atomicExpansionShellGlow * 0.14})`,
                opacity:
                  atomicExpansionContentOpacity *
                  (atomicExpansionCollapseGesture.isClosing ? 0.5 : 1),
                transition: "transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
                transform: `translate(-50%, -50%) scale(${atomicExpansionShellScale})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "82%",
                height: "82%",
                borderRadius: "999px",
                border: "1px dashed rgba(148, 163, 184, 0.18)",
                opacity:
                  atomicExpansionContentOpacity *
                  (atomicExpansionCollapseGesture.isClosing ? 0.24 : 1),
                transition: "transform 180ms ease, opacity 180ms ease",
                transform: `translate(-50%, -50%) scale(${1 - (1 - atomicExpansionShellScale) * 0.55})`,
              }}
            />
            {Array.from(
              { length: atomicExpansionDetails.valenceElectrons },
              (_, index) => {
                const orbitRadiusPx =
                  atomicExpansionModelSizePx * 0.34 * atomicExpansionShellScale;

                return (
                  <div
                    key={`e-${index}`}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 0,
                      height: 0,
                      opacity:
                        atomicExpansionContentOpacity *
                        (atomicExpansionCollapseGesture.isClosing ? 0.2 : 1),
                      transform: `translate(-50%, -50%) rotate(${(index / atomicExpansionDetails.valenceElectrons) * 360}deg)`,
                      animation: "atomicElectronOrbit 6.4s linear infinite",
                      animationDelay: `${(-6.4 * index) / atomicExpansionDetails.valenceElectrons}s`,
                      transition: "opacity 180ms ease",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "999px",
                        transform: `translate(${orbitRadiusPx}px, -7px)`,
                        background: "#67e8f9",
                        boxShadow:
                          "0 0 12px rgba(103, 232, 249, 0.95), 0 0 28px rgba(34, 211, 238, 0.6)",
                      }}
                    />
                  </div>
                );
              }
            )}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "29%",
                height: "29%",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(148, 163, 184, 0.06) 42%, rgba(15, 23, 42, 0) 75%)",
                filter: "blur(4px)",
                opacity:
                  atomicExpansionContentOpacity *
                  (atomicExpansionCollapseGesture.isClosing ? 0.32 : 1),
                transition: "transform 180ms ease, opacity 180ms ease",
                transform: `translate(-50%, -50%) scale(${1 - (1 - atomicExpansionShellScale) * 0.35})`,
              }}
            />
            {atomicExpansionNucleusParticles.map((particle) => (
              <div
                key={particle.id}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: particle.kind === "proton" ? "22px" : "20px",
                  height: particle.kind === "proton" ? "22px" : "20px",
                  marginLeft: particle.kind === "proton" ? "-11px" : "-10px",
                  marginTop: particle.kind === "proton" ? "-11px" : "-10px",
                  borderRadius: "999px",
                  transform: `translate(${particle.x * atomicExpansionParticleScale}px, ${particle.y * atomicExpansionParticleScale}px)`,
                  opacity: atomicExpansionContentOpacity,
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
            ))}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "clamp(14px, 2vw, 18px)",
                fontWeight: 700,
                color: "rgba(226, 232, 240, 0.82)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                opacity: atomicExpansionContentOpacity * 0.92,
              }}
            >
              Nucleus
            </div>
          </div>
        </div>
      ) : null}
          </div>
        </div>
        {atomicExpansionDetails ? (
          <div
            aria-hidden="true"
            style={{
              width: "min(100%, 620px)",
              margin: "0 auto",
              padding: "clamp(14px, 2vw, 16px) clamp(16px, 2.4vw, 22px)",
              borderRadius: "20px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              background: "rgba(7, 20, 39, 0.48)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "0 14px 30px rgba(2, 6, 23, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.07)",
              textAlign: "center",
              opacity: atomicExpansionInfoOpacity,
            }}
          >
            <div
              style={{
                fontSize: "clamp(11px, 1.3vw, 11px)",
                opacity: 0.68,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Atomic Expansion Mode
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "clamp(22px, 3.5vw, 30px)",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              {atomicExpansionDetails.name}
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "clamp(14px, 1.9vw, 18px)",
                color: "#8be9ff",
                fontWeight: 700,
                letterSpacing: "0.14em",
              }}
            >
              {atomicExpansionDetails.symbol}
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "clamp(12px, 2vw, 18px)",
                flexWrap: "wrap",
                fontSize: "clamp(12px, 1.45vw, 13px)",
                lineHeight: 1.5,
                color: "rgba(226, 232, 240, 0.92)",
              }}
            >
              <div>Protons: {atomicExpansionDetails.atomicNumber}</div>
              <div>Neutrons: {atomicExpansionDetails.neutrons}</div>
              <div>Electrons: {atomicExpansionDetails.atomicNumber}</div>
            </div>
            <div
              style={{
                marginTop: "10px",
                fontSize: "clamp(12px, 1.3vw, 12px)",
                opacity: 0.72,
              }}
            >
              Press Escape to return
            </div>
          </div>
        ) : null}
      </div>
      </div>
      </div>
    </div>
  );
}

export default App;
