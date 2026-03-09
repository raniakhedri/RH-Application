import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import type { Group } from 'three';

function Model() {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}logo3d.glb`);
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.8;
    }
  });

  return <primitive ref={ref} object={scene} scale={3.5} position={[0, -0.3, 0]} />;
}

interface Logo3DProps {
  size?: number;
}

const Logo3D: React.FC<Logo3DProps> = ({ size = 44 }) => {
  return (
    <div style={{ width: size, height: size }} className="shrink-0 rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <directionalLight position={[-2, -1, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          <Model />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Logo3D;
