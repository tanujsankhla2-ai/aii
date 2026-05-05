"use client";

import { useGLTF } from "@react-three/drei";
import { memo, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { REMOTE_DEMO_GLB } from "@/lib/scene/models";
import type { Vector3 } from "@/types/api";

type Props = {
  url: string;
  rotation: Vector3;
  scale: number;
  highlightedPartIds: string[];
};

function applyHighlight(mesh: THREE.Mesh, on: boolean) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const raw of mats) {
    const m = raw as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    if (!("emissive" in m) || !m.emissive) continue;
    if (on) {
      m.emissive.set("#7744cc");
      m.emissiveIntensity = 0.55;
    } else {
      m.emissive.set("#000000");
      m.emissiveIntensity = 0;
    }
  }
}

function ProductModelInner({ url, rotation, scale, highlightedPartIds }: Props) {
  const gltf = useGLTF(url);
  const pivotRef = useRef<THREE.Group>(null);
  const scene = useMemo(() => gltf.scene.clone(true), [url, gltf.scene]);

  useLayoutEffect(() => {
    const g = pivotRef.current;
    if (!g) return;
    g.rotation.set(rotation.x, rotation.y, rotation.z);
    g.scale.setScalar(scale);
  }, [rotation.x, rotation.y, rotation.z, scale]);

  useLayoutEffect(() => {
    const ids = highlightedPartIds;
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const highlighted =
        ids.includes("*") || ids.some((id) => obj.name === id || obj.name.includes(id));
      applyHighlight(obj, highlighted);
    });
  }, [scene, highlightedPartIds]);

  return (
    <group ref={pivotRef}>
      <primitive object={scene} />
    </group>
  );
}

export const ProductModel = memo(ProductModelInner);

useGLTF.preload(REMOTE_DEMO_GLB);
