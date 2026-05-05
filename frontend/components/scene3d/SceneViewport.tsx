"use client";

import { ContactShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { CameraRig } from "@/components/scene3d/CameraRig";
import { Lighting } from "@/components/scene3d/Lighting";
import { ProductModel } from "@/components/scene3d/ProductModel";
import { modelUrlFromProductId } from "@/lib/scene/models";
import type { SceneSnapshot } from "@/types/api";

export function SceneViewport({ snapshot }: { snapshot: SceneSnapshot }) {
  const url = modelUrlFromProductId(snapshot.active_product_id);

  return (
    <div className="h-[440px] w-full overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-zinc-800">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2.35, 1.55, 2.75], fov: 42 }}>
        <color attach="background" args={["#09090b"]} />
        <Lighting />
        <Suspense fallback={null}>
          <ProductModel
            url={url}
            rotation={snapshot.rotation}
            scale={snapshot.scale}
            highlightedPartIds={snapshot.highlighted_part_ids}
          />
          <ContactShadows
            far={7}
            blur={2.8}
            opacity={0.4}
            position={[0, -0.001, 0]}
            scale={14}
          />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
