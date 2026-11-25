// Element data for all 118 elements.
//
// Sources (fetched and cross-checked when this file was generated):
// - Standard atomic weights: IUPAC/CIAAW abridged values (ciaaw.org,
//   "Abridged standard atomic weights"). null = no standard atomic weight
//   (no stable isotopes / no characteristic terrestrial composition).
// - Isotope shown: NIST "Atomic Weights and Isotopic Compositions" — the most
//   abundant natural isotope, or for radioactive elements the longest-lived
//   isotope (NIST bracketed mass number; PubChem for Z >= 95, where values
//   are less certain).
// - Pauling electronegativity: PubChem periodic table (null = none assigned,
//   e.g. He, Ne, Ar).
// - Ground-state configurations: NIST Atomic Spectra Database ground levels,
//   cross-checked against PubChem (they agree for every element except Lr,
//   where NIST's 7s2 7p1 is used). Z >= 104 are theoretical predictions.
//
// Row: [Z, symbol, name, period, group (null = f-block), category,
//       standard atomic weight, mass number of isotope shown, isotope basis
//       ("abundant" | "longest"), Pauling electronegativity, configuration]
const ELEMENT_ROWS = [
  [1, "H", "Hydrogen", 1, 1, "nonmetal", "1.0080", 1, "abundant", 2.2, "1s1"],
  [2, "He", "Helium", 1, 18, "noble-gas", "4.0026", 4, "abundant", null, "1s2"],
  [3, "Li", "Lithium", 2, 1, "alkali-metal", "6.94", 7, "abundant", 0.98, "[He] 2s1"],
  [4, "Be", "Beryllium", 2, 2, "alkaline-earth-metal", "9.0122", 9, "abundant", 1.57, "[He] 2s2"],
  [5, "B", "Boron", 2, 13, "metalloid", "10.81", 11, "abundant", 2.04, "[He] 2s2 2p1"],
  [6, "C", "Carbon", 2, 14, "nonmetal", "12.011", 12, "abundant", 2.55, "[He] 2s2 2p2"],
  [7, "N", "Nitrogen", 2, 15, "nonmetal", "14.007", 14, "abundant", 3.04, "[He] 2s2 2p3"],
  [8, "O", "Oxygen", 2, 16, "nonmetal", "15.999", 16, "abundant", 3.44, "[He] 2s2 2p4"],
  [9, "F", "Fluorine", 2, 17, "halogen", "18.998", 19, "abundant", 3.98, "[He] 2s2 2p5"],
  [10, "Ne", "Neon", 2, 18, "noble-gas", "20.180", 20, "abundant", null, "[He] 2s2 2p6"],
  [11, "Na", "Sodium", 3, 1, "alkali-metal", "22.990", 23, "abundant", 0.93, "[Ne] 3s1"],
  [12, "Mg", "Magnesium", 3, 2, "alkaline-earth-metal", "24.305", 24, "abundant", 1.31, "[Ne] 3s2"],
  [13, "Al", "Aluminium", 3, 13, "post-transition-metal", "26.982", 27, "abundant", 1.61, "[Ne] 3s2 3p1"],
  [14, "Si", "Silicon", 3, 14, "metalloid", "28.085", 28, "abundant", 1.9, "[Ne] 3s2 3p2"],
  [15, "P", "Phosphorus", 3, 15, "nonmetal", "30.974", 31, "abundant", 2.19, "[Ne] 3s2 3p3"],
  [16, "S", "Sulfur", 3, 16, "nonmetal", "32.06", 32, "abundant", 2.58, "[Ne] 3s2 3p4"],
  [17, "Cl", "Chlorine", 3, 17, "halogen", "35.45", 35, "abundant", 3.16, "[Ne] 3s2 3p5"],
  [18, "Ar", "Argon", 3, 18, "noble-gas", "39.95", 40, "abundant", null, "[Ne] 3s2 3p6"],
  [19, "K", "Potassium", 4, 1, "alkali-metal", "39.098", 39, "abundant", 0.82, "[Ar] 4s1"],
  [20, "Ca", "Calcium", 4, 2, "alkaline-earth-metal", "40.078", 40, "abundant", 1.0, "[Ar] 4s2"],
  [21, "Sc", "Scandium", 4, 3, "transition-metal", "44.956", 45, "abundant", 1.36, "[Ar] 3d1 4s2"],
  [22, "Ti", "Titanium", 4, 4, "transition-metal", "47.867", 48, "abundant", 1.54, "[Ar] 3d2 4s2"],
  [23, "V", "Vanadium", 4, 5, "transition-metal", "50.942", 51, "abundant", 1.63, "[Ar] 3d3 4s2"],
  [24, "Cr", "Chromium", 4, 6, "transition-metal", "51.996", 52, "abundant", 1.66, "[Ar] 3d5 4s1"],
  [25, "Mn", "Manganese", 4, 7, "transition-metal", "54.938", 55, "abundant", 1.55, "[Ar] 3d5 4s2"],
  [26, "Fe", "Iron", 4, 8, "transition-metal", "55.845", 56, "abundant", 1.83, "[Ar] 3d6 4s2"],
  [27, "Co", "Cobalt", 4, 9, "transition-metal", "58.933", 59, "abundant", 1.88, "[Ar] 3d7 4s2"],
  [28, "Ni", "Nickel", 4, 10, "transition-metal", "58.693", 58, "abundant", 1.91, "[Ar] 3d8 4s2"],
  [29, "Cu", "Copper", 4, 11, "transition-metal", "63.546", 63, "abundant", 1.9, "[Ar] 3d10 4s1"],
  [30, "Zn", "Zinc", 4, 12, "transition-metal", "65.38", 64, "abundant", 1.65, "[Ar] 3d10 4s2"],
  [31, "Ga", "Gallium", 4, 13, "post-transition-metal", "69.723", 69, "abundant", 1.81, "[Ar] 3d10 4s2 4p1"],
  [32, "Ge", "Germanium", 4, 14, "metalloid", "72.630", 74, "abundant", 2.01, "[Ar] 3d10 4s2 4p2"],
  [33, "As", "Arsenic", 4, 15, "metalloid", "74.922", 75, "abundant", 2.18, "[Ar] 3d10 4s2 4p3"],
  [34, "Se", "Selenium", 4, 16, "nonmetal", "78.971", 80, "abundant", 2.55, "[Ar] 3d10 4s2 4p4"],
  [35, "Br", "Bromine", 4, 17, "halogen", "79.904", 79, "abundant", 2.96, "[Ar] 3d10 4s2 4p5"],
  [36, "Kr", "Krypton", 4, 18, "noble-gas", "83.798", 84, "abundant", 3.0, "[Ar] 3d10 4s2 4p6"],
  [37, "Rb", "Rubidium", 5, 1, "alkali-metal", "85.468", 85, "abundant", 0.82, "[Kr] 5s1"],
  [38, "Sr", "Strontium", 5, 2, "alkaline-earth-metal", "87.62", 88, "abundant", 0.95, "[Kr] 5s2"],
  [39, "Y", "Yttrium", 5, 3, "transition-metal", "88.906", 89, "abundant", 1.22, "[Kr] 4d1 5s2"],
  [40, "Zr", "Zirconium", 5, 4, "transition-metal", "91.222", 90, "abundant", 1.33, "[Kr] 4d2 5s2"],
  [41, "Nb", "Niobium", 5, 5, "transition-metal", "92.906", 93, "abundant", 1.6, "[Kr] 4d4 5s1"],
  [42, "Mo", "Molybdenum", 5, 6, "transition-metal", "95.95", 98, "abundant", 2.16, "[Kr] 4d5 5s1"],
  [43, "Tc", "Technetium", 5, 7, "transition-metal", null, 98, "longest", 1.9, "[Kr] 4d5 5s2"],
  [44, "Ru", "Ruthenium", 5, 8, "transition-metal", "101.07", 102, "abundant", 2.2, "[Kr] 4d7 5s1"],
  [45, "Rh", "Rhodium", 5, 9, "transition-metal", "102.91", 103, "abundant", 2.28, "[Kr] 4d8 5s1"],
  [46, "Pd", "Palladium", 5, 10, "transition-metal", "106.42", 106, "abundant", 2.2, "[Kr] 4d10"],
  [47, "Ag", "Silver", 5, 11, "transition-metal", "107.87", 107, "abundant", 1.93, "[Kr] 4d10 5s1"],
  [48, "Cd", "Cadmium", 5, 12, "transition-metal", "112.41", 114, "abundant", 1.69, "[Kr] 4d10 5s2"],
  [49, "In", "Indium", 5, 13, "post-transition-metal", "114.82", 115, "abundant", 1.78, "[Kr] 4d10 5s2 5p1"],
  [50, "Sn", "Tin", 5, 14, "post-transition-metal", "118.71", 120, "abundant", 1.96, "[Kr] 4d10 5s2 5p2"],
  [51, "Sb", "Antimony", 5, 15, "metalloid", "121.76", 121, "abundant", 2.05, "[Kr] 4d10 5s2 5p3"],
  [52, "Te", "Tellurium", 5, 16, "metalloid", "127.60", 130, "abundant", 2.1, "[Kr] 4d10 5s2 5p4"],
  [53, "I", "Iodine", 5, 17, "halogen", "126.90", 127, "abundant", 2.66, "[Kr] 4d10 5s2 5p5"],
  [54, "Xe", "Xenon", 5, 18, "noble-gas", "131.29", 132, "abundant", 2.6, "[Kr] 4d10 5s2 5p6"],
  [55, "Cs", "Caesium", 6, 1, "alkali-metal", "132.91", 133, "abundant", 0.79, "[Xe] 6s1"],
  [56, "Ba", "Barium", 6, 2, "alkaline-earth-metal", "137.33", 138, "abundant", 0.89, "[Xe] 6s2"],
  [57, "La", "Lanthanum", 6, null, "lanthanide", "138.91", 139, "abundant", 1.1, "[Xe] 5d1 6s2"],
  [58, "Ce", "Cerium", 6, null, "lanthanide", "140.12", 140, "abundant", 1.12, "[Xe] 4f1 5d1 6s2"],
  [59, "Pr", "Praseodymium", 6, null, "lanthanide", "140.91", 141, "abundant", 1.13, "[Xe] 4f3 6s2"],
  [60, "Nd", "Neodymium", 6, null, "lanthanide", "144.24", 142, "abundant", 1.14, "[Xe] 4f4 6s2"],
  [61, "Pm", "Promethium", 6, null, "lanthanide", null, 145, "longest", null, "[Xe] 4f5 6s2"],
  [62, "Sm", "Samarium", 6, null, "lanthanide", "150.36", 152, "abundant", 1.17, "[Xe] 4f6 6s2"],
  [63, "Eu", "Europium", 6, null, "lanthanide", "151.96", 153, "abundant", null, "[Xe] 4f7 6s2"],
  [64, "Gd", "Gadolinium", 6, null, "lanthanide", "157.25", 158, "abundant", 1.2, "[Xe] 4f7 5d1 6s2"],
  [65, "Tb", "Terbium", 6, null, "lanthanide", "158.93", 159, "abundant", null, "[Xe] 4f9 6s2"],
  [66, "Dy", "Dysprosium", 6, null, "lanthanide", "162.50", 164, "abundant", 1.22, "[Xe] 4f10 6s2"],
  [67, "Ho", "Holmium", 6, null, "lanthanide", "164.93", 165, "abundant", 1.23, "[Xe] 4f11 6s2"],
  [68, "Er", "Erbium", 6, null, "lanthanide", "167.26", 166, "abundant", 1.24, "[Xe] 4f12 6s2"],
  [69, "Tm", "Thulium", 6, null, "lanthanide", "168.93", 169, "abundant", 1.25, "[Xe] 4f13 6s2"],
  [70, "Yb", "Ytterbium", 6, null, "lanthanide", "173.05", 174, "abundant", null, "[Xe] 4f14 6s2"],
  [71, "Lu", "Lutetium", 6, null, "lanthanide", "174.97", 175, "abundant", 1.27, "[Xe] 4f14 5d1 6s2"],
  [72, "Hf", "Hafnium", 6, 4, "transition-metal", "178.49", 180, "abundant", 1.3, "[Xe] 4f14 5d2 6s2"],
  [73, "Ta", "Tantalum", 6, 5, "transition-metal", "180.95", 181, "abundant", 1.5, "[Xe] 4f14 5d3 6s2"],
  [74, "W", "Tungsten", 6, 6, "transition-metal", "183.84", 184, "abundant", 2.36, "[Xe] 4f14 5d4 6s2"],
  [75, "Re", "Rhenium", 6, 7, "transition-metal", "186.21", 187, "abundant", 1.9, "[Xe] 4f14 5d5 6s2"],
  [76, "Os", "Osmium", 6, 8, "transition-metal", "190.23", 192, "abundant", 2.2, "[Xe] 4f14 5d6 6s2"],
  [77, "Ir", "Iridium", 6, 9, "transition-metal", "192.22", 193, "abundant", 2.2, "[Xe] 4f14 5d7 6s2"],
  [78, "Pt", "Platinum", 6, 10, "transition-metal", "195.08", 195, "abundant", 2.28, "[Xe] 4f14 5d9 6s1"],
  [79, "Au", "Gold", 6, 11, "transition-metal", "196.97", 197, "abundant", 2.54, "[Xe] 4f14 5d10 6s1"],
  [80, "Hg", "Mercury", 6, 12, "transition-metal", "200.59", 202, "abundant", 2.0, "[Xe] 4f14 5d10 6s2"],
  [81, "Tl", "Thallium", 6, 13, "post-transition-metal", "204.38", 205, "abundant", 1.62, "[Xe] 4f14 5d10 6s2 6p1"],
  [82, "Pb", "Lead", 6, 14, "post-transition-metal", "207.2", 208, "abundant", 2.33, "[Xe] 4f14 5d10 6s2 6p2"],
  [83, "Bi", "Bismuth", 6, 15, "post-transition-metal", "208.98", 209, "abundant", 2.02, "[Xe] 4f14 5d10 6s2 6p3"],
  [84, "Po", "Polonium", 6, 16, "metalloid", null, 209, "longest", 2.0, "[Xe] 4f14 5d10 6s2 6p4"],
  [85, "At", "Astatine", 6, 17, "halogen", null, 210, "longest", 2.2, "[Xe] 4f14 5d10 6s2 6p5"],
  [86, "Rn", "Radon", 6, 18, "noble-gas", null, 222, "longest", null, "[Xe] 4f14 5d10 6s2 6p6"],
  [87, "Fr", "Francium", 7, 1, "alkali-metal", null, 223, "longest", 0.7, "[Rn] 7s1"],
  [88, "Ra", "Radium", 7, 2, "alkaline-earth-metal", null, 226, "longest", 0.9, "[Rn] 7s2"],
  [89, "Ac", "Actinium", 7, null, "actinide", null, 227, "longest", 1.1, "[Rn] 6d1 7s2"],
  [90, "Th", "Thorium", 7, null, "actinide", "232.04", 232, "abundant", 1.3, "[Rn] 6d2 7s2"],
  [91, "Pa", "Protactinium", 7, null, "actinide", "231.04", 231, "abundant", 1.5, "[Rn] 5f2 6d1 7s2"],
  [92, "U", "Uranium", 7, null, "actinide", "238.03", 238, "abundant", 1.38, "[Rn] 5f3 6d1 7s2"],
  [93, "Np", "Neptunium", 7, null, "actinide", null, 237, "longest", 1.36, "[Rn] 5f4 6d1 7s2"],
  [94, "Pu", "Plutonium", 7, null, "actinide", null, 244, "longest", 1.28, "[Rn] 5f6 7s2"],
  [95, "Am", "Americium", 7, null, "actinide", null, 243, "longest", 1.3, "[Rn] 5f7 7s2"],
  [96, "Cm", "Curium", 7, null, "actinide", null, 247, "longest", 1.3, "[Rn] 5f7 6d1 7s2"],
  [97, "Bk", "Berkelium", 7, null, "actinide", null, 247, "longest", 1.3, "[Rn] 5f9 7s2"],
  [98, "Cf", "Californium", 7, null, "actinide", null, 251, "longest", 1.3, "[Rn] 5f10 7s2"],
  [99, "Es", "Einsteinium", 7, null, "actinide", null, 252, "longest", 1.3, "[Rn] 5f11 7s2"],
  [100, "Fm", "Fermium", 7, null, "actinide", null, 257, "longest", 1.3, "[Rn] 5f12 7s2"],
  [101, "Md", "Mendelevium", 7, null, "actinide", null, 258, "longest", 1.3, "[Rn] 5f13 7s2"],
  [102, "No", "Nobelium", 7, null, "actinide", null, 259, "longest", 1.3, "[Rn] 5f14 7s2"],
  [103, "Lr", "Lawrencium", 7, null, "actinide", null, 266, "longest", 1.3, "[Rn] 5f14 7s2 7p1"],
  [104, "Rf", "Rutherfordium", 7, 4, "transition-metal", null, 267, "longest", null, "[Rn] 5f14 6d2 7s2"],
  [105, "Db", "Dubnium", 7, 5, "transition-metal", null, 268, "longest", null, "[Rn] 5f14 6d3 7s2"],
  [106, "Sg", "Seaborgium", 7, 6, "transition-metal", null, 269, "longest", null, "[Rn] 5f14 6d4 7s2"],
  [107, "Bh", "Bohrium", 7, 7, "transition-metal", null, 270, "longest", null, "[Rn] 5f14 6d5 7s2"],
  [108, "Hs", "Hassium", 7, 8, "transition-metal", null, 269, "longest", null, "[Rn] 5f14 6d6 7s2"],
  [109, "Mt", "Meitnerium", 7, 9, "transition-metal", null, 277, "longest", null, "[Rn] 5f14 6d7 7s2"],
  [110, "Ds", "Darmstadtium", 7, 10, "transition-metal", null, 282, "longest", null, "[Rn] 5f14 6d8 7s2"],
  [111, "Rg", "Roentgenium", 7, 11, "transition-metal", null, 282, "longest", null, "[Rn] 5f14 6d9 7s2"],
  [112, "Cn", "Copernicium", 7, 12, "transition-metal", null, 286, "longest", null, "[Rn] 5f14 6d10 7s2"],
  [113, "Nh", "Nihonium", 7, 13, "post-transition-metal", null, 286, "longest", null, "[Rn] 5f14 6d10 7s2 7p1"],
  [114, "Fl", "Flerovium", 7, 14, "post-transition-metal", null, 290, "longest", null, "[Rn] 5f14 6d10 7s2 7p2"],
  [115, "Mc", "Moscovium", 7, 15, "post-transition-metal", null, 290, "longest", null, "[Rn] 5f14 6d10 7s2 7p3"],
  [116, "Lv", "Livermorium", 7, 16, "post-transition-metal", null, 293, "longest", null, "[Rn] 5f14 6d10 7s2 7p4"],
  [117, "Ts", "Tennessine", 7, 17, "halogen", null, 294, "longest", null, "[Rn] 5f14 6d10 7s2 7p5"],
  [118, "Og", "Oganesson", 7, 18, "noble-gas", null, 294, "longest", null, "[Rn] 5f14 6d10 7s2 7p6"],
];

const SUPERSCRIPT_DIGITS = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const SUBSHELL_ORDER = { s: 0, p: 1, d: 2, f: 3 };
const NOBLE_CORE_Z = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

const toSuperscript = (value) =>
  String(value)
    .split("")
    .map((digit) => SUPERSCRIPT_DIGITS[digit] ?? digit)
    .join("");

const CONFIG_BY_Z = Object.fromEntries(ELEMENT_ROWS.map((row) => [row[0], row[10]]));

// Expand "[Ar] 3d5 4s1" into an ordered list of { n, l, electrons }.
const expandConfiguration = (configuration) => {
  const occupancy = new Map();
  let remainder = configuration;
  const coreMatch = /^\[(\w+)\]\s*/.exec(configuration);

  if (coreMatch) {
    for (const subshell of expandConfiguration(CONFIG_BY_Z[NOBLE_CORE_Z[coreMatch[1]]])) {
      occupancy.set(`${subshell.n}${subshell.l}`, subshell);
    }
    remainder = configuration.slice(coreMatch[0].length);
  }

  for (const [, n, l, electrons] of remainder.matchAll(/(\d)([spdf])(\d+)/g)) {
    occupancy.set(`${n}${l}`, { n: Number(n), l, electrons: Number(electrons) });
  }

  return [...occupancy.values()].sort(
    (left, right) => left.n - right.n || SUBSHELL_ORDER[left.l] - SUBSHELL_ORDER[right.l]
  );
};

export const formatConfiguration = (configuration) =>
  configuration
    .replace(/(\d)([spdf])(\d+)/g, (_, n, l, electrons) => `${n}${l}${toSuperscript(electrons)}`)
    .replace(/\]\s*/, "] ");

const formatSubshells = (subshells) =>
  subshells.map(({ n, l, electrons }) => `${n}${l}${toSuperscript(electrons)}`).join(" ");

// Valence electrons: main-group = s + p electrons of the outer shell
// (group number convention); d-block = ns + (n-1)d (group number, group 12
// counted as 2); f-block varies, so none is claimed.
const getValenceElectrons = (z, group) => {
  if (z === 2) return 2;
  if (group === null) return null;
  if (group <= 2) return group;
  if (group <= 11) return group;
  if (group === 12) return 2;
  return group - 10;
};

// Lab bonding model. Only elements whose everyday bonding the lab can show
// honestly are allowed to bond:
// - covalent: main-group nonmetals/metalloids, limited to their common
//   valence; some have a higher limit that applies only with specific
//   partners (see EXPANDED_BONDING);
// - ionic: alkali / alkaline-earth metals, which (like sodium) never share
//   electrons — they only pair with halides, oxide or sulfide;
// - none: He, Ne, Ar (no stable compounds), and elements whose bonding a
//   stick-and-ball lab can't represent truthfully.
// Limits are in bond order (a double bond uses 2).
const COVALENT_BOND_LIMITS = {
  H: 1, Be: 2, B: 3, C: 4, N: 3, O: 2, F: 1, Si: 4, P: 3, S: 2, Cl: 1,
  Ge: 4, As: 3, Se: 2, Br: 1, Sb: 3, Te: 2, I: 1, Xe: 0, Kr: 0,
};

// Higher limits that apply only when EVERY partner of the atom is one of the
// listed elements. Each is justified by a real compound the lab includes;
// the limit is never higher than that compound needs. Second-row atoms
// never pass an octet: N and O only gain the dative bond that makes NH4+
// and H3O+ (from H+), C and F get no extra capacity at all.
const EXPANDED_BONDING = {
  N: { maxBonds: 4, partners: ["H"], compounds: "NH₄⁺" },
  O: { maxBonds: 3, partners: ["H"], compounds: "H₃O⁺" },
  P: { maxBonds: 5, partners: ["F", "Cl", "O"], compounds: "PCl₅, PF₅, H₃PO₄" },
  S: { maxBonds: 6, partners: ["F", "O"], compounds: "SF₆, SO₃, H₂SO₄" },
  Cl: { maxBonds: 3, partners: ["F"], compounds: "ClF₃" },
  I: { maxBonds: 7, partners: ["F"], compounds: "IF₅, IF₇" },
  Xe: { maxBonds: 6, partners: ["F", "O"], compounds: "XeF₂, XeF₄, XeO₃" },
  Kr: { maxBonds: 2, partners: ["F"], compounds: "KrF₂" },
};

// Typical number of bonds shown in the inspector.
const COMMON_COVALENT_BONDS = COVALENT_BOND_LIMITS;
const IONIC_METAL_CHARGES = { Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Mg: 2, Ca: 2, Sr: 2, Ba: 2 };
export const IONIC_PARTNERS = new Set(["F", "Cl", "Br", "I", "O", "S"]);

const NOBLE_GAS_REASONS = {
  He: "Helium forms no stable compounds.",
  Ne: "Neon forms no stable compounds.",
  Ar: "Argon forms no stable compounds.",
  Rn: "Radon compounds are barely studied — not modeled in the lab.",
  Og: "Oganesson's chemistry is unknown — not modeled in the lab.",
};

const getBonding = (symbol, category) => {
  if (COVALENT_BOND_LIMITS[symbol] !== undefined) {
    return {
      kind: "covalent",
      maxBonds: COVALENT_BOND_LIMITS[symbol],
      expanded: EXPANDED_BONDING[symbol] ?? null,
    };
  }
  if (IONIC_METAL_CHARGES[symbol] !== undefined) {
    return { kind: "ionic", maxBonds: IONIC_METAL_CHARGES[symbol], charge: IONIC_METAL_CHARGES[symbol] };
  }
  if (category === "noble-gas") {
    return { kind: "none", reason: NOBLE_GAS_REASONS[symbol] ?? "This noble gas doesn't bond in the lab." };
  }
  return { kind: "none", reason: "Bonding for this element isn't modeled in the lab." };
};

// Neon colors (the 7 original elements keep their exact colors).
const ORIGINAL_NEON_COLORS = {
  H: "#e8f6ff", O: "#ff4d4d", C: "#aeb6c2", N: "#4d7dff", Cl: "#3dff8f", Na: "#c95bff", S: "#ffe14d",
};
const SPECIAL_NEON_COLORS = {
  F: "#b6ff66", Br: "#ff7a45", I: "#b06bff", P: "#ff9a3d", B: "#ffa07a", Si: "#e8c872",
  Fe: "#ff8a4d", Cu: "#ff9a5c", Ag: "#d8e4f0", Au: "#ffd23f", Hg: "#c7d6e6", Pt: "#e0e8f5",
  Zn: "#9fb8d6", Al: "#c9d6e3", Se: "#ffb347", Te: "#e0a060", As: "#c58cf0", Ge: "#7fd6c2",
};
const hslToHex = (hue, saturation, lightness) => {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)]
    .map((x) => Math.round(x * 255).toString(16).padStart(2, "0"))
    .join("")}`;
};
const CATEGORY_HUES = {
  "alkali-metal": [292, 258],
  "alkaline-earth-metal": [88, 150],
  halogen: [120, 330],
  "noble-gas": [180, 228],
  nonmetal: [30, 50],
  metalloid: [20, 200],
  "transition-metal": [195, 235],
  "post-transition-metal": [205, 225],
  lanthanide: [158, 186],
  actinide: [118, 150],
};
const getNeonColor = (symbol, category, indexInCategory, categorySize) => {
  if (ORIGINAL_NEON_COLORS[symbol]) return ORIGINAL_NEON_COLORS[symbol];
  if (SPECIAL_NEON_COLORS[symbol]) return SPECIAL_NEON_COLORS[symbol];
  const [fromHue, toHue] = CATEGORY_HUES[category] ?? [200, 220];
  const t = categorySize > 1 ? indexInCategory / (categorySize - 1) : 0;
  const metallic = category === "transition-metal" || category === "post-transition-metal";
  return hslToHex(fromHue + (toHue - fromHue) * t, metallic ? 55 : 95, metallic ? 74 : 68);
};

const categoryCounts = {};
const categoryIndex = (category) => {
  categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
  return categoryCounts[category] - 1;
};
const categorySizes = ELEMENT_ROWS.reduce((sizes, row) => {
  sizes[row[5]] = (sizes[row[5]] ?? 0) + 1;
  return sizes;
}, {});

export const ELEMENTS = ELEMENT_ROWS.map(
  ([number, symbol, name, period, group, category, standardAtomicWeight, massNumber, isotopeBasis, electronegativity, configuration]) => {
    const subshells = expandConfiguration(configuration);
    const shells = [];

    for (const { n, electrons } of subshells) {
      shells[n - 1] = (shells[n - 1] ?? 0) + electrons;
    }

    const bonding = getBonding(symbol, category);
    const isFBlock = group === null;

    return {
      number,
      atomicNumber: number,
      symbol,
      name,
      period,
      group,
      category,
      standardAtomicWeight,
      massNumber,
      neutrons: massNumber - number,
      isotopeBasis,
      electronegativity,
      configuration,
      configurationText: formatConfiguration(configuration),
      fullConfigurationText: formatSubshells(subshells),
      configurationPredicted: number >= 104,
      shells: shells.map((count) => count ?? 0),
      valenceElectrons: getValenceElectrons(number, group),
      bonding,
      commonBonds:
        bonding.kind === "covalent"
          ? COMMON_COVALENT_BONDS[symbol]
          : bonding.kind === "ionic"
            ? bonding.maxBonds
            : null,
      neonColor: getNeonColor(symbol, category, categoryIndex(category), categorySizes[category]),
      // Grid placement for the spawn menu's periodic table: f-block elements
      // (La–Lu, Ac–Lr) sit in two rows below the main table.
      gridRow: isFBlock ? period + 3 : period,
      gridColumn: isFBlock ? 3 + (number - (period === 6 ? 57 : 89)) : group,
    };
  }
);

export const ELEMENTS_BY_SYMBOL = Object.fromEntries(ELEMENTS.map((element) => [element.symbol, element]));
