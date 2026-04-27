# Chem AR Lab

Chem AR Lab is a camera-based augmented reality chemistry sandbox that uses hand tracking to let users interact with atoms and molecules directly through their webcam.

## What It Does

- Uses webcam-based hand tracking
NOTE ON Camera Access
You must allow access for the simulator to function as this app uses your webcam for hand tracking, however the camera feed stays on your device, is used only for real-time interaction, and is not recorded or uploaded.
- Lets users pinch and drag atoms
- Supports multiple atoms, including Hydrogen, Oxygen, and Carbon (more in future)
- Includes a spawn menu for adding atoms
- Includes delete mode
- Includes bonding mode for creating bonds between atoms
- Supports simple molecule creation, including H₂O
- Runs directly in the browser

## Why I Built This

I wanted to make chemistry feel more interactive and physical without needing a VR headset or expensive lab equipment. The goal is to help students visualize atoms, bonding, and molecular formation in a hands-on way using only a camera.

## Tech Stack

- React
- Vite
- JavaScript
- MediaPipe Hand Tracking
- CSS / Canvas-based visual overlay

## How to Run Locally

Install dependencies:

```bash
npm install


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
