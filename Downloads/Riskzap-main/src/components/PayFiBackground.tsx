import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ count = 3000 }) => {
  const points = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distribute particles in a more structured way
      const radius = Math.random() * 15 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Professional color palette matching Webzi design
      const colorType = Math.random();
      if (colorType < 0.4) {
        // Orange particles (primary)
        colors[i3] = 1;
        colors[i3 + 1] = 0.6;
        colors[i3 + 2] = 0.1;
      } else if (colorType < 0.7) {
        // Golden particles
        colors[i3] = 1;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 0.2;
      } else if (colorType < 0.9) {
        // White/silver particles
        colors[i3] = 0.9;
        colors[i3 + 1] = 0.9;
        colors[i3 + 2] = 1;
      } else {
        // Subtle blue accent particles
        colors[i3] = 0.3;
        colors[i3 + 1] = 0.5;
        colors[i3 + 2] = 1;
      }
    }
    
    return { positions, colors };
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <Points ref={pointsRef} positions={points.positions} colors={points.colors}>
      <PointMaterial
        transparent
        vertexColors
        size={0.01}
        sizeAttenuation={true}
        alphaTest={0.3}
        opacity={0.8}
      />
    </Points>
  );
};

// Floating geometric shapes like in Webzi design
const FloatingGeometry: React.FC = () => {
  return (
    <>
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[5, 3, -8]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial 
            color="#ff9500" 
            transparent 
            opacity={0.1}
            wireframe
          />
        </mesh>
      </Float>
      
      <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh position={[-6, -2, -10]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color="#ffcc00" 
            transparent 
            opacity={0.08}
            wireframe
          />
        </mesh>
      </Float>
      
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[3, -4, -6]}>
          <tetrahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial 
            color="#ff6b35" 
            transparent 
            opacity={0.12}
            wireframe
          />
        </mesh>
      </Float>
    </>
  );
};

const PayFiBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 hero-gradient opacity-90" />
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ParticleField />
          <FloatingGeometry />
          
          {/* Professional lighting setup */}
          <ambientLight intensity={0.2} color="#ffffff" />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#ff9500" />
          <pointLight position={[-10, -10, 10]} intensity={0.4} color="#ffcc00" />
          <spotLight 
            position={[0, 20, 0]} 
            intensity={0.5} 
            color="#ff6b35"
            angle={Math.PI / 6}
            penumbra={0.5}
          />
        </Suspense>
      </Canvas>
      
      {/* Additional geometric overlays */}
      <div className="absolute inset-0 geometric-bg opacity-50" />
    </div>
  );
};

export default PayFiBackground;