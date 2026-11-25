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
    "type": "fluorine",
    "formula": "F2",
    "displayLabel": "F2",
    "composition": {
      "F": 2
    },
    "layout": [
      {
        "type": "F",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 88,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3,
      "1": 3
    },
    "prompt": "Would you like to make fluorine (F₂)?"
  },
  {
    "type": "chlorine",
    "formula": "Cl2",
    "displayLabel": "Cl2",
    "composition": {
      "Cl": 2
    },
    "layout": [
      {
        "type": "Cl",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 94,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3,
      "1": 3
    },
    "prompt": "Would you like to make chlorine (Cl₂)?"
  },
  {
    "type": "bromine",
    "formula": "Br2",
    "displayLabel": "Br2",
    "composition": {
      "Br": 2
    },
    "layout": [
      {
        "type": "Br",
        "x": 0,
        "y": 0
      },
      {
        "type": "Br",
        "x": 100,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3,
      "1": 3
    },
    "prompt": "Would you like to make bromine (Br₂)?"
  },
  {
    "type": "iodine",
    "formula": "I2",
    "displayLabel": "I2",
    "composition": {
      "I": 2
    },
    "layout": [
      {
        "type": "I",
        "x": 0,
        "y": 0
      },
      {
        "type": "I",
        "x": 106,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3,
      "1": 3
    },
    "prompt": "Would you like to make iodine (I₂)?"
  },
  {
    "type": "hydrogenFluoride",
    "formula": "HF",
    "displayLabel": "HF",
    "composition": {
      "F": 1,
      "H": 1
    },
    "layout": [
      {
        "type": "F",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -80,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3
    },
    "prompt": "Would you like to make hydrogen fluoride (HF)?"
  },
  {
    "type": "hydrogenBromide",
    "formula": "HBr",
    "displayLabel": "HBr",
    "composition": {
      "Br": 1,
      "H": 1
    },
    "layout": [
      {
        "type": "Br",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -96,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3
    },
    "prompt": "Would you like to make hydrogen bromide (HBr)?"
  },
  {
    "type": "hydrogenIodide",
    "formula": "HI",
    "displayLabel": "HI",
    "composition": {
      "I": 1,
      "H": 1
    },
    "layout": [
      {
        "type": "I",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      }
    ],
    "lonePairs": {
      "0": 3
    },
    "prompt": "Would you like to make hydrogen iodide (HI)?"
  },
  {
    "type": "phosphine",
    "formula": "PH3",
    "displayLabel": "PH3",
    "composition": {
      "P": 1,
      "H": 3
    },
    "layout": [
      {
        "type": "P",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -59,
        "y": 33
      },
      {
        "type": "H",
        "x": 59,
        "y": 33
      },
      {
        "type": "H",
        "x": 0,
        "y": 68
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
      }
    ],
    "lonePairs": {
      "0": 1
    },
    "lonePairAngles": {
      "0": [
        -90
      ]
    },
    "prompt": "Would you like to make phosphine (PH₃)?"
  },
  {
    "type": "arsine",
    "formula": "AsH3",
    "displayLabel": "AsH3",
    "composition": {
      "As": 1,
      "H": 3
    },
    "layout": [
      {
        "type": "As",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -61,
        "y": 34
      },
      {
        "type": "H",
        "x": 61,
        "y": 34
      },
      {
        "type": "H",
        "x": 0,
        "y": 70
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
      }
    ],
    "lonePairs": {
      "0": 1
    },
    "lonePairAngles": {
      "0": [
        -90
      ]
    },
    "prompt": "Would you like to make arsine (AsH₃)?"
  },
  {
    "type": "silane",
    "formula": "SiH4",
    "displayLabel": "SiH4",
    "composition": {
      "Si": 1,
      "H": 4
    },
    "layout": [
      {
        "type": "Si",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -43,
        "y": -43
      },
      {
        "type": "H",
        "x": 43,
        "y": -43
      },
      {
        "type": "H",
        "x": -43,
        "y": 43
      },
      {
        "type": "H",
        "x": 43,
        "y": 43
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
      }
    ],
    "lonePairs": {},
    "prompt": "Would you like to make silane (SiH₄)?"
  },
  {
    "type": "hydrogenSelenide",
    "formula": "H2Se",
    "displayLabel": "H2Se",
    "composition": {
      "Se": 1,
      "H": 2
    },
    "layout": [
      {
        "type": "Se",
        "x": 0,
        "y": 0
      },
      {
        "type": "H",
        "x": -51,
        "y": -50
      },
      {
        "type": "H",
        "x": 51,
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
      }
    ],
    "lonePairs": {
      "0": 2
    },
    "prompt": "Would you like to make hydrogen selenide (H₂Se)?"
  },
  {
    "type": "chloromethane",
    "formula": "CH3Cl",
    "displayLabel": "CH3Cl",
    "composition": {
      "C": 1,
      "Cl": 1,
      "H": 3
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -53,
        "y": -53
      },
      {
        "type": "H",
        "x": 41,
        "y": -41
      },
      {
        "type": "H",
        "x": -41,
        "y": 41
      },
      {
        "type": "H",
        "x": 41,
        "y": 41
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
      }
    ],
    "lonePairs": {
      "1": 3
    },
    "prompt": "Would you like to make chloromethane (CH₃Cl)?"
  },
  {
    "type": "dichloromethane",
    "formula": "CH2Cl2",
    "displayLabel": "CH2Cl2",
    "composition": {
      "C": 1,
      "Cl": 2,
      "H": 2
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -53,
        "y": -53
      },
      {
        "type": "Cl",
        "x": 53,
        "y": -53
      },
      {
        "type": "H",
        "x": -41,
        "y": 41
      },
      {
        "type": "H",
        "x": 41,
        "y": 41
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3
    },
    "prompt": "Would you like to make dichloromethane (CH₂Cl₂)?"
  },
  {
    "type": "chloroform",
    "formula": "CHCl3",
    "displayLabel": "CHCl3",
    "composition": {
      "C": 1,
      "Cl": 3,
      "H": 1
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -53,
        "y": -53
      },
      {
        "type": "Cl",
        "x": 53,
        "y": -53
      },
      {
        "type": "Cl",
        "x": -53,
        "y": 53
      },
      {
        "type": "H",
        "x": 41,
        "y": 41
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3
    },
    "prompt": "Would you like to make chloroform (CHCl₃)?"
  },
  {
    "type": "carbonTetrachloride",
    "formula": "CCl4",
    "displayLabel": "CCl4",
    "composition": {
      "C": 1,
      "Cl": 4
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -53,
        "y": -53
      },
      {
        "type": "Cl",
        "x": 53,
        "y": -53
      },
      {
        "type": "Cl",
        "x": -53,
        "y": 53
      },
      {
        "type": "Cl",
        "x": 53,
        "y": 53
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "prompt": "Would you like to make carbon tetrachloride (CCl₄)?"
  },
  {
    "type": "carbonTetrafluoride",
    "formula": "CF4",
    "displayLabel": "CF4",
    "composition": {
      "C": 1,
      "F": 4
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": -53,
        "y": -53
      },
      {
        "type": "F",
        "x": 53,
        "y": -53
      },
      {
        "type": "F",
        "x": -53,
        "y": 53
      },
      {
        "type": "F",
        "x": 53,
        "y": 53
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "prompt": "Would you like to make tetrafluoromethane (CF₄)?"
  },
  {
    "type": "siliconTetrachloride",
    "formula": "SiCl4",
    "displayLabel": "SiCl4",
    "composition": {
      "Si": 1,
      "Cl": 4
    },
    "layout": [
      {
        "type": "Si",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -56,
        "y": -56
      },
      {
        "type": "Cl",
        "x": 56,
        "y": -56
      },
      {
        "type": "Cl",
        "x": -56,
        "y": 56
      },
      {
        "type": "Cl",
        "x": 56,
        "y": 56
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "prompt": "Would you like to make silicon tetrachloride (SiCl₄)?"
  },
  {
    "type": "siliconTetrafluoride",
    "formula": "SiF4",
    "displayLabel": "SiF4",
    "composition": {
      "Si": 1,
      "F": 4
    },
    "layout": [
      {
        "type": "Si",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": -56,
        "y": -56
      },
      {
        "type": "F",
        "x": 56,
        "y": -56
      },
      {
        "type": "F",
        "x": -56,
        "y": 56
      },
      {
        "type": "F",
        "x": 56,
        "y": 56
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "prompt": "Would you like to make silicon tetrafluoride (SiF₄)?"
  },
  {
    "type": "boronTrifluoride",
    "formula": "BF3",
    "displayLabel": "BF3",
    "composition": {
      "B": 1,
      "F": 3
    },
    "layout": [
      {
        "type": "B",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": -90
      },
      {
        "type": "F",
        "x": 78,
        "y": 45
      },
      {
        "type": "F",
        "x": -78,
        "y": 45
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3
    },
    "prompt": "Would you like to make boron trifluoride (BF₃)?"
  },
  {
    "type": "boronTrichloride",
    "formula": "BCl3",
    "displayLabel": "BCl3",
    "composition": {
      "B": 1,
      "Cl": 3
    },
    "layout": [
      {
        "type": "B",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 0,
        "y": -90
      },
      {
        "type": "Cl",
        "x": 78,
        "y": 45
      },
      {
        "type": "Cl",
        "x": -78,
        "y": 45
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
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3
    },
    "prompt": "Would you like to make boron trichloride (BCl₃)?"
  },
  {
    "type": "phosphorusTrichloride",
    "formula": "PCl3",
    "displayLabel": "PCl3",
    "composition": {
      "P": 1,
      "Cl": 3
    },
    "layout": [
      {
        "type": "P",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -75,
        "y": 42
      },
      {
        "type": "Cl",
        "x": 75,
        "y": 42
      },
      {
        "type": "Cl",
        "x": 0,
        "y": 86
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
      }
    ],
    "lonePairs": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 3
    },
    "lonePairAngles": {
      "0": [
        -90
      ]
    },
    "prompt": "Would you like to make phosphorus trichloride (PCl₃)?"
  },
  {
    "type": "hydrogenCyanide",
    "formula": "HCN",
    "displayLabel": "HCN",
    "composition": {
      "C": 1,
      "N": 1,
      "H": 1
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "N",
        "x": 88,
        "y": 0
      },
      {
        "type": "H",
        "x": -70,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "triple"
      },
      {
        "a": 0,
        "b": 2
      }
    ],
    "lonePairs": {
      "1": 1
    },
    "prompt": "Would you like to make hydrogen cyanide (HCN)?"
  },
  {
    "type": "formaldehyde",
    "formula": "CH2O",
    "displayLabel": "CH2O",
    "composition": {
      "C": 1,
      "O": 1,
      "H": 2
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 0,
        "y": -88
      },
      {
        "type": "H",
        "x": -62,
        "y": 40
      },
      {
        "type": "H",
        "x": 62,
        "y": 40
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
      },
      {
        "a": 0,
        "b": 2
      },
      {
        "a": 0,
        "b": 3
      }
    ],
    "lonePairs": {
      "1": 2
    },
    "prompt": "Would you like to make formaldehyde (CH₂O)?"
  },
  {
    "type": "formicAcid",
    "formula": "HCOOH",
    "displayLabel": "HCOOH",
    "composition": {
      "C": 1,
      "O": 2,
      "H": 2
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": -46,
        "y": -80
      },
      {
        "type": "O",
        "x": 84,
        "y": 24
      },
      {
        "type": "H",
        "x": -62,
        "y": 40
      },
      {
        "type": "H",
        "x": 138,
        "y": -14
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
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
        "a": 2,
        "b": 4
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2
    },
    "prompt": "Would you like to make formic acid (HCOOH)?"
  },
  {
    "type": "aceticAcid",
    "formula": "CH3COOH",
    "displayLabel": "CH3COOH",
    "composition": {
      "C": 2,
      "O": 2,
      "H": 4
    },
    "layout": [
      {
        "type": "C",
        "x": 0,
        "y": 0
      },
      {
        "type": "C",
        "x": -92,
        "y": 0
      },
      {
        "type": "O",
        "x": 46,
        "y": -80
      },
      {
        "type": "O",
        "x": 84,
        "y": 40
      },
      {
        "type": "H",
        "x": -128,
        "y": -58
      },
      {
        "type": "H",
        "x": -150,
        "y": 22
      },
      {
        "type": "H",
        "x": -104,
        "y": 64
      },
      {
        "type": "H",
        "x": 150,
        "y": 6
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2,
        "order": "double"
      },
      {
        "a": 0,
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
        "a": 3,
        "b": 7
      }
    ],
    "lonePairs": {
      "2": 2,
      "3": 2
    },
    "prompt": "Would you like to make acetic acid (CH₃COOH)?"
  },
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
    "type": "hypochlorousAcid",
    "formula": "HOCl",
    "displayLabel": "HOCl",
    "composition": {
      "O": 1,
      "Cl": 1,
      "H": 1
    },
    "layout": [
      {
        "type": "O",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 86,
        "y": -36
      },
      {
        "type": "H",
        "x": -52,
        "y": -46
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
      "0": 2,
      "1": 3
    },
    "prompt": "Would you like to make hypochlorous acid (HOCl)?"
  },
  {
    "type": "nitricAcid",
    "formula": "HNO3",
    "displayLabel": "HNO3",
    "composition": {
      "N": 1,
      "O": 3,
      "H": 1
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
        "y": -30
      },
      {
        "type": "O",
        "x": 56,
        "y": -72
      },
      {
        "type": "O",
        "x": 56,
        "y": 72
      },
      {
        "type": "H",
        "x": -132,
        "y": 24
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1
      },
      {
        "a": 0,
        "b": 2,
        "order": "resonance"
      },
      {
        "a": 0,
        "b": 3,
        "order": "resonance"
      },
      {
        "a": 1,
        "b": 4
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2.5,
      "3": 2.5
    },
    "prompt": "Would you like to make nitric acid (HNO₃)?"
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
    "type": "sulfurTetrafluoride",
    "formula": "SF4",
    "displayLabel": "SF4",
    "composition": {
      "S": 1,
      "F": 4
    },
    "layout": [
      {
        "type": "S",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 83
      },
      {
        "type": "F",
        "x": 0,
        "y": -83
      },
      {
        "type": "F",
        "x": -48,
        "y": 42
      },
      {
        "type": "F",
        "x": -48,
        "y": -42
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
      }
    ],
    "lonePairs": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "lonePairAngles": {
      "0": [
        0
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make sulfur tetrafluoride (SF₄)?"
  },
  {
    "type": "sulfurHexafluoride",
    "formula": "SF6",
    "displayLabel": "SF6",
    "composition": {
      "S": 1,
      "F": 6
    },
    "layout": [
      {
        "type": "S",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 94
      },
      {
        "type": "F",
        "x": 0,
        "y": -94
      },
      {
        "type": "F",
        "x": 87,
        "y": -17
      },
      {
        "type": "F",
        "x": -87,
        "y": 17
      },
      {
        "type": "F",
        "x": 50,
        "y": 30
      },
      {
        "type": "F",
        "x": -50,
        "y": -30
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
        "a": 0,
        "b": 5
      },
      {
        "a": 0,
        "b": 6
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3,
      "5": 3,
      "6": 3
    },
    "expandedOctet": true,
    "prompt": "Would you like to make sulfur hexafluoride (SF₆)?"
  },
  {
    "type": "chlorineTrifluoride",
    "formula": "ClF3",
    "displayLabel": "ClF3",
    "composition": {
      "Cl": 1,
      "F": 3
    },
    "layout": [
      {
        "type": "Cl",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 83
      },
      {
        "type": "F",
        "x": 0,
        "y": -83
      },
      {
        "type": "F",
        "x": 96,
        "y": 0
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
      }
    ],
    "lonePairs": {
      "0": 2,
      "1": 3,
      "2": 3,
      "3": 3
    },
    "lonePairAngles": {
      "0": [
        139,
        -139
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make chlorine trifluoride (ClF₃)?"
  },
  {
    "type": "iodinePentafluoride",
    "formula": "IF5",
    "displayLabel": "IF5",
    "composition": {
      "I": 1,
      "F": 5
    },
    "layout": [
      {
        "type": "I",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": -78
      },
      {
        "type": "F",
        "x": 68,
        "y": -40
      },
      {
        "type": "F",
        "x": -68,
        "y": 40
      },
      {
        "type": "F",
        "x": 68,
        "y": 40
      },
      {
        "type": "F",
        "x": -68,
        "y": -40
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
        "a": 0,
        "b": 5
      }
    ],
    "lonePairs": {
      "0": 1,
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3,
      "5": 3
    },
    "lonePairAngles": {
      "0": [
        90
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make iodine pentafluoride (IF₅)?"
  },
  {
    "type": "iodineHeptafluoride",
    "formula": "IF7",
    "displayLabel": "IF7",
    "composition": {
      "I": 1,
      "F": 7
    },
    "layout": [
      {
        "type": "I",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 102
      },
      {
        "type": "F",
        "x": 0,
        "y": -102
      },
      {
        "type": "F",
        "x": 36,
        "y": -52
      },
      {
        "type": "F",
        "x": 116,
        "y": 0
      },
      {
        "type": "F",
        "x": 36,
        "y": 52
      },
      {
        "type": "F",
        "x": -94,
        "y": 32
      },
      {
        "type": "F",
        "x": -94,
        "y": -32
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
        "a": 0,
        "b": 5
      },
      {
        "a": 0,
        "b": 6
      },
      {
        "a": 0,
        "b": 7
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3,
      "5": 3,
      "6": 3,
      "7": 3
    },
    "expandedOctet": true,
    "prompt": "Would you like to make iodine heptafluoride (IF₇)?"
  },
  {
    "type": "phosphorusPentachloride",
    "formula": "PCl5",
    "displayLabel": "PCl5",
    "composition": {
      "P": 1,
      "Cl": 5
    },
    "layout": [
      {
        "type": "P",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 0,
        "y": 87
      },
      {
        "type": "Cl",
        "x": 0,
        "y": -87
      },
      {
        "type": "Cl",
        "x": 100,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -50,
        "y": 43
      },
      {
        "type": "Cl",
        "x": -50,
        "y": -43
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
        "a": 0,
        "b": 5
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3,
      "5": 3
    },
    "expandedOctet": true,
    "prompt": "Would you like to make phosphorus pentachloride (PCl₅)?"
  },
  {
    "type": "phosphorusPentafluoride",
    "formula": "PF5",
    "displayLabel": "PF5",
    "composition": {
      "P": 1,
      "F": 5
    },
    "layout": [
      {
        "type": "P",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 80
      },
      {
        "type": "F",
        "x": 0,
        "y": -80
      },
      {
        "type": "F",
        "x": 92,
        "y": 0
      },
      {
        "type": "F",
        "x": -46,
        "y": 40
      },
      {
        "type": "F",
        "x": -46,
        "y": -40
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
        "a": 0,
        "b": 5
      }
    ],
    "lonePairs": {
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3,
      "5": 3
    },
    "expandedOctet": true,
    "prompt": "Would you like to make phosphorus pentafluoride (PF₅)?"
  },
  {
    "type": "sulfurTrioxide",
    "formula": "SO3",
    "displayLabel": "SO3",
    "composition": {
      "S": 1,
      "O": 3
    },
    "layout": [
      {
        "type": "S",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 0,
        "y": -86
      },
      {
        "type": "O",
        "x": 74,
        "y": 43
      },
      {
        "type": "O",
        "x": -74,
        "y": 43
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
      },
      {
        "a": 0,
        "b": 2,
        "order": "double"
      },
      {
        "a": 0,
        "b": 3,
        "order": "double"
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2,
      "3": 2
    },
    "expandedOctet": true,
    "prompt": "Would you like to make sulfur trioxide (SO₃)?"
  },
  {
    "type": "sulfuricAcid",
    "formula": "H2SO4",
    "displayLabel": "H2SO4",
    "composition": {
      "S": 1,
      "O": 4,
      "H": 2
    },
    "layout": [
      {
        "type": "S",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 0,
        "y": -86
      },
      {
        "type": "O",
        "x": 0,
        "y": 86
      },
      {
        "type": "O",
        "x": -90,
        "y": 0
      },
      {
        "type": "O",
        "x": 90,
        "y": 0
      },
      {
        "type": "H",
        "x": -130,
        "y": -54
      },
      {
        "type": "H",
        "x": 130,
        "y": 54
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
      },
      {
        "a": 0,
        "b": 2,
        "order": "double"
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
        "a": 3,
        "b": 5
      },
      {
        "a": 4,
        "b": 6
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2,
      "3": 2,
      "4": 2
    },
    "expandedOctet": true,
    "prompt": "Would you like to make sulfuric acid (H₂SO₄)?"
  },
  {
    "type": "phosphoricAcid",
    "formula": "H3PO4",
    "displayLabel": "H3PO4",
    "composition": {
      "P": 1,
      "O": 4,
      "H": 3
    },
    "layout": [
      {
        "type": "P",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 0,
        "y": -86
      },
      {
        "type": "O",
        "x": -90,
        "y": 0
      },
      {
        "type": "O",
        "x": 90,
        "y": 0
      },
      {
        "type": "O",
        "x": 0,
        "y": 90
      },
      {
        "type": "H",
        "x": -130,
        "y": -54
      },
      {
        "type": "H",
        "x": 130,
        "y": -54
      },
      {
        "type": "H",
        "x": -58,
        "y": 138
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
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
        "a": 2,
        "b": 5
      },
      {
        "a": 3,
        "b": 6
      },
      {
        "a": 4,
        "b": 7
      }
    ],
    "lonePairs": {
      "1": 2,
      "2": 2,
      "3": 2,
      "4": 2
    },
    "expandedOctet": true,
    "prompt": "Would you like to make phosphoric acid (H₃PO₄)?"
  },
  {
    "type": "xenonDifluoride",
    "formula": "XeF2",
    "displayLabel": "XeF2",
    "composition": {
      "Xe": 1,
      "F": 2
    },
    "layout": [
      {
        "type": "Xe",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 0,
        "y": 83
      },
      {
        "type": "F",
        "x": 0,
        "y": -83
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
      "0": 3,
      "1": 3,
      "2": 3
    },
    "lonePairAngles": {
      "0": [
        0,
        139,
        -139
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make xenon difluoride (XeF₂)?"
  },
  {
    "type": "xenonTetrafluoride",
    "formula": "XeF4",
    "displayLabel": "XeF4",
    "composition": {
      "Xe": 1,
      "F": 4
    },
    "layout": [
      {
        "type": "Xe",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 68,
        "y": -44
      },
      {
        "type": "F",
        "x": -68,
        "y": 44
      },
      {
        "type": "F",
        "x": 68,
        "y": 44
      },
      {
        "type": "F",
        "x": -68,
        "y": -44
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
      }
    ],
    "lonePairs": {
      "0": 2,
      "1": 3,
      "2": 3,
      "3": 3,
      "4": 3
    },
    "lonePairAngles": {
      "0": [
        -90,
        90
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make xenon tetrafluoride (XeF₄)?"
  },
  {
    "type": "xenonTrioxide",
    "formula": "XeO3",
    "displayLabel": "XeO3",
    "composition": {
      "Xe": 1,
      "O": 3
    },
    "layout": [
      {
        "type": "Xe",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": -72,
        "y": 40
      },
      {
        "type": "O",
        "x": 72,
        "y": 40
      },
      {
        "type": "O",
        "x": 0,
        "y": 83
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "order": "double"
      },
      {
        "a": 0,
        "b": 2,
        "order": "double"
      },
      {
        "a": 0,
        "b": 3,
        "order": "double"
      }
    ],
    "lonePairs": {
      "0": 1,
      "1": 2,
      "2": 2,
      "3": 2
    },
    "lonePairAngles": {
      "0": [
        -90
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make xenon trioxide (XeO₃)?"
  },
  {
    "type": "kryptonDifluoride",
    "formula": "KrF2",
    "displayLabel": "KrF2",
    "composition": {
      "Kr": 1,
      "F": 2
    },
    "layout": [
      {
        "type": "Kr",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": -92,
        "y": 0
      },
      {
        "type": "F",
        "x": 92,
        "y": 0
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
      "0": 3,
      "1": 3,
      "2": 3
    },
    "lonePairAngles": {
      "0": [
        -90,
        30,
        150
      ]
    },
    "expandedOctet": true,
    "prompt": "Would you like to make krypton difluoride (KrF₂)?"
  },
  {
    "type": "lithiumFluoride",
    "formula": "LiF",
    "displayLabel": "LiF",
    "composition": {
      "Li": 1,
      "F": 1
    },
    "layout": [
      {
        "type": "Li",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form lithium fluoride (LiF)? An ionic compound!"
  },
  {
    "type": "lithiumChloride",
    "formula": "LiCl",
    "displayLabel": "LiCl",
    "composition": {
      "Li": 1,
      "Cl": 1
    },
    "layout": [
      {
        "type": "Li",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form lithium chloride (LiCl)? An ionic compound!"
  },
  {
    "type": "sodiumFluoride",
    "formula": "NaF",
    "displayLabel": "NaF",
    "composition": {
      "Na": 1,
      "F": 1
    },
    "layout": [
      {
        "type": "Na",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form sodium fluoride (NaF)? An ionic compound!"
  },
  {
    "type": "sodiumBromide",
    "formula": "NaBr",
    "displayLabel": "NaBr",
    "composition": {
      "Na": 1,
      "Br": 1
    },
    "layout": [
      {
        "type": "Na",
        "x": 0,
        "y": 0
      },
      {
        "type": "Br",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form sodium bromide (NaBr)? An ionic compound!"
  },
  {
    "type": "potassiumChloride",
    "formula": "KCl",
    "displayLabel": "KCl",
    "composition": {
      "K": 1,
      "Cl": 1
    },
    "layout": [
      {
        "type": "K",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form potassium chloride (KCl)? An ionic compound!"
  },
  {
    "type": "potassiumIodide",
    "formula": "KI",
    "displayLabel": "KI",
    "composition": {
      "K": 1,
      "I": 1
    },
    "layout": [
      {
        "type": "K",
        "x": 0,
        "y": 0
      },
      {
        "type": "I",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 1,
      "1": -1
    },
    "prompt": "Form potassium iodide (KI)? An ionic compound!"
  },
  {
    "type": "magnesiumOxide",
    "formula": "MgO",
    "displayLabel": "MgO",
    "composition": {
      "Mg": 1,
      "O": 1
    },
    "layout": [
      {
        "type": "Mg",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 2,
      "1": -2
    },
    "prompt": "Form magnesium oxide (MgO)? An ionic compound!"
  },
  {
    "type": "calciumOxide",
    "formula": "CaO",
    "displayLabel": "CaO",
    "composition": {
      "Ca": 1,
      "O": 1
    },
    "layout": [
      {
        "type": "Ca",
        "x": 0,
        "y": 0
      },
      {
        "type": "O",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4
    },
    "ionCharges": {
      "0": 2,
      "1": -2
    },
    "prompt": "Form calcium oxide (CaO)? An ionic compound!"
  },
  {
    "type": "magnesiumChloride",
    "formula": "MgCl2",
    "displayLabel": "MgCl2",
    "composition": {
      "Mg": 1,
      "Cl": 2
    },
    "layout": [
      {
        "type": "Mg",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -104,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4,
      "2": 4
    },
    "ionCharges": {
      "0": 2,
      "1": -1,
      "2": -1
    },
    "prompt": "Form magnesium chloride (MgCl₂)? An ionic compound!"
  },
  {
    "type": "calciumChloride",
    "formula": "CaCl2",
    "displayLabel": "CaCl2",
    "composition": {
      "Ca": 1,
      "Cl": 2
    },
    "layout": [
      {
        "type": "Ca",
        "x": 0,
        "y": 0
      },
      {
        "type": "Cl",
        "x": -104,
        "y": 0
      },
      {
        "type": "Cl",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4,
      "2": 4
    },
    "ionCharges": {
      "0": 2,
      "1": -1,
      "2": -1
    },
    "prompt": "Form calcium chloride (CaCl₂)? An ionic compound!"
  },
  {
    "type": "calciumFluoride",
    "formula": "CaF2",
    "displayLabel": "CaF2",
    "composition": {
      "Ca": 1,
      "F": 2
    },
    "layout": [
      {
        "type": "Ca",
        "x": 0,
        "y": 0
      },
      {
        "type": "F",
        "x": -104,
        "y": 0
      },
      {
        "type": "F",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "1": 4,
      "2": 4
    },
    "ionCharges": {
      "0": 2,
      "1": -1,
      "2": -1
    },
    "prompt": "Form calcium fluoride (CaF₂)? An ionic compound!"
  },
  {
    "type": "lithiumOxide",
    "formula": "Li2O",
    "displayLabel": "Li2O",
    "composition": {
      "O": 1,
      "Li": 2
    },
    "layout": [
      {
        "type": "O",
        "x": 0,
        "y": 0
      },
      {
        "type": "Li",
        "x": -104,
        "y": 0
      },
      {
        "type": "Li",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "0": 4
    },
    "ionCharges": {
      "0": -2,
      "1": 1,
      "2": 1
    },
    "prompt": "Form lithium oxide (Li₂O)? An ionic compound!"
  },
  {
    "type": "potassiumOxide",
    "formula": "K2O",
    "displayLabel": "K2O",
    "composition": {
      "O": 1,
      "K": 2
    },
    "layout": [
      {
        "type": "O",
        "x": 0,
        "y": 0
      },
      {
        "type": "K",
        "x": -104,
        "y": 0
      },
      {
        "type": "K",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "0": 4
    },
    "ionCharges": {
      "0": -2,
      "1": 1,
      "2": 1
    },
    "prompt": "Form potassium oxide (K₂O)? An ionic compound!"
  },
  {
    "type": "sodiumSulfide",
    "formula": "Na2S",
    "displayLabel": "Na2S",
    "composition": {
      "S": 1,
      "Na": 2
    },
    "layout": [
      {
        "type": "S",
        "x": 0,
        "y": 0
      },
      {
        "type": "Na",
        "x": -104,
        "y": 0
      },
      {
        "type": "Na",
        "x": 104,
        "y": 0
      }
    ],
    "bonds": [
      {
        "a": 0,
        "b": 1,
        "ionic": true
      },
      {
        "a": 0,
        "b": 2,
        "ionic": true
      }
    ],
    "lonePairs": {
      "0": 4
    },
    "ionCharges": {
      "0": -2,
      "1": 1,
      "2": 1
    },
    "prompt": "Form sodium sulfide (Na₂S)? An ionic compound!"
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
  "F2": {
    "name": "Fluorine",
    "molarMass": "38.00",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Nonpolar",
    "fact": "The most reactive element — it even reacts with xenon.",
    "angleSource": "—"
  },
  "Cl2": {
    "name": "Chlorine",
    "molarMass": "70.90",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Nonpolar",
    "fact": "A yellow-green gas used to disinfect drinking water.",
    "angleSource": "—"
  },
  "Br2": {
    "name": "Bromine",
    "molarMass": "159.81",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Nonpolar",
    "fact": "One of only two elements that are liquid at room temperature (mercury is the other).",
    "angleSource": "—"
  },
  "I2": {
    "name": "Iodine",
    "molarMass": "253.80",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Nonpolar",
    "fact": "Warm the dark crystals and they sublime into a violet vapor.",
    "angleSource": "—"
  },
  "HF": {
    "name": "Hydrogen fluoride",
    "molarMass": "20.01",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Polar",
    "fact": "A weak acid in water — yet it etches glass.",
    "angleSource": "—"
  },
  "HBr": {
    "name": "Hydrogen bromide",
    "molarMass": "80.91",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Polar",
    "fact": "Dissolved in water it is a strong acid, stronger than HCl.",
    "angleSource": "—"
  },
  "HI": {
    "name": "Hydrogen iodide",
    "molarMass": "127.91",
    "geometry": "Linear (diatomic)",
    "bondAngle": "—",
    "polarity": "Polar",
    "fact": "The strongest of the hydrogen halide acids.",
    "angleSource": "—"
  },
  "PH3": {
    "name": "Phosphine",
    "molarMass": "34.00",
    "geometry": "Trigonal pyramidal",
    "bondAngle": "93.5°",
    "polarity": "Slightly polar",
    "fact": "A toxic gas; impure samples smell like garlic or rotting fish.",
    "angleSource": "CCCBDB (exp.)"
  },
  "AsH3": {
    "name": "Arsine",
    "molarMass": "77.95",
    "geometry": "Trigonal pyramidal",
    "bondAngle": "92.1°",
    "polarity": "Slightly polar",
    "fact": "Extremely toxic — the Marsh test for arsenic poisoning makes it.",
    "angleSource": "CCCBDB (exp.)"
  },
  "SiH4": {
    "name": "Silane",
    "molarMass": "32.12",
    "geometry": "Tetrahedral",
    "bondAngle": "109.5°",
    "polarity": "Nonpolar",
    "fact": "Catches fire on its own in air; used to deposit silicon in chipmaking.",
    "angleSource": "Td symmetry"
  },
  "H2Se": {
    "name": "Hydrogen selenide",
    "molarMass": "80.99",
    "geometry": "Bent",
    "bondAngle": "91°",
    "polarity": "Slightly polar",
    "fact": "More toxic than H₂S, with a smell like decaying horseradish.",
    "angleSource": "CCCBDB (exp. 90.9°)"
  },
  "CH3Cl": {
    "name": "Chloromethane",
    "molarMass": "50.49",
    "geometry": "Tetrahedral",
    "bondAngle": "~110° (H–C–H)",
    "polarity": "Polar",
    "fact": "Oceans, plants and fungi release millions of tonnes of it each year.",
    "angleSource": "CCCBDB (exp. 110.5°)"
  },
  "CH2Cl2": {
    "name": "Dichloromethane",
    "molarMass": "84.93",
    "geometry": "Tetrahedral",
    "bondAngle": "112° (Cl–C–Cl)",
    "polarity": "Polar",
    "fact": "A common lab solvent, also used to decaffeinate coffee.",
    "angleSource": "CCCBDB (exp.)"
  },
  "CHCl3": {
    "name": "Chloroform",
    "molarMass": "119.37",
    "geometry": "Tetrahedral",
    "bondAngle": "111.3° (Cl–C–Cl)",
    "polarity": "Polar",
    "fact": "One of the first surgical anesthetics (1847).",
    "angleSource": "CCCBDB (exp.)"
  },
  "CCl4": {
    "name": "Carbon tetrachloride",
    "molarMass": "153.81",
    "geometry": "Tetrahedral",
    "bondAngle": "109.5°",
    "polarity": "Nonpolar",
    "fact": "Once used in fire extinguishers; now restricted because it harms the ozone layer.",
    "angleSource": "Td symmetry"
  },
  "CF4": {
    "name": "Tetrafluoromethane",
    "molarMass": "88.00",
    "geometry": "Tetrahedral",
    "bondAngle": "109.5°",
    "polarity": "Nonpolar",
    "fact": "So stable it lasts about 50,000 years in the atmosphere.",
    "angleSource": "Td symmetry"
  },
  "SiCl4": {
    "name": "Silicon tetrachloride",
    "molarMass": "169.89",
    "geometry": "Tetrahedral",
    "bondAngle": "109.5°",
    "polarity": "Nonpolar",
    "fact": "Fumes in moist air; a step in making ultra-pure silicon and optical fiber.",
    "angleSource": "Td symmetry"
  },
  "SiF4": {
    "name": "Silicon tetrafluoride",
    "molarMass": "104.08",
    "geometry": "Tetrahedral",
    "bondAngle": "109.5°",
    "polarity": "Nonpolar",
    "fact": "The gas formed when hydrofluoric acid etches glass.",
    "angleSource": "Td symmetry"
  },
  "BF3": {
    "name": "Boron trifluoride",
    "molarMass": "67.80",
    "geometry": "Trigonal planar",
    "bondAngle": "120°",
    "polarity": "Nonpolar",
    "fact": "Boron has only six valence electrons here, so it eagerly accepts a lone pair.",
    "angleSource": "D3h symmetry"
  },
  "BCl3": {
    "name": "Boron trichloride",
    "molarMass": "117.16",
    "geometry": "Trigonal planar",
    "bondAngle": "120°",
    "polarity": "Nonpolar",
    "fact": "Used to etch aluminum when making microchips.",
    "angleSource": "D3h symmetry"
  },
  "PCl3": {
    "name": "Phosphorus trichloride",
    "molarMass": "137.32",
    "geometry": "Trigonal pyramidal",
    "bondAngle": "100.3°",
    "polarity": "Polar",
    "fact": "A starting material for the herbicide glyphosate.",
    "angleSource": "CCCBDB (exp.)"
  },
  "HCN": {
    "name": "Hydrogen cyanide",
    "molarMass": "27.03",
    "geometry": "Linear",
    "bondAngle": "180°",
    "polarity": "Polar",
    "fact": "Some people smell bitter almonds; others genetically cannot.",
    "angleSource": "C∞v symmetry"
  },
  "CH2O": {
    "name": "Formaldehyde",
    "molarMass": "30.03",
    "geometry": "Trigonal planar",
    "bondAngle": "116.5° (H–C–H)",
    "polarity": "Polar",
    "fact": "Dissolved in water (formalin) it preserves biological specimens.",
    "angleSource": "CCCBDB (exp.)"
  },
  "HCOOH": {
    "name": "Formic acid",
    "molarMass": "46.03",
    "geometry": "Trigonal planar at C",
    "bondAngle": "~125° (O=C–O)",
    "polarity": "Polar",
    "fact": "Found in ant stings — \"formica\" is Latin for ant.",
    "angleSource": "CCCBDB (exp. 124.9°)"
  },
  "CH3COOH": {
    "name": "Acetic acid",
    "molarMass": "60.05",
    "geometry": "Trigonal planar at C=O carbon",
    "bondAngle": "~123° (O=C–O)",
    "polarity": "Polar",
    "fact": "Gives vinegar its sour taste and smell.",
    "angleSource": "CCCBDB (exp. 122°–123°)"
  },
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
  "HOCl": {
    "name": "Hypochlorous acid",
    "molarMass": "52.46",
    "geometry": "Bent",
    "bondAngle": "103° (H–O–Cl)",
    "polarity": "Polar",
    "fact": "White blood cells make it to kill bacteria.",
    "angleSource": "CCCBDB (exp. 102.96°)"
  },
  "HNO3": {
    "name": "Nitric acid",
    "molarMass": "63.01",
    "geometry": "Trigonal planar at N",
    "bondAngle": "~130° (O–N–O)",
    "polarity": "Polar",
    "fact": "A strong acid used to make fertilizers and explosives.",
    "angleSource": "CCCBDB (exp. 130.3°)",
    "note": "The two N–O bonds without H are equal (resonance, order 1½); nitrogen carries a formal +1 charge."
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
  "SF4": {
    "name": "Sulfur tetrafluoride",
    "molarMass": "108.05",
    "geometry": "See-saw",
    "bondAngle": "101.6° (Feq–S–Feq), 173° (Fax–S–Fax)",
    "polarity": "Polar",
    "fact": "A lone pair takes one equatorial spot, bending it into a see-saw.",
    "angleSource": "CCCBDB (exp.)",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "SF6": {
    "name": "Sulfur hexafluoride",
    "molarMass": "146.05",
    "geometry": "Octahedral",
    "bondAngle": "90°",
    "polarity": "Nonpolar",
    "fact": "The most potent known greenhouse gas — about 23,500× CO₂ over 100 years.",
    "angleSource": "Oh symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "ClF3": {
    "name": "Chlorine trifluoride",
    "molarMass": "92.44",
    "geometry": "T-shaped",
    "bondAngle": "87.5° (Fax–Cl–Feq)",
    "polarity": "Polar",
    "fact": "So reactive it can set sand and glass on fire.",
    "angleSource": "CCCBDB (exp.)",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "IF5": {
    "name": "Iodine pentafluoride",
    "molarMass": "221.89",
    "geometry": "Square pyramidal",
    "bondAngle": "~82° (Fax–I–Fbase)",
    "polarity": "Polar",
    "fact": "One lone pair below the square base gives the pyramid shape.",
    "angleSource": "Exp. 81.9°",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "IF7": {
    "name": "Iodine heptafluoride",
    "molarMass": "259.89",
    "geometry": "Pentagonal bipyramidal",
    "bondAngle": "72° (equatorial), 90° (axial)",
    "polarity": "Nonpolar",
    "fact": "One of very few molecules shaped like a pentagonal bipyramid.",
    "angleSource": "D5h (idealized)",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "PCl5": {
    "name": "Phosphorus pentachloride",
    "molarMass": "208.22",
    "geometry": "Trigonal bipyramidal",
    "bondAngle": "90°, 120°",
    "polarity": "Nonpolar",
    "fact": "Molecular as a gas, but the solid is ionic: [PCl₄]⁺[PCl₆]⁻.",
    "angleSource": "D3h symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "PF5": {
    "name": "Phosphorus pentafluoride",
    "molarMass": "125.96",
    "geometry": "Trigonal bipyramidal",
    "bondAngle": "90°, 120°",
    "polarity": "Nonpolar",
    "fact": "Used to make LiPF₆, the salt in lithium-ion battery electrolyte.",
    "angleSource": "D3h symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "SO3": {
    "name": "Sulfur trioxide",
    "molarMass": "80.06",
    "geometry": "Trigonal planar",
    "bondAngle": "120°",
    "polarity": "Nonpolar",
    "fact": "Reacts violently with water to make sulfuric acid.",
    "angleSource": "D3h symmetry",
    "note": "Drawn as the textbook expanded-octet structure (three S=O). Charge-separated structures describe it too; modern bonding theory explains it without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "H2SO4": {
    "name": "Sulfuric acid",
    "molarMass": "98.07",
    "geometry": "Tetrahedral at S",
    "bondAngle": "~109° (approx. tetrahedral at S)",
    "polarity": "Polar",
    "fact": "One of the most-produced chemicals in the world.",
    "angleSource": "—",
    "note": "Drawn as the usual textbook expanded-octet structure (two S=O). It can also be drawn with separated charges (S²⁺, two O⁻) and only single bonds; modern bonding theory explains it without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "H3PO4": {
    "name": "Phosphoric acid",
    "molarMass": "97.99",
    "geometry": "Tetrahedral at P",
    "bondAngle": "~109° (approx. tetrahedral at P)",
    "polarity": "Polar",
    "fact": "Gives cola drinks their tangy taste.",
    "angleSource": "—",
    "note": "Drawn as the usual textbook expanded-octet structure (P=O). It can also be drawn with separated charges (P⁺–O⁻); modern bonding theory explains it without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "XeF2": {
    "name": "Xenon difluoride",
    "molarMass": "169.29",
    "geometry": "Linear",
    "bondAngle": "180°",
    "polarity": "Nonpolar",
    "fact": "A noble-gas compound you can buy: stable crystals used for fluorination.",
    "angleSource": "D∞h symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "XeF4": {
    "name": "Xenon tetrafluoride",
    "molarMass": "207.28",
    "geometry": "Square planar",
    "bondAngle": "90°",
    "polarity": "Nonpolar",
    "fact": "Two lone pairs sit above and below the square of fluorines.",
    "angleSource": "D4h symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "XeO3": {
    "name": "Xenon trioxide",
    "molarMass": "179.29",
    "geometry": "Trigonal pyramidal",
    "bondAngle": "~103° (O–Xe–O)",
    "polarity": "Polar",
    "fact": "A dangerously powerful explosive when dry.",
    "angleSource": "Exp. (X-ray)",
    "note": "Drawn as the textbook expanded-octet structure (three Xe=O). It can also be drawn with Xe–O⁻ single bonds and a charged xenon; modern bonding theory explains it without d orbitals.",
    "expandedOctet": true
  },
  "KrF2": {
    "name": "Krypton difluoride",
    "molarMass": "121.79",
    "geometry": "Linear",
    "bondAngle": "180°",
    "polarity": "Nonpolar",
    "fact": "One of the strongest oxidizing agents known.",
    "angleSource": "D∞h symmetry",
    "note": "Drawn as the textbook \"expanded octet\" Lewis structure. Modern bonding theory explains this molecule without the central atom using d orbitals.",
    "expandedOctet": true
  },
  "LiF": {
    "name": "Lithium fluoride",
    "molarMass": "25.94",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Melts at 845 °C; used in radiation dosimeters.",
    "angleSource": "—"
  },
  "LiCl": {
    "name": "Lithium chloride",
    "molarMass": "42.39",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "So hygroscopic it is used to dry air.",
    "angleSource": "—"
  },
  "NaF": {
    "name": "Sodium fluoride",
    "molarMass": "41.99",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Added to toothpaste to help strengthen tooth enamel.",
    "angleSource": "—"
  },
  "NaBr": {
    "name": "Sodium bromide",
    "molarMass": "102.89",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Bromide salts were once widely used as sedatives.",
    "angleSource": "—"
  },
  "KCl": {
    "name": "Potassium chloride",
    "molarMass": "74.55",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Used as a salt substitute for low-sodium diets.",
    "angleSource": "—"
  },
  "KI": {
    "name": "Potassium iodide",
    "molarMass": "166.00",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Added to iodized salt to prevent iodine deficiency.",
    "angleSource": "—"
  },
  "MgO": {
    "name": "Magnesium oxide",
    "molarMass": "40.30",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "The brilliant white smoke when magnesium burns.",
    "angleSource": "—"
  },
  "CaO": {
    "name": "Calcium oxide",
    "molarMass": "56.08",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Quicklime — it gets very hot when mixed with water.",
    "angleSource": "—"
  },
  "MgCl2": {
    "name": "Magnesium chloride",
    "molarMass": "95.21",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Spread on roads to melt ice; seawater is a major source.",
    "angleSource": "—"
  },
  "CaCl2": {
    "name": "Calcium chloride",
    "molarMass": "110.98",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Melts ice and pulls moisture out of the air.",
    "angleSource": "—"
  },
  "CaF2": {
    "name": "Calcium fluoride",
    "molarMass": "78.07",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "The mineral fluorite — the word \"fluorescence\" comes from it.",
    "angleSource": "—"
  },
  "Li2O": {
    "name": "Lithium oxide",
    "molarMass": "29.88",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Forms when lithium metal burns in air.",
    "angleSource": "—"
  },
  "K2O": {
    "name": "Potassium oxide",
    "molarMass": "94.20",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Fertilizer potassium is labelled as its \"K₂O\" equivalent.",
    "angleSource": "—"
  },
  "Na2S": {
    "name": "Sodium sulfide",
    "molarMass": "78.04",
    "geometry": "Ionic (formula unit)",
    "bondAngle": "—",
    "polarity": "Ionic",
    "fact": "Smells of rotten eggs in moist air because it releases H₂S.",
    "angleSource": "—"
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
    "formula": "F2",
    "label": "F₂ — Fluorine",
    "group": "Covalent molecules"
  },
  {
    "formula": "Cl2",
    "label": "Cl₂ — Chlorine",
    "group": "Covalent molecules"
  },
  {
    "formula": "Br2",
    "label": "Br₂ — Bromine",
    "group": "Covalent molecules"
  },
  {
    "formula": "I2",
    "label": "I₂ — Iodine",
    "group": "Covalent molecules"
  },
  {
    "formula": "HF",
    "label": "HF — Hydrogen fluoride",
    "group": "Covalent molecules"
  },
  {
    "formula": "HBr",
    "label": "HBr — Hydrogen bromide",
    "group": "Covalent molecules"
  },
  {
    "formula": "HI",
    "label": "HI — Hydrogen iodide",
    "group": "Covalent molecules"
  },
  {
    "formula": "PH3",
    "label": "PH₃ — Phosphine",
    "group": "Covalent molecules"
  },
  {
    "formula": "AsH3",
    "label": "AsH₃ — Arsine",
    "group": "Covalent molecules"
  },
  {
    "formula": "SiH4",
    "label": "SiH₄ — Silane",
    "group": "Covalent molecules"
  },
  {
    "formula": "H2Se",
    "label": "H₂Se — Hydrogen selenide",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH3Cl",
    "label": "CH₃Cl — Chloromethane",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH2Cl2",
    "label": "CH₂Cl₂ — Dichloromethane",
    "group": "Covalent molecules"
  },
  {
    "formula": "CHCl3",
    "label": "CHCl₃ — Chloroform",
    "group": "Covalent molecules"
  },
  {
    "formula": "CCl4",
    "label": "CCl₄ — Carbon tetrachloride",
    "group": "Covalent molecules"
  },
  {
    "formula": "CF4",
    "label": "CF₄ — Tetrafluoromethane",
    "group": "Covalent molecules"
  },
  {
    "formula": "SiCl4",
    "label": "SiCl₄ — Silicon tetrachloride",
    "group": "Covalent molecules"
  },
  {
    "formula": "SiF4",
    "label": "SiF₄ — Silicon tetrafluoride",
    "group": "Covalent molecules"
  },
  {
    "formula": "BF3",
    "label": "BF₃ — Boron trifluoride",
    "group": "Covalent molecules"
  },
  {
    "formula": "BCl3",
    "label": "BCl₃ — Boron trichloride",
    "group": "Covalent molecules"
  },
  {
    "formula": "PCl3",
    "label": "PCl₃ — Phosphorus trichloride",
    "group": "Covalent molecules"
  },
  {
    "formula": "HCN",
    "label": "HCN — Hydrogen cyanide",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH2O",
    "label": "CH₂O — Formaldehyde",
    "group": "Covalent molecules"
  },
  {
    "formula": "HCOOH",
    "label": "HCOOH — Formic acid",
    "group": "Covalent molecules"
  },
  {
    "formula": "CH3COOH",
    "label": "CH₃COOH — Acetic acid",
    "group": "Covalent molecules"
  },
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
    "formula": "HOCl",
    "label": "HOCl — Hypochlorous acid",
    "group": "Covalent molecules"
  },
  {
    "formula": "HNO3",
    "label": "HNO₃ — Nitric acid",
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
    "formula": "SF4",
    "label": "SF₄ — Sulfur tetrafluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "SF6",
    "label": "SF₆ — Sulfur hexafluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "ClF3",
    "label": "ClF₃ — Chlorine trifluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "IF5",
    "label": "IF₅ — Iodine pentafluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "IF7",
    "label": "IF₇ — Iodine heptafluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "PCl5",
    "label": "PCl₅ — Phosphorus pentachloride",
    "group": "Expanded octets"
  },
  {
    "formula": "PF5",
    "label": "PF₅ — Phosphorus pentafluoride",
    "group": "Expanded octets"
  },
  {
    "formula": "SO3",
    "label": "SO₃ — Sulfur trioxide",
    "group": "Expanded octets"
  },
  {
    "formula": "H2SO4",
    "label": "H₂SO₄ — Sulfuric acid",
    "group": "Expanded octets"
  },
  {
    "formula": "H3PO4",
    "label": "H₃PO₄ — Phosphoric acid",
    "group": "Expanded octets"
  },
  {
    "formula": "XeF2",
    "label": "XeF₂ — Xenon difluoride",
    "group": "Noble-gas compounds"
  },
  {
    "formula": "XeF4",
    "label": "XeF₄ — Xenon tetrafluoride",
    "group": "Noble-gas compounds"
  },
  {
    "formula": "XeO3",
    "label": "XeO₃ — Xenon trioxide",
    "group": "Noble-gas compounds"
  },
  {
    "formula": "KrF2",
    "label": "KrF₂ — Krypton difluoride",
    "group": "Noble-gas compounds"
  },
  {
    "formula": "LiF",
    "label": "LiF — Lithium fluoride",
    "group": "Ionic compounds"
  },
  {
    "formula": "LiCl",
    "label": "LiCl — Lithium chloride",
    "group": "Ionic compounds"
  },
  {
    "formula": "NaF",
    "label": "NaF — Sodium fluoride",
    "group": "Ionic compounds"
  },
  {
    "formula": "NaBr",
    "label": "NaBr — Sodium bromide",
    "group": "Ionic compounds"
  },
  {
    "formula": "KCl",
    "label": "KCl — Potassium chloride",
    "group": "Ionic compounds"
  },
  {
    "formula": "KI",
    "label": "KI — Potassium iodide",
    "group": "Ionic compounds"
  },
  {
    "formula": "MgO",
    "label": "MgO — Magnesium oxide",
    "group": "Ionic compounds"
  },
  {
    "formula": "CaO",
    "label": "CaO — Calcium oxide",
    "group": "Ionic compounds"
  },
  {
    "formula": "MgCl2",
    "label": "MgCl₂ — Magnesium chloride",
    "group": "Ionic compounds"
  },
  {
    "formula": "CaCl2",
    "label": "CaCl₂ — Calcium chloride",
    "group": "Ionic compounds"
  },
  {
    "formula": "CaF2",
    "label": "CaF₂ — Calcium fluoride",
    "group": "Ionic compounds"
  },
  {
    "formula": "Li2O",
    "label": "Li₂O — Lithium oxide",
    "group": "Ionic compounds"
  },
  {
    "formula": "K2O",
    "label": "K₂O — Potassium oxide",
    "group": "Ionic compounds"
  },
  {
    "formula": "Na2S",
    "label": "Na₂S — Sodium sulfide",
    "group": "Ionic compounds"
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
export const EXTRA_ACID_BASE_CONTRIBUTIONS = {
  "HF": -0.6,
  "HBr": -1.8,
  "HI": -1.8,
  "HNO3": -1.8,
  "H2SO4": -2.0,
  "H3PO4": -0.8,
  "HCOOH": -0.6,
  "CH3COOH": -0.5,
  "HCN": -0.2,
  "HOCl": -0.3,
  "H2Se": -0.4,
  "Li2O": 1.8,
  "K2O": 1.8,
  "CaO": 1.4,
  "MgO": 0.8,
  "Na2S": 1.2
};
