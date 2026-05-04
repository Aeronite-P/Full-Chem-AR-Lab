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
};

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
});

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const yesButtonRef = useRef(null);
  const noButtonRef = useRef(null);
  const moleculesRef = useRef([]);
  const bondsRef = useRef([]);
  const tempBondStateRef = useRef({
    mouse: null,
    Left: null,
    Right: null,
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
  const [, setWaterOverlayFrame] = useState(0);
  const [, setPromptedMoleculeCombos] = useState({});
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
    moleculePromptRef.current = prompt;
    setMoleculePrompt(prompt);
  };

  const setPromptedComboStatus = (comboKey, status) => {
    setPromptedMoleculeCombos((current) => {
      const nextValue = { ...current, [comboKey]: status };
      promptedMoleculeCombosRef.current = nextValue;
      return nextValue;
    });
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

    if (atomType === "O") {
      return 2;
    }

    if (atomType === "N") {
      return 3;
    }

    if (atomType === "C") {
      return 4;
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

    return 0;
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

  const getVisualScale = () => atomSizeScaleRef.current;

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
    const strength = getHydrogenBondStrength(
      closestCandidate.distancePx,
      minDistancePx,
      targetDistancePx,
      maxDistancePx
    );

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
      }),
    ];
    atomsRef.current = atomsRef.current.map((atom) =>
      atomIds.includes(atom.id) ? { ...atom, moleculeId } : atom
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
      tempBondStateRef.current = {
        mouse: atomIdsToDelete.has(tempBondStateRef.current.mouse?.startAtomId)
          ? null
          : tempBondStateRef.current.mouse,
        Left: atomIdsToDelete.has(tempBondStateRef.current.Left?.startAtomId)
          ? null
          : tempBondStateRef.current.Left,
        Right: atomIdsToDelete.has(tempBondStateRef.current.Right?.startAtomId)
          ? null
          : tempBondStateRef.current.Right,
      };
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
    tempBondStateRef.current = {
      mouse: atomIdsToDelete.has(tempBondStateRef.current.mouse?.startAtomId)
        ? null
        : tempBondStateRef.current.mouse,
      Left: atomIdsToDelete.has(tempBondStateRef.current.Left?.startAtomId)
        ? null
        : tempBondStateRef.current.Left,
      Right: atomIdsToDelete.has(tempBondStateRef.current.Right?.startAtomId)
        ? null
        : tempBondStateRef.current.Right,
    };
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
        tempBondStateRef.current = {
          mouse: null,
          Left: null,
          Right: null,
        };
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

  const findAtomIndexAtCanvasPoint = (canvasX, canvasY, hitRadius = getScaledAtomRadiusPx()) =>
    atomsRef.current.findIndex(({ position }) => {
      const atomX = position.x * canvasRef.current.width;
      const atomY = position.y * canvasRef.current.height;
      return Math.hypot(canvasX - atomX, canvasY - atomY) <= hitRadius;
    });

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

  const handleViewportMouseDown = (event) => {
    if (event.target !== viewportRef.current && event.target !== videoRef.current) {
      return;
    }

    if (!bondingModeRef.current || deleteModeRef.current) {
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event);

    if (!canvasPoint) {
      return;
    }

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
  };

  const handleViewportMouseMove = (event) => {
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

      hoveredMoleculeIdRef.current = hoveredMolecule?.id ?? null;
    } else {
      hoveredMoleculeIdRef.current = null;
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
  };

  const handleViewportMouseUp = (event) => {
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

  const handleViewportMouseLeave = (event) => {
    hoveredMoleculeIdRef.current = null;
    handleViewportMouseUp(event);
  };

  const handleViewportClick = (event) => {
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
        tempBondStateRef.current = {
          mouse: tempBondStateRef.current.mouse?.startAtomId === atomToDelete.id
            ? null
            : tempBondStateRef.current.mouse,
          Left: tempBondStateRef.current.Left?.startAtomId === atomToDelete.id
            ? null
            : tempBondStateRef.current.Left,
          Right: tempBondStateRef.current.Right?.startAtomId === atomToDelete.id
            ? null
            : tempBondStateRef.current.Right,
        };

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
  const currentWaterToggleMoleculeId = getWaterToggleTargetMoleculeId();
  const currentWaterToggleMolecule =
    currentWaterToggleMoleculeId !== null ? getMoleculeById(currentWaterToggleMoleculeId) : null;

  // The camera + animation loop intentionally captures the initial handlers and refs.
  useEffect(() => {
    let stream;
    let handLandmarker;
    let animationFrameId;
    let isMounted = true;
    const handStates = {
      Left: {
        isPinching: false,
        grabbedAtomIndex: null,
        grabbedMoleculeId: null,
        moleculeGrabOffset: null,
        popupPinchHandled: false,
        bondStartAtomId: null,
      },
      Right: {
        isPinching: false,
        grabbedAtomIndex: null,
        grabbedMoleculeId: null,
        moleculeGrabOffset: null,
        popupPinchHandled: false,
        bondStartAtomId: null,
      },
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
    };

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          },
          numHands: 2,
          runningMode: "VIDEO",
        });

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context || !isMounted) {
          return;
        }

        const drawFrame = () => {
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
            if (molecule.formula === "2H2O") {
              return null;
            }

            if (
              molecule.formula === "H2" ||
              molecule.formula === "O2" ||
              molecule.formula === "N2" ||
              molecule.formula === "CO"
            ) {
              return null;
            }

            if (molecule.formula === "H2O") {
              return moleculeAtoms.find((atom) => atom.type === "O") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "CO2") {
              return moleculeAtoms.find((atom) => atom.type === "C") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "CH4") {
              return moleculeAtoms.find((atom) => atom.type === "C") ?? moleculeAtoms[0];
            }

            if (molecule.formula === "NH3") {
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
            const lonePairCount = getLonePairCount(molecule.formula, atom.type);

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
            if (!showLonePairsRef.current || atom.moleculeId === null) {
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

          const drawBondStick = (
            startPosition,
            endPosition,
            trimScale = 0.88,
            perpendicularOffsetPx = 0
          ) => {
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

            context.beginPath();
            context.moveTo(startX + unitX * trim + offsetX, startY + unitY * trim + offsetY);
            context.lineTo(endX - unitX * trim + offsetX, endY - unitY * trim + offsetY);
            context.stroke();
          };

          const drawBondOrderStick = (startPosition, endPosition, order = 1, trimScale = 0.88) => {
            if (order <= 1) {
              drawBondStick(startPosition, endPosition, trimScale);
              return;
            }

            const offsets =
              order === 2
                ? [-3 * getVisualScale(), 3 * getVisualScale()]
                : [-4 * getVisualScale(), 0, 4 * getVisualScale()];

            offsets.forEach((offset) => {
              drawBondStick(startPosition, endPosition, trimScale, offset);
            });
          };

          const drawMoleculeBondSticks = (molecule) => {
            if (molecule.formula === "H2O" && molecule.visualMode === "waterDroplet") {
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
                drawBondStick(oxygenAtom.position, hydrogenAtom.position);
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
              drawBondOrderStick(leftAtom.position, rightAtom.position, bondOrder);
            }

            if (molecule.formula === "CO2") {
              const leftOxygenAtom = getAtomById(molecule.atomIds[0]);
              const carbonAtom = getAtomById(molecule.atomIds[1]);
              const rightOxygenAtom = getAtomById(molecule.atomIds[2]);

              if (!leftOxygenAtom || !carbonAtom || !rightOxygenAtom) {
                return;
              }

              drawBondStick(leftOxygenAtom.position, carbonAtom.position);
              drawBondStick(carbonAtom.position, rightOxygenAtom.position);
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
                drawBondStick(carbonAtom.position, hydrogenAtom.position);
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
                drawBondStick(nitrogenAtom.position, hydrogenAtom.position);
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
                return;
              }

              drawBondStick(carbonAtom.position, doubleOxygenAtom.position);
              drawBondStick(carbonAtom.position, leftHydroxylOxygenAtom.position);
              drawBondStick(carbonAtom.position, rightHydroxylOxygenAtom.position);
              drawBondStick(leftHydroxylOxygenAtom.position, leftHydrogenAtom.position, 0.7);
              drawBondStick(rightHydroxylOxygenAtom.position, rightHydrogenAtom.position, 0.7);
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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
            if (moleculePromptRef.current) {
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

          const tryTriggerCarbonicAcidReaction = () => {
            if (moleculePromptRef.current) {
              return;
            }

            const waterMolecules = moleculesRef.current.filter((molecule) => molecule.formula === "H2O");
            const carbonDioxideMolecules = moleculesRef.current.filter(
              (molecule) => molecule.formula === "CO2"
            );

            for (const waterMolecule of waterMolecules) {
              for (const carbonDioxideMolecule of carbonDioxideMolecules) {
                if (!waterMolecule.center || !carbonDioxideMolecule.center) {
                  continue;
                }

                const distancePx =
                  Math.hypot(
                    waterMolecule.center.x - carbonDioxideMolecule.center.x,
                    waterMolecule.center.y - carbonDioxideMolecule.center.y
                  ) * Math.min(canvas.width, canvas.height);

                if (distancePx > 126) {
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
            if (moleculePromptRef.current) {
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
                molecule.formula === "N2"
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

              if (molecule.formula === "CH4") {
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

                if (!carbonAtom || carbonAtom.type !== "C" || hydrogenAtoms.length !== 4) {
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

              if (molecule.formula === "NH3") {
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

                if (!nitrogenAtom || nitrogenAtom.type !== "N" || hydrogenAtoms.length !== 3) {
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

                if (molecule.formula === "H2O") {
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
                  molecule.formula === "N2"
                ) {
                  layoutDiatomicMolecule(
                    molecule,
                    molecule.center ?? getAtomGroupCenter(getMoleculeAtoms(molecule))
                  );
                } else if (molecule.formula === "CH4") {
                  const carbonAtom = getAtomById(molecule.atomIds[0]);

                  if (carbonAtom) {
                    layoutMethaneMolecule(molecule, atomMap.get(carbonAtom.id) ?? carbonAtom);
                  }
                } else if (molecule.formula === "NH3") {
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

          if (!video.videoWidth || !video.videoHeight) {
            animationFrameId = requestAnimationFrame(drawFrame);
            return;
          }

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const results = handLandmarker.detectForVideo(video, performance.now());

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = "#67e8f9";
          const activeHands = new Set();

          for (const [handIndex, landmarks] of results.landmarks.entries()) {
            const handLabel = results.handednesses?.[handIndex]?.[0]?.categoryName;
            const handState =
              handLabel === "Left" || handLabel === "Right" ? handStates[handLabel] : null;
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            let pinchDetected = false;

            if (handState) {
              activeHands.add(handLabel);
            }

            if (thumbTip && indexTip) {
              const dx = thumbTip.x - indexTip.x;
              const dy = thumbTip.y - indexTip.y;
              const distance = Math.hypot(dx, dy);
              const pinchStartThreshold = 0.05;
              const pinchEndThreshold = 0.07;

              if (distance < pinchStartThreshold) {
                pinchDetected = true;
              } else if (handState?.isPinching && distance <= pinchEndThreshold) {
                pinchDetected = true;
              }
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
                    tempBondStateRef.current[handLabel] = {
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
                  const otherHandLabel = handLabel === "Left" ? "Right" : "Left";
                  const otherGrabbedAtomIndex = handStates[otherHandLabel].grabbedAtomIndex;
                  const otherGrabbedMoleculeId = handStates[otherHandLabel].grabbedMoleculeId;
                  const otherGrabbedMolecule = otherGrabbedMoleculeId !== null
                    ? getMoleculeById(otherGrabbedMoleculeId)
                    : null;
                  const occupiedMoleculeIds = new Set(
                    otherGrabbedMoleculeId === null
                      ? []
                      : isWaterClusterMolecule(otherGrabbedMolecule)
                        ? [otherGrabbedMoleculeId, ...(otherGrabbedMolecule.memberMoleculeIds ?? [])]
                        : [
                            otherGrabbedMoleculeId,
                            ...(
                              getClusterForMemberMoleculeId(otherGrabbedMoleculeId)
                                ?.memberMoleculeIds ?? []
                            ),
                          ]
                  );

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
                    }
                  }

                  if (handState.grabbedAtomIndex === null && handState.grabbedMoleculeId === null) {
                    handState.grabbedAtomIndex = atomsRef.current.findIndex(
                      ({ position, moleculeId }, atomIndex) => {
                        if (atomIndex === otherGrabbedAtomIndex) {
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
                      }
                    );

                    if (handState.grabbedAtomIndex < 0) {
                      handState.grabbedAtomIndex = null;
                    }
                  }

                  if (handState.grabbedMoleculeId !== null) {
                    const grabbedMolecule = moleculesRef.current.find(
                      (molecule) => molecule.id === handState.grabbedMoleculeId
                    );

                    if (grabbedMolecule) {
                      moveMoleculeTo(grabbedMolecule, {
                        x: indexTip.x - (handState.moleculeGrabOffset?.x ?? 0),
                        y: indexTip.y - (handState.moleculeGrabOffset?.y ?? 0),
                      });
                    } else {
                      handState.grabbedMoleculeId = null;
                      handState.moleculeGrabOffset = null;
                    }
                  } else if (handState.grabbedAtomIndex !== null) {
                    const grabbedAtom = atomsRef.current[handState.grabbedAtomIndex];

                    if (grabbedAtom?.moleculeId === null) {
                      atomsRef.current[handState.grabbedAtomIndex] = {
                        ...grabbedAtom,
                        position: clampPosition({
                          x: indexTip.x,
                          y: indexTip.y,
                        }),
                      };
                    }
                  }
                }
              } else {
                if (bondingModeRef.current && handState.bondStartAtomId !== null) {
                  const releasePoint = tempBondStateRef.current[handLabel]?.currentPosition;

                  if (releasePoint) {
                    finalizeBondAtCanvasPoint(
                      handState.bondStartAtomId,
                      releasePoint.x,
                      releasePoint.y
                    );
                  }

                  tempBondStateRef.current[handLabel] = null;
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

          if (deleteModeRef.current) {
            handStates.Left.isPinching = false;
            handStates.Left.grabbedAtomIndex = null;
            handStates.Left.grabbedMoleculeId = null;
            handStates.Left.moleculeGrabOffset = null;
            handStates.Left.bondStartAtomId = null;
            handStates.Right.isPinching = false;
            handStates.Right.grabbedAtomIndex = null;
            handStates.Right.grabbedMoleculeId = null;
            handStates.Right.moleculeGrabOffset = null;
            handStates.Right.bondStartAtomId = null;
            tempBondStateRef.current.Left = null;
            tempBondStateRef.current.Right = null;
          } else {
            for (const handLabel of ["Left", "Right"]) {
              if (!activeHands.has(handLabel)) {
                handStates[handLabel].isPinching = false;
                handStates[handLabel].grabbedAtomIndex = null;
                handStates[handLabel].grabbedMoleculeId = null;
                handStates[handLabel].moleculeGrabOffset = null;
                handStates[handLabel].popupPinchHandled = false;
                handStates[handLabel].bondStartAtomId = null;
                tempBondStateRef.current[handLabel] = null;
              }
            }
          }

          grabbedMoleculeIdsRef.current = new Set(
            Object.values(handStates)
              .flatMap((handState) => {
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

          syncPendingMoleculePrompt();
          tryFormWaterMolecules();
          tryFormHydrogenMolecules();
          tryFormCarbonMonoxideMolecules();
          tryFormOxygenMolecules();
          tryFormNitrogenMolecules();
          tryFormCarbonDioxideMolecules();
          tryFormAmmoniaMolecules();
          tryFormMethaneMolecules();
          tryTriggerCarbonicAcidReaction();
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
              0.84
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
              molecule.formula !== "H2" &&
              molecule.formula !== "O2" &&
              molecule.formula !== "N2" &&
              molecule.formula !== "H2O" &&
              molecule.formula !== "CO2" &&
              molecule.formula !== "CH4" &&
              molecule.formula !== "NH3" &&
              molecule.formula !== "H2CO3" &&
              molecule.formula !== "2H2O"
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
            if (molecule.formula === "H2O" || molecule.formula === "2H2O") {
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
            const atomScale = atomAnimationScales.get(atomId) ?? 1;
            const drawRadius = atomRadius * atomScale;

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

            if (atomScale > 1) {
              context.beginPath();
              context.arc(atomX, atomY, drawRadius + 10 * getVisualScale(), 0, Math.PI * 2);
              context.fillStyle = "rgba(125, 211, 252, 0.18)";
              context.fill();
            }

            context.beginPath();
            context.arc(atomX, atomY, drawRadius, 0, Math.PI * 2);
            context.fillStyle = atomGradient;
            context.fill();

            if (isSelected) {
              context.beginPath();
              context.arc(atomX, atomY, drawRadius + 6 * getVisualScale(), 0, Math.PI * 2);
              context.strokeStyle = "rgba(125, 211, 252, 0.9)";
              context.lineWidth = 3 * getVisualScale();
              context.stroke();
            }

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

            if (parentMolecule) {
              drawAtomLonePairs(atom, parentMolecule, drawRadius);
            }

            context.save();
            context.translate(atomX, atomY);
            context.scale(-1, 1);
            context.fillStyle = atomStyle.text;
            context.font = `600 ${drawRadius * 0.72}px system-ui`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.shadowColor = "rgba(0, 0, 0, 0.18)";
            context.shadowBlur = 2;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 1;
            context.fillText(type, 0, 0.5);
            context.restore();
          }

          for (const molecule of moleculesRef.current) {
            drawWaterDimerAnnotations(molecule);
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
  }, []);

  // Keyboard shortcuts intentionally read the current ref-backed state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "m" || event.key === "M") {
        setMenuOpen((current) => !current);
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
  }, []);

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

  return (
    <div
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

        .app-shell {
          width: min(100%, 1320px);
          margin: 0 auto;
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
          gap: clamp(10px, 1.8vw, 16px);
        }

        .camera-title {
          margin: 0;
          font-size: clamp(1.4rem, 2.8vw, 2rem);
          line-height: 1.1;
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

          .size-slider-panel {
            justify-self: center;
            max-width: min(240px, 100%);
          }

          .control-panel {
            justify-self: center;
            max-width: min(300px, 100%);
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
      <div className="app-shell">
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          zIndex: 1,
          fontSize: "clamp(10px, 1.2vw, 12px)",
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
          marginBottom: "clamp(10px, 2vw, 18px)",
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
          padding: "clamp(10px, 1.4vw, 14px) clamp(10px, 1.4vw, 12px)",
          textAlign: "left",
          background: "rgba(15, 23, 42, 0.58)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
        }}
      >
        <div style={{ fontSize: "clamp(12px, 1.4vw, 13px)", fontWeight: 700, marginBottom: "10px" }}>
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
            fontSize: "clamp(11px, 1.4vw, 12px)",
            opacity: 0.78,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {atomSizeScale.toFixed(2)}x
        </div>
        <label
          style={{
            marginTop: "clamp(10px, 1.5vw, 12px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(8px, 1.2vw, 10px)",
            fontSize: "clamp(11px, 1.2vw, 12px)",
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
            gap: "clamp(8px, 1.6vw, 12px)",
            marginBottom: "clamp(10px, 1.6vw, 14px)",
          }}
        >
          <div>
            <div style={{ fontSize: "clamp(14px, 1.8vw, 15px)", fontWeight: 700 }}>Controls</div>
            <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", opacity: 0.66, marginTop: "3px" }}>
              Press M to toggle the atom menu
            </div>
          </div>
          <div
            style={{
              padding: "5px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              background: menuOpen ? "rgba(125, 211, 252, 0.16)" : "rgba(255, 255, 255, 0.06)",
              color: menuOpen ? "#bae6fd" : "rgba(255, 255, 255, 0.72)",
              fontSize: "clamp(10px, 1.2vw, 11px)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {menuOpen ? "Menu Open" : "Menu Closed"}
          </div>
        </div>
        {menuOpen ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.5vw, 12px)" }}>
            <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Atom Menu
            </div>
            <button
              type="button"
              onClick={toggleDeleteMode}
              style={{
                padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
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
                padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
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
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "clamp(8px, 1.4vw, 10px)",
              }}
            >
              <button
                type="button"
                onClick={() => spawnAtom("H")}
                style={{
                  padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Hydrogen (H)
              </button>
              <button
                type="button"
                onClick={() => spawnAtom("O")}
                style={{
                  padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Oxygen (O)
              </button>
              <button
                type="button"
                onClick={() => spawnAtom("C")}
                style={{
                  padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Carbon (C)
              </button>
              <button
                type="button"
                onClick={() => spawnAtom("N")}
                style={{
                  padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Nitrogen (N)
              </button>
            </div>
          </div>
        ) : null}
        <div
          style={{
            marginTop: menuOpen ? "clamp(12px, 1.8vw, 16px)" : "0",
            paddingTop: menuOpen ? "clamp(12px, 1.8vw, 16px)" : "0",
            borderTop: menuOpen ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(10px, 1.5vw, 12px)",
          }}
        >
          <div
            style={{
              padding: "clamp(10px, 1.6vw, 12px) clamp(12px, 1.8vw, 14px)",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(11px, 1.4vw, 12px)",
                opacity: 0.68,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "8px",
              }}
            >
              Current Molecule
            </div>
            {currentWaterToggleMolecule ? (
              <>
                <div style={{ fontSize: "clamp(13px, 1.7vw, 14px)", fontWeight: 700, marginBottom: "8px" }}>
                  {currentWaterToggleMolecule.displayLabel}
                </div>
                <button
                  type="button"
                  onClick={() => toggleWaterVisualMode(currentWaterToggleMolecule.id)}
                  style={{
                    width: "100%",
                    padding: "clamp(8px, 1.4vw, 10px) clamp(10px, 1.6vw, 12px)",
                    borderRadius: "10px",
                    border: "1px solid rgba(125, 211, 252, 0.24)",
                    background: "rgba(14, 116, 144, 0.18)",
                    color: "#d9faff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Toggle Water Visual ({currentWaterToggleMolecule.visualMode === "waterDroplet" ? "Orb" : "Default"})
                </button>
              </>
            ) : (
              <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", opacity: 0.72, lineHeight: 1.5 }}>
                Hover or grab a water molecule to enable its visual toggle.
              </div>
            )}
          </div>
          {selectedAtomDetails ? (
            <div
              style={{
                padding: "clamp(10px, 1.6vw, 12px) clamp(12px, 1.8vw, 14px)",
                textAlign: "left",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                color: "white",
              }}
            >
              <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", opacity: 0.68, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Selected Atom
              </div>
              <div style={{ fontSize: "clamp(14px, 1.8vw, 15px)", fontWeight: 700, marginTop: "8px" }}>
                {selectedAtomDetails.name}
              </div>
              <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", opacity: 0.8, marginTop: "2px" }}>
                {selectedAtomDetails.symbol}
              </div>
              <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", marginTop: "8px", lineHeight: 1.45 }}>
                <div>Atomic number: {selectedAtomDetails.atomicNumber}</div>
                <div>Valence electrons: {selectedAtomDetails.valenceElectrons}</div>
                <div>Common bonds: {selectedAtomDetails.commonBonds}</div>
              </div>
            </div>
          ) : null}
          {deleteMode ? (
            <div style={{ fontSize: "clamp(12px, 1.5vw, 13px)", color: "#fca5a5", fontWeight: 700 }}>
              Delete Mode is ON
            </div>
          ) : null}
          {bondingMode ? (
            <div style={{ fontSize: "clamp(12px, 1.5vw, 13px)", color: "#7dd3fc", fontWeight: 700 }}>
              Bonding Mode is ON
            </div>
          ) : null}
          {bondLimitMessage ? (
            <div style={{ fontSize: "clamp(11px, 1.4vw, 12px)", color: "#fca5a5", fontWeight: 700 }}>
              {bondLimitMessage}
            </div>
          ) : null}
        </div>
      </div>
        <div className="camera-column">
      <h1 className="camera-title">Chem AR Camera Test</h1>
      <div className="camera-frame-wrap">
          <div
            className="camera-viewport"
            ref={viewportRef}
            onClick={handleViewportClick}
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onMouseLeave={handleViewportMouseLeave}
          >
        {moleculePrompt ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "clamp(10px, 2vw, 16px)",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(8px, 1.5vw, 10px)",
              alignItems: "center",
              padding: "clamp(12px, 1.8vw, 14px) clamp(12px, 2vw, 16px)",
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
              <div style={{ fontSize: "clamp(13px, 1.8vw, 15px)", fontWeight: 700 }}>
              {moleculePrompt.kind === "reaction" && moleculePrompt.type === "carbonicAcid"
                ? "React water and carbon dioxide into carbonic acid (H2CO3)?"
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
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}

export default App;
