"use client";

export function Lighting() {
  return (
    <>
      <hemisphereLight intensity={0.65} color="#f8fafc" groundColor="#334155" />
      <directionalLight
        castShadow
        intensity={1.25}
        position={[5, 7, 4]}
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}
