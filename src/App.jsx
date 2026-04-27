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
    { id: 0, element: "H", position: { x: 0.32, y: 0.42 }, moleculeId: null },
    { id: 1, element: "O", position: { x: 0.5, y: 0.5 }, moleculeId: null },
    { id: 2, element: "C", position: { x: 0.68, y: 0.42 }, moleculeId: null },
  ]);
  const spawnCountRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [bondingMode, setBondingMode] = useState(false);
  const [selectedAtomIndex, setSelectedAtomIndex] = useState(null);
  const [waterPrompt, setWaterPrompt] = useState(null);
  const [, setPromptedWaterCombos] = useState({});
  const deleteModeRef = useRef(false);
  const bondingModeRef = useRef(false);
  const selectedAtomIndexRef = useRef(null);
  const waterPromptRef = useRef(null);
  const promptedWaterCombosRef = useRef({});

  const setWaterPromptState = (prompt) => {
    waterPromptRef.current = prompt;
    setWaterPrompt(prompt);
  };

  const setPromptedComboStatus = (comboKey, status) => {
    setPromptedWaterCombos((current) => {
      const nextValue = { ...current, [comboKey]: status };
      promptedWaterCombosRef.current = nextValue;
      return nextValue;
    });
  };

  const getWaterComboKey = (atomIds) => [...atomIds].sort((left, right) => left - right).join("-");

  const getBondKey = (leftAtomId, rightAtomId) =>
    [leftAtomId, rightAtomId].sort((left, right) => left - right).join("-");

  const setSelectedAtom = (atomIndex) => {
    selectedAtomIndexRef.current = atomIndex;
    setSelectedAtomIndex(atomIndex);
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
    moleculesRef.current = moleculesRef.current.filter((molecule) => molecule.id !== moleculeId);
    atomsRef.current = atomsRef.current.map((atom) =>
      atom.moleculeId === moleculeId ? { ...atom, moleculeId: null } : atom
    );
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

  const createBond = (startAtomId, endAtomId) => {
    if (startAtomId === endAtomId) {
      return false;
    }

    const bondKey = getBondKey(startAtomId, endAtomId);

    if (
      bondsRef.current.some(
        ({ atomIds }) => getBondKey(atomIds[0], atomIds[1]) === bondKey
      )
    ) {
      return false;
    }

    bondsRef.current = [...bondsRef.current, { atomIds: [startAtomId, endAtomId] }];
    return true;
  };

  const confirmWaterFormation = (prompt) => {
    if (!prompt) {
      return;
    }

    const promptAtoms = prompt.atomIds
      .map((atomId) => atomsRef.current.find((atom) => atom.id === atomId))
      .filter(Boolean);
    const oxygenAtom = promptAtoms.find((atom) => atom.element === "O" && atom.moleculeId === null);
    const hydrogenAtoms = promptAtoms.filter(
      (atom) => atom.element === "H" && atom.moleculeId === null
    );

    if (!oxygenAtom || hydrogenAtoms.length !== 2) {
      setWaterPromptState(null);
      return;
    }

    createBond(oxygenAtom.id, hydrogenAtoms[0].id);
    createBond(oxygenAtom.id, hydrogenAtoms[1].id);

    const moleculeId = nextMoleculeIdRef.current;
    const center = getAtomGroupCenter(promptAtoms);
    const originPositions = Object.fromEntries(
      promptAtoms.map((atom) => [atom.id, { ...atom.position }])
    );

    nextMoleculeIdRef.current += 1;
    moleculesRef.current = [
      ...moleculesRef.current,
      {
        id: moleculeId,
        formula: "H2O",
        atomIds: [oxygenAtom.id, ...hydrogenAtoms.map((atom) => atom.id)],
        center,
        radius: getAtomGroupRadius(promptAtoms, center),
        atomOffsets: Object.fromEntries(
          promptAtoms.map((atom) => [
            atom.id,
            {
              x: atom.position.x - center.x,
              y: atom.position.y - center.y,
            },
          ])
        ),
        snapStartedAt: performance.now(),
        snapDuration: 240,
        originPositions,
      },
    ];
    atomsRef.current = atomsRef.current.map((atom) =>
      atom.id === oxygenAtom.id || hydrogenAtoms.some((hydrogenAtom) => hydrogenAtom.id === atom.id)
        ? { ...atom, moleculeId }
        : atom
    );
    setPromptedComboStatus(prompt.comboKey, "accepted");
    setWaterPromptState(null);
  };

  const declineWaterFormation = (prompt) => {
    if (!prompt) {
      return;
    }

    setPromptedComboStatus(prompt.comboKey, "declined");
    setWaterPromptState(null);
  };

  const spawnAtom = (element) => {
    const spawnIndex = spawnCountRef.current;
    const offsetX = ((spawnIndex % 3) - 1) * 0.06;
    const offsetY = (Math.floor(spawnIndex / 3) % 2) * 0.06 - 0.03;

    atomsRef.current = [
      ...atomsRef.current,
      {
        id: nextAtomIdRef.current,
        element,
        position: {
          x: Math.min(0.8, Math.max(0.2, 0.5 + offsetX)),
          y: Math.min(0.8, Math.max(0.2, 0.5 + offsetY)),
        },
        moleculeId: null,
      },
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

  const findAtomIndexAtCanvasPoint = (canvasX, canvasY, hitRadius = 24) =>
    atomsRef.current.findIndex(({ position }) => {
      const atomX = position.x * canvasRef.current.width;
      const atomY = position.y * canvasRef.current.height;
      return Math.hypot(canvasX - atomX, canvasY - atomY) <= hitRadius;
    });

  const finalizeBondAtCanvasPoint = (startAtomId, canvasX, canvasY) => {
    const targetAtomIndex = findAtomIndexAtCanvasPoint(canvasX, canvasY, 42);
    const targetAtom = targetAtomIndex >= 0 ? atomsRef.current[targetAtomIndex] : null;

    if (!targetAtom || targetAtom.id === startAtomId) {
      return false;
    }

    return createBond(startAtomId, targetAtom.id);
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

    const atomIndex = findAtomIndexAtCanvasPoint(canvasPoint.x, canvasPoint.y, 42);
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
    if (!tempBondStateRef.current.mouse) {
      return;
    }

    const canvasPoint = getCanvasCoordinatesFromMouseEvent(event);

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
    const atomRadius = 24;

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
          releaseMolecule(atomToDelete.moleculeId);
        }

        atomsRef.current = atomsRef.current.filter((_, index) => index !== atomIndex);
        bondsRef.current = bondsRef.current.filter(
          ({ atomIds }) => !atomIds.includes(atomToDelete.id)
        );
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
      }
      return;
    }

    setSelectedAtom(atomIndex >= 0 ? atomIndex : null);
  };

  const selectedAtom = selectedAtomIndex !== null ? atomsRef.current[selectedAtomIndex] : null;
  const selectedAtomDetails = selectedAtom ? ATOM_DETAILS[selectedAtom.element] : null;

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
    const atomRadius = 24;
    const atomGrabRadius = 50;
    const waterBondOffsets = [
      { x: -34, y: -30 },
      { x: 34, y: -30 },
    ];
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
        base: "#2563eb",
        highlight: "#93c5fd",
        mid: "#3b82f6",
        edge: "#1e3a8a",
        text: "#ffffff",
        outline: "#bfdbfe",
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
          const getWaterTargetPositions = (oxygenPosition) => ({
            0: clampPosition({
              x: oxygenPosition.x + waterBondOffsets[0].x / canvas.width,
              y: oxygenPosition.y + waterBondOffsets[0].y / canvas.height,
            }),
            1: clampPosition({
              x: oxygenPosition.x + waterBondOffsets[1].x / canvas.width,
              y: oxygenPosition.y + waterBondOffsets[1].y / canvas.height,
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

          const getMoleculeAtoms = (molecule) =>
            molecule.atomIds
              .map((atomId) => atomsRef.current.find((atom) => atom.id === atomId))
              .filter(Boolean);

          const syncMoleculeGeometry = (molecule) => {
            const moleculeAtoms = getMoleculeAtoms(molecule);

            if (moleculeAtoms.length === 0) {
              return molecule;
            }

            const center = getAtomGroupCenter(moleculeAtoms);

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

          const clampMoleculeCenter = (molecule, center) => {
            const moleculeRadius = molecule.radius ?? 0.08;
            const xMargin = moleculeRadius + atomRadius / canvas.width;
            const yMargin = moleculeRadius + atomRadius / canvas.height;

            return {
              x: Math.min(1 - xMargin, Math.max(xMargin, center.x)),
              y: Math.min(1 - yMargin, Math.max(yMargin, center.y)),
            };
          };

          const moveMoleculeTo = (molecule, nextCenter) => {
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
            moleculesRef.current.find((molecule) => {
              if (excludedMoleculeIds.has(molecule.id)) {
                return false;
              }

              syncMoleculeGeometry(molecule);

              const centerX = (molecule.center?.x ?? 0) * canvas.width;
              const centerY = (molecule.center?.y ?? 0) * canvas.height;
              const hitRadius =
                Math.max(molecule.radius ?? 0, atomRadius / Math.min(canvas.width, canvas.height)) *
                Math.min(canvas.width, canvas.height);

              return Math.hypot(canvasX - centerX, canvasY - centerY) <= hitRadius;
            }) ?? null;

          const layoutWaterMolecule = (molecule, oxygenAtom) => {
            const hydrogenAtoms = getMoleculeAtoms(molecule)
              .filter((atom) => atom.element === "H")
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

          const tryFormWaterMolecules = () => {
            if (waterPromptRef.current) {
              return;
            }

            const atomById = new Map(atomsRef.current.map((atom) => [atom.id, atom]));
            const adjacency = new Map();

            for (const { atomIds } of bondsRef.current) {
              const [leftAtomId, rightAtomId] = atomIds;
              const leftAtom = atomById.get(leftAtomId);
              const rightAtom = atomById.get(rightAtomId);

              if (!leftAtom || !rightAtom || leftAtom.moleculeId !== null || rightAtom.moleculeId !== null) {
                continue;
              }

              adjacency.set(leftAtomId, [...(adjacency.get(leftAtomId) ?? []), rightAtomId]);
              adjacency.set(rightAtomId, [...(adjacency.get(rightAtomId) ?? []), leftAtomId]);
            }

            const visited = new Set();

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

              if (componentAtomIds.length !== 3) {
                continue;
              }

              const componentAtoms = componentAtomIds
                .map((atomId) => atomById.get(atomId))
                .filter(Boolean);
              const oxygenAtoms = componentAtoms.filter(({ element }) => element === "O");
              const hydrogenAtoms = componentAtoms.filter(({ element }) => element === "H");

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
              const comboKey = getWaterComboKey(atomIds);

              if (promptedWaterCombosRef.current[comboKey]) {
                continue;
              }

              setPromptedComboStatus(comboKey, "prompted");
              setWaterPromptState({
                comboKey,
                atomIds,
              });
              return;
            }
          };

          const syncPendingWaterPrompt = () => {
            const currentPrompt = waterPromptRef.current;

            if (!currentPrompt) {
              return;
            }

            const promptAtoms = currentPrompt.atomIds
              .map((atomId) => atomsRef.current.find((atom) => atom.id === atomId))
              .filter(Boolean);

            if (
              promptAtoms.length !== 3 ||
              promptAtoms.some((atom) => atom.moleculeId !== null) ||
              promptAtoms.filter((atom) => atom.element === "O").length !== 1 ||
              promptAtoms.filter((atom) => atom.element === "H").length !== 2
            ) {
              setWaterPromptState(null);
            }
          };

          const animateWaterMolecules = () => {
            const now = performance.now();

            for (const molecule of moleculesRef.current) {
              if (molecule.formula !== "H2O" || !molecule.snapStartedAt) {
                continue;
              }

              const oxygenAtom = atomsRef.current.find(
                (atom) => atom.id === molecule.atomIds[0] && atom.element === "O"
              );
              const hydrogenAtoms = molecule.atomIds
                .slice(1)
                .map((atomId) => atomsRef.current.find((atom) => atom.id === atomId))
                .filter(Boolean)
                .sort((left, right) => left.position.x - right.position.x);

              if (!oxygenAtom || hydrogenAtoms.length !== 2) {
                continue;
              }

              const progress = Math.min(
                1,
                (now - molecule.snapStartedAt) / molecule.snapDuration
              );
              const easedProgress = 1 - (1 - progress) * (1 - progress);
              const targetPositions = getWaterTargetPositions(
                molecule.originPositions?.[oxygenAtom.id] ?? oxygenAtom.position
              );
              const atomMap = new Map(
                atomsRef.current.map((atom) => [
                  atom.id,
                  molecule.atomIds.includes(atom.id)
                    ? {
                        ...atom,
                        position:
                          atom.id === oxygenAtom.id
                            ? clampPosition(
                                molecule.originPositions?.[oxygenAtom.id] ?? oxygenAtom.position
                              )
                            : (() => {
                                const hydrogenIndex = hydrogenAtoms.findIndex(
                                  (hydrogenAtom) => hydrogenAtom.id === atom.id
                                );
                                const startPosition =
                                  molecule.originPositions?.[atom.id] ?? atom.position;
                                const targetPosition = targetPositions[hydrogenIndex];

                                return clampPosition({
                                  x:
                                    startPosition.x +
                                    (targetPosition.x - startPosition.x) * easedProgress,
                                  y:
                                    startPosition.y +
                                    (targetPosition.y - startPosition.y) * easedProgress,
                                });
                              })(),
                      }
                    : atom,
                ])
              );

              atomsRef.current = atomsRef.current.map((atom) => atomMap.get(atom.id) ?? atom);
              syncMoleculeGeometry(molecule);

              if (progress >= 1) {
                delete molecule.snapStartedAt;
                delete molecule.snapDuration;
                delete molecule.originPositions;
                layoutWaterMolecule(molecule, atomMap.get(oxygenAtom.id) ?? oxygenAtom);
              }
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

              if (waterPromptRef.current && pinchDetected && indexTip) {
                const yesTriggered = triggerPopupActionFromHand(
                  yesButtonRef,
                  () => confirmWaterFormation(waterPromptRef.current),
                  indexTip.x,
                  indexTip.y,
                  handState
                );

                if (!yesTriggered) {
                  triggerPopupActionFromHand(
                    noButtonRef,
                    () => declineWaterFormation(waterPromptRef.current),
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

                  if (handState.grabbedAtomIndex === null && handState.grabbedMoleculeId === null) {
                    const grabbedMolecule = findMoleculeAtCanvasPoint(
                      indexTipX,
                      indexTipY,
                      new Set(otherGrabbedMoleculeId !== null ? [otherGrabbedMoleculeId] : [])
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

                        if (
                          moleculeId !== null &&
                          otherGrabbedMoleculeId !== null &&
                          moleculeId === otherGrabbedMoleculeId
                        ) {
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

          syncPendingWaterPrompt();
          tryFormWaterMolecules();
          animateWaterMolecules();

          const atomAnimationScales = new Map();
          context.save();
          context.strokeStyle = "rgba(226, 232, 240, 0.95)";
          context.lineWidth = 4;
          context.lineCap = "round";

          for (const { atomIds } of bondsRef.current) {
            const [leftAtomId, rightAtomId] = atomIds;
            const leftAtom = atomsRef.current.find((atom) => atom.id === leftAtomId);
            const rightAtom = atomsRef.current.find((atom) => atom.id === rightAtomId);

            if (!leftAtom || !rightAtom) {
              continue;
            }

            context.beginPath();
            context.moveTo(leftAtom.position.x * canvas.width, leftAtom.position.y * canvas.height);
            context.lineTo(rightAtom.position.x * canvas.width, rightAtom.position.y * canvas.height);
            context.stroke();
          }

          context.restore();

          context.save();
          context.strokeStyle = "rgba(125, 211, 252, 0.9)";
          context.fillStyle = "rgba(125, 211, 252, 0.9)";
          context.lineWidth = 3;
          context.lineCap = "round";

          for (const tempBond of Object.values(tempBondStateRef.current)) {
            if (!tempBond?.currentPosition) {
              continue;
            }

            const startAtom = atomsRef.current.find((atom) => atom.id === tempBond.startAtomId);

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
            if (molecule.formula !== "H2O") {
              continue;
            }

            const oxygenAtom = atomsRef.current.find(
              (atom) => atom.id === molecule.atomIds[0] && atom.element === "O"
            );
            const hydrogenAtoms = molecule.atomIds
              .slice(1)
              .map((atomId) => atomsRef.current.find((atom) => atom.id === atomId))
              .filter(Boolean);

            if (!oxygenAtom || hydrogenAtoms.length !== 2) {
              releaseMolecule(molecule.id);
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
            const labelY =
              Math.min(
                oxygenAtom.position.y,
                hydrogenAtoms[0].position.y,
                hydrogenAtoms[1].position.y
              ) *
                canvas.height -
              28;

            context.save();
            context.translate(labelX, labelY);
            context.scale(-1, 1);
            context.fillStyle = "rgba(255, 255, 255, 0.92)";
            context.font = "600 14px system-ui";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(molecule.formula, 0, 0);
            context.restore();
          }

          for (const [atomIndex, { element, position }] of atomsRef.current.entries()) {
            const atomId = atomsRef.current[atomIndex].id;
            const atomStyle = atomStyles[element] ?? atomStyles.C;
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
              context.arc(atomX, atomY, drawRadius + 10, 0, Math.PI * 2);
              context.fillStyle = "rgba(125, 211, 252, 0.18)";
              context.fill();
            }

            context.beginPath();
            context.arc(atomX, atomY, drawRadius, 0, Math.PI * 2);
            context.fillStyle = atomGradient;
            context.fill();

            if (isSelected) {
              context.beginPath();
              context.arc(atomX, atomY, drawRadius + 6, 0, Math.PI * 2);
              context.strokeStyle = "rgba(125, 211, 252, 0.9)";
              context.lineWidth = 3;
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
            context.fillText(element, 0, 0.5);
            context.restore();
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "m" || event.key === "M") {
        setMenuOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        color: "white",
        padding: "36px 20px 20px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
          zIndex: 1,
          fontSize: "12px",
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
        }}
      >
        (C) SHIV PRAHALATHAN
      </div>
      <h1>Chem AR Camera Test</h1>
      <div
        ref={viewportRef}
        onClick={handleViewportClick}
        onMouseDown={handleViewportMouseDown}
        onMouseMove={handleViewportMouseMove}
        onMouseUp={handleViewportMouseUp}
        onMouseLeave={handleViewportMouseUp}
        style={{
          position: "relative",
          width: "600px",
          maxWidth: "90vw",
          margin: "0 auto",
        }}
        >
        {waterPrompt ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
              padding: "14px 16px",
              minWidth: "260px",
              background: "rgba(15, 23, 42, 0.84)",
              border: "1px solid rgba(125, 211, 252, 0.35)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 32px rgba(15, 23, 42, 0.28)",
              zIndex: 3,
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700 }}>
              Would you like to make water (H2O)?
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                ref={yesButtonRef}
                type="button"
                onClick={() => confirmWaterFormation(waterPrompt)}
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
                onClick={() => declineWaterFormation(waterPrompt)}
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
            borderRadius: "12px",
            transform: "scaleX(-1)",
          }}
        />
        {menuOpen ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "12px",
              minWidth: "120px",
              background: "rgba(15, 23, 42, 0.68)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "10px",
              backdropFilter: "blur(6px)",
              zIndex: 2,
            }}
          >
            <div style={{ fontSize: "12px", opacity: 0.8 }}>Spawn atoms</div>
            <button
              type="button"
              onClick={toggleBondingMode}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: bondingMode
                  ? "1px solid rgba(125, 211, 252, 0.9)"
                  : "1px solid rgba(255, 255, 255, 0.15)",
                background: bondingMode
                  ? "rgba(12, 74, 110, 0.85)"
                  : "rgba(255, 255, 255, 0.14)",
                color: bondingMode ? "#bae6fd" : "white",
                cursor: "pointer",
                fontWeight: bondingMode ? 700 : 500,
              }}
            >
              Bonding Mode: {bondingMode ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={toggleDeleteMode}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: deleteMode
                  ? "1px solid rgba(248, 113, 113, 0.9)"
                  : "1px solid rgba(255, 255, 255, 0.15)",
                background: deleteMode ? "rgba(127, 29, 29, 0.85)" : "rgba(255, 255, 255, 0.14)",
                color: deleteMode ? "#fecaca" : "white",
                cursor: "pointer",
                fontWeight: deleteMode ? 700 : 500,
              }}
            >
              Delete Mode: {deleteMode ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => spawnAtom("H")}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.14)",
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
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.14)",
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
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.14)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Carbon (C)
            </button>
          </div>
        ) : null}
        {selectedAtomDetails ? (
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "absolute",
              left: "16px",
              bottom: "16px",
              width: "170px",
              padding: "10px 12px",
              textAlign: "left",
              background: "rgba(15, 23, 42, 0.72)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "10px",
              backdropFilter: "blur(6px)",
              color: "white",
              zIndex: 2,
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700 }}>{selectedAtomDetails.name}</div>
            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "2px" }}>
              {selectedAtomDetails.symbol}
            </div>
            <div style={{ fontSize: "12px", marginTop: "8px", lineHeight: 1.45 }}>
              <div>Atomic number: {selectedAtomDetails.atomicNumber}</div>
              <div>Valence electrons: {selectedAtomDetails.valenceElectrons}</div>
              <div>Common bonds: {selectedAtomDetails.commonBonds}</div>
            </div>
          </div>
        ) : null}
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
          }}
        />
      </div>
      <div style={{ marginTop: "12px", fontSize: "13px", opacity: 0.75 }}>
        Press M to toggle the atom menu
      </div>
      {deleteMode ? (
        <div style={{ marginTop: "8px", fontSize: "13px", color: "#f87171", fontWeight: 700 }}>
          Delete Mode is ON
        </div>
      ) : null}
      {bondingMode ? (
        <div style={{ marginTop: "8px", fontSize: "13px", color: "#7dd3fc", fontWeight: 700 }}>
          Bonding Mode is ON
        </div>
      ) : null}
    </div>
  );
}

export default App;
