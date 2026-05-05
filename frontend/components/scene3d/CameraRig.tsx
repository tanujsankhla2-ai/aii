"use client";

import { OrbitControls } from "@react-three/drei";

/** Interactive orbit camera; replace with scripted rigs when avatar UX demands it. */
export function CameraRig() {
  return <OrbitControls enableDamping makeDefault />;
}
