// Additional molecules and ionic compounds (generated from a checked spec).
//
// Every entry was validated when generated: no two atoms closer than 54 px,
// valence electrons balance exactly (bond pairs + lone pairs + unpaired
// electrons - charge), and the layout's atoms match the formula. Molar
// masses use the CIAAW abridged weights in elements.js. Layouts are 2D views
// of the real 3D shapes (octahedral, trigonal bipyramidal, ... projected with
// a fixed tilt so every position stays readable).
//
// Template extras used by the engine:
//   lonePairAngles: { role: [deg, ...] }  fixed lone-pair directions
//   unpaired:       { role: deg }         a radical's single electron
//   openBonds:      [{ a, x, y }]         faint bond ends of a network solid
//   expandedOctet:  true                  drawn as the textbook expanded octet

export const EXTRA_MOLECULE_TEMPLATES = [
  {
    "type": "ethanol",
    "formula": "C2H5OH",
    "displayLabel": "C2H5OH",
    "composition": {
      "C": 2,
      "O": 1,
      "H": 6
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "C",
        "x": -94,
        "y": 0
      },
      {
        "type": "O",
        "x": 62,
        "y": -62
      },
      {
        "type": "H",
        "x": -130,
        "y": -58
      },
      {
        "type": "H",
        "x": -150,
        "y": 22
      },
      {
        "type": "H",
        "x": -110,
        "y": 64
      },
      {
        "type": "H",
        "x": -12,
        "y": 68
      },
      {
        "type": "H",
        "x": 48,
        "y": 46
      },
      {
        "type": "H",
        "x": 128,
        "y": -50
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2
      },
      {
        "a": 1,
        "b": 3
      },
      {
        "a": 1,
        "b": 4
      },
      {
        "a": 1,
        "b": 5
      },
      {
        "a": 0,
        "b": 6
      },
      {
        "a": 0,
        "b": 7
      },
      {
        "a": 2,
        "b": 8
      }
    ],
    "lonePairs": {
      "2": 2
    },
    "prompt": "Would you like to make ethanol (C₂H₅OH)?"
  },
  {
    "type": "dimethylEther",
    "formula": "CH3OCH3",
    "displayLabel": "CH3OCH3",
    "composition": {
      "O": 1,
      "C": 2,
      "H": 6
    },
    "layout": [
      {
        "type": "O",
        "x": 0,
        "y": 0
      },
      {
        "type": "C",
        "x": -80,
        "y": 40
      },
      {
        "type": "C",
        "x": 80,
        "y": 40
      },
      {
        "type": "H",
        "x": -137,
        "y": 3
      },
      {
        "type": "H",
        "x": -84,
        "y": 108
      },
      {
        "type": "H",
        "x": -141,
        "y": 71
      },
      {
        "type": "H",
        "x": 137,
        "y": 3
      },
      {
        "type": "H",
        "x": 84,
        "y": 108
      },
      {
        "type": "H",
        "x": 141,
        "y": 71
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2
      },
      {
        "a": 1,
        "b": 3
      },
      {
        "a": 1,
        "b": 4
      },
      {
        "a": 1,
        "b": 5
      },
      {
        "a": 2,
        "b": 6
      },
      {
        "a": 2,
        "b": 7
      },
      {
        "a": 2,
        "b": 8
      }
    ],
    "lonePairs": {
      "0": 2
    },
    "prompt": "Would you like to make dimethyl ether (CH₃OCH₃)?"
  },
  {
    "type": "butane",
    "formula": "CH3CH2CH2CH3",
    "displayLabel": "C4H10",
    "composition": {
      "C": 4,
      "H": 10
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "C",
        "x": -90,
        "y": -40
      },
      {
        "type": "C",
        "x": 90,
        "y": -40
      },
      {
        "type": "C",
        "x": 180,
        "y": 0
      },
      {
        "type": "H",
        "x": -145,
        "y": 0
      },
      {
        "type": "H",
        "x": -152,
        "y": -68
      },
      {
        "type": "H",
        "x": -97,
        "y": -108
      },
      {
        "type": "H",
        "x": 39,
        "y": 56
      },
      {
        "type": "H",
        "x": -39,
        "y": 56
      },
      {
        "type": "H",
        "x": 129,
        "y": -96
      },
      {
        "type": "H",
        "x": 51,
        "y": -96
      },
      {
        "type": "H",
        "x": 187,
        "y": 68
      },
      {
        "type": "H",
        "x": 235,
        "y": -40
      },
      {
        "type": "H",
        "x": 242,
        "y": 28
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2
      },
      {
        "a": 2,
        "b": 3
      },
      {
        "a": 1,
        "b": 4
      },
      {
        "a": 1,
        "b": 5
      },
      {
        "a": 1,
        "b": 6
      },
      {
        "a": 0,
        "b": 7
      },
      {
        "a": 0,
        "b": 8
      },
      {
        "a": 2,
        "b": 9
      },
      {
        "a": 2,
        "b": 10
      },
      {
        "a": 3,
        "b": 11
      },
      {
        "a": 3,
        "b": 12
      },
      {
        "a": 3,
        "b": 13
      }
    ],
    "lonePairs": {},
    "prompt": "Would you like to make butane (C₄H₁₀)?"
  },
  {
    "type": "isobutane",
    "formula": "CH(CH3)3",
    "displayLabel": "C4H10",
    "composition": {
      "C": 4,
      "H": 10
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "C",
        "x": 0,
        "y": -90
      },
      {
        "type": "C",
        "x": -80,
        "y": 45
      },
      {
        "type": "C",
        "x": 80,
        "y": 45
      },
      {
        "type": "H",
        "x": 0,
        "y": 68
      },
      {
        "type": "H",
        "x": -59,
        "y": -124
      },
      {
        "type": "H",
        "x": 0,
        "y": -158
      },
      {
        "type": "H",
        "x": 59,
        "y": -124
      },
      {
        "type": "H",
        "x": -81,
        "y": 113
      },
      {
        "type": "H",
        "x": -139,
        "y": 78
      },
      {
        "type": "H",
        "x": -138,
        "y": 10
      },
      {
        "type": "H",
        "x": 81,
        "y": 113
      },
      {
        "type": "H",
        "x": 139,
        "y": 78
      },
      {
        "type": "H",
        "x": 138,
        "y": 10
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2
      },
      {
        "a": 0,
        "b": 3
      },
      {
        "a": 0,
        "b": 4
      },
      {
        "a": 1,
        "b": 5
      },
      {
        "a": 1,
        "b": 6
      },
      {
        "a": 1,
        "b": 7
      },
      {
        "a": 2,
        "b": 8
      },
      {
        "a": 2,
        "b": 9
      },
      {
        "a": 2,
        "b": 10
      },
      {
        "a": 3,
        "b": 11
      },
      {
        "a": 3,
        "b": 12
      },
      {
        "a": 3,
        "b": 13
      }
    ],
    "lonePairs": {},
    "prompt": "Would you like to make isobutane (C₄H₁₀)?"
  },
  {
    "type": "nitricOxide",
    "formula": "NO",
    "displayLabel": "NO",
    "composition": {
      "N": 1,
      "O": 1
    },
    "layout": [
      {
        "type": "N",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 92,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
      }
    ],
    "lonePairs": {
      "0": 1,
      "1": 2
    },
    "lonePairAngles": {
      "0": [
        180
      ]
    },
    "unpaired": {
      "0": -90
    },
    "prompt": "Would you like to make nitric oxide (NO)? It's a radical — one electron is unpaired."
  },
  {
    "type": "nitrogenDioxide",
    "formula": "NO2",
    "displayLabel": "NO2",
    "composition": {
      "N": 1,
      "O": 2
    },
    "layout": [
      {
        "type": "N",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": -84,
        "y": 38
      },
      {
        "type": "O",
        "x": 84,
        "y": 38
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "resonance"
      },
      {
        "a": 0,
        "b": 2,
        "order": "resonance"
      }
    ],
    "lonePairs": {
      "1": 2.5,
      "2": 2.5
    },
    "unpaired": {
      "0": -90
    },
    "prompt": "Would you like to make nitrogen dioxide (NO₂)? It's a radical — one electron is unpaired."
  },
  {
    "type": "silicaNetwork",
    "formula": "SiO2",
    "displayLabel": "SiO2",
    "composition": {
      "Si": 1,
      "O": 2
    },
    "layout": [
      {
        "type": "Si",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": -88,
        "y": 20
      },
      {
        "type": "O",
        "x": 88,
        "y": 20
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2
    },
    "openBonds": [
      {
        "a": 0,
        "x": -30,
        "y": -80
      },
      {
        "a": 0,
        "x": 30,
        "y": -80
      },
      {
        "a": 1,
        "x": -74,
        "y": 38
      },
      {
        "a": 2,
        "x": 74,
        "y": 38
      }
    ],
    "prompt": "Make one formula unit of silicon dioxide (SiO₂)? It's a network solid, not a separate molecule."
  }
];

export const EXTRA_MOLECULE_INFO = {
  "C2H5OH": {
    "name": "Ethanol",
    "molarMass": "46.07",
    "geometry": "Tetrahedral at each C",
    "bondAngle": "~108° (C–C–O)",
    "polarity": "Polar",
    "fact": "The alcohol in drinks — and a widely used fuel.",
    "angleSource": "CCCBDB (exp. 107.8°)",
    "note": "Isomer of dimethyl ether (same formula C₂H₆O, different connections)."
  },
  "CH3OCH3": {
    "name": "Dimethyl ether",
    "molarMass": "46.07",
    "geometry": "Bent at O",
    "bondAngle": "111.7° (C–O–C)",
    "polarity": "Polar",
    "fact": "Same formula as ethanol (C₂H₆O), different connections — and a gas at room temperature.",
    "angleSource": "CCCBDB (exp.)",
    "note": "Isomer of ethanol (same formula C₂H₆O, different connections)."
  },
  "CH3CH2CH2CH3": {
    "name": "Butane",
    "molarMass": "58.12",
    "geometry": "Tetrahedral at each C",
    "bondAngle": "~112° (C–C–C)",
    "polarity": "Nonpolar",
    "fact": "The fuel in disposable lighters.",
    "angleSource": "CCCBDB (exp. 112.4°)",
    "note": "Isomer of isobutane (same formula C₄H₁₀, straight chain)."
  },
  "CH(CH3)3": {
    "name": "Isobutane",
    "molarMass": "58.12",
    "geometry": "Tetrahedral at each C",
    "bondAngle": "~111° (C–C–C)",
    "polarity": "Nonpolar",
    "fact": "Same formula as butane, branched shape — used as the refrigerant R-600a.",
    "angleSource": "CCCBDB (exp. 110.8°)",
    "note": "Also called 2-methylpropane. Isomer of butane (same formula C₄H₁₀, branched)."
  },
  "NO": {
    "name": "Nitric oxide",
    "molarMass": "30.01",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Slightly polar",
    "fact": "A signalling molecule in your body that relaxes blood vessels.",
    "angleSource": "—",
    "note": "Radical: has an unpaired electron.",
    "radical": true
  },
  "NO2": {
    "name": "Nitrogen dioxide",
    "molarMass": "46.01",
    "geometry": "Bent",
    "bondAngle": "134°",
    "polarity": "Slightly polar",
    "fact": "The reddish-brown gas in city smog.",
    "angleSource": "CCCBDB (exp. 134.1°)",
    "note": "Radical: has an unpaired electron. Both N–O bonds are equal (resonance, order 1½).",
    "radical": true
  },
  "SiO2": {
    "name": "Silicon dioxide (quartz)",
    "molarMass": "60.08",
    "geometry": "Network solid — SiO₄ tetrahedra",
    "bondAngle": "109.5° (O–Si–O), ~144° (Si–O–Si)",
    "polarity": "Network solid",
    "fact": "Sand and quartz: every Si bonds to four O, and every O bridges two Si.",
    "angleSource": "Quartz (exp.)",
    "note": "Network solid: no separate SiO₂ molecules exist. This is one formula unit; the faint open bonds continue into the 3-D network."
  }
};

export const EXTRA_DISCOVERABLE_MOLECULES = [
  {
    "formula": "C2H5OH",
    "label": "C₂H₅OH — Ethanol",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH3OCH3",
    "label": "CH₃OCH₃ — Dimethyl ether",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH3CH2CH2CH3",
    "label": "C₄H₁₀ — Butane",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH(CH3)3",
    "label": "C₄H₁₀ — Isobutane",
    "group": "Covalent molecules"
  },
  {
    "formula": "NO",
    "label": "NO — Nitric oxide",
    "group": "Radicals"
  },
  {
    "formula": "NO2",
    "label": "NO₂ — Nitrogen dioxide",
    "group": "Radicals"
  },
  {
    "formula": "SiO2",
    "label": "SiO₂ — Silicon dioxide (quartz)",
    "group": "Network solids"
  }
];

// pH meter shifts (same scale as ACID_BASE_CONTRIBUTIONS): strong acids
// HBr, HI, HNO3, H2SO4 shift like HCl; weak acids (HF, H3PO4, carboxylic
// acids, HOCl, HCN) much less; Group 1/2 oxides and Na2S are basic.
export const EXTRA_ACID_BASE_CONTRIBUTIONS = {};
