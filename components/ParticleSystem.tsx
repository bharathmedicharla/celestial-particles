
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, HandData, ShapeType } from '../types';
import { SHAPE_FORMULAS, PARTICLE_COUNT } from '../constants';

interface Props {
  config: ParticleConfig;
  hand: HandData;
}

const ParticleSystem: React.FC<Props> = ({ config, hand }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const currentShapeRef = useRef<ShapeType>(config.shape);
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  // Trail history: [trailStep][particleIndex * 3]
  const MAX_TRAIL = 30;
  const historyRef = useRef<Float32Array[]>([]);
  
  // Create initial positions and colors
  const [positions, colors] = useMemo(() => {
    const totalCount = PARTICLE_COUNT * (MAX_TRAIL + 1);
    const pos = new Float32Array(totalCount * 3);
    const cols = new Float32Array(totalCount * 3);
    const color = new THREE.Color(config.color);
    
    // Initialize history arrays
    historyRef.current = Array.from({ length: MAX_TRAIL }, () => new Float32Array(PARTICLE_COUNT * 3));
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = SHAPE_FORMULAS[config.shape](i, PARTICLE_COUNT);
      pos[i * 3] = p[0];
      pos[i * 3 + 1] = p[1];
      pos[i * 3 + 2] = p[2];
      
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
      
      targetPositionsRef.current[i * 3] = p[0];
      targetPositionsRef.current[i * 3 + 1] = p[1];
      targetPositionsRef.current[i * 3 + 2] = p[2];

      // Initialize history with starting positions
      for (let t = 0; t < MAX_TRAIL; t++) {
        historyRef.current[t][i * 3] = p[0];
        historyRef.current[t][i * 3 + 1] = p[1];
        historyRef.current[t][i * 3 + 2] = p[2];
      }
    }
    return [pos, cols];
  }, []);

  // Handle shape transitions
  useEffect(() => {
    const targetFormula = SHAPE_FORMULAS[config.shape];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = targetFormula(i, PARTICLE_COUNT);
      targetPositionsRef.current[i * 3] = p[0];
      targetPositionsRef.current[i * 3 + 1] = p[1];
      targetPositionsRef.current[i * 3 + 2] = p[2];
    }
    currentShapeRef.current = config.shape;
  }, [config.shape]);

  // Update colors when config color changes
  useEffect(() => {
    const color = new THREE.Color(config.color);
    const colorAttr = pointsRef.current.geometry.attributes.color;
    // Main particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      colorAttr.setXYZ(i, color.r, color.g, color.b);
    }
    // Trail particles (faded)
    for (let t = 0; t < MAX_TRAIL; t++) {
      const fade = Math.pow(config.trailFade, t + 1);
      const r = color.r * fade;
      const g = color.g * fade;
      const b = color.b * fade;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = (t + 1) * PARTICLE_COUNT + i;
        colorAttr.setXYZ(idx, r, g, b);
      }
    }
    colorAttr.needsUpdate = true;
  }, [config.color, config.trailFade]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const positionAttr = pointsRef.current.geometry.attributes.position;
    
    // Hand tracking influence
    const handX = (hand.x - 0.5) * 10;
    const handY = -(hand.y - 0.5) * 10;
    const expansion = config.expansion * (1 + hand.pinch * 2);
    
    // 1. Shift history
    for (let t = MAX_TRAIL - 1; t > 0; t--) {
      historyRef.current[t].set(historyRef.current[t - 1]);
    }
    // Store current positions into history[0] before updating them
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      historyRef.current[0][idx] = positionAttr.array[idx];
      historyRef.current[0][idx + 1] = positionAttr.array[idx + 1];
      historyRef.current[0][idx + 2] = positionAttr.array[idx + 2];
    }

    // 2. Update main particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      
      const tx = targetPositionsRef.current[idx] * expansion;
      const ty = targetPositionsRef.current[idx + 1] * expansion;
      const tz = targetPositionsRef.current[idx + 2] * expansion;
      
      let x = positionAttr.array[idx];
      let y = positionAttr.array[idx + 1];
      let z = positionAttr.array[idx + 2];
      
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      z += (tz - z) * 0.05;
      
      const noise = Math.sin(time * config.speed + i) * 0.02;
      x += noise;
      y += noise;
      
      if (hand.active) {
        const dx = handX - x;
        const dy = handY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) {
          const force = (2 - dist) * 0.1 * (hand.palmOpen ? -1 : 1);
          x += (dx / dist) * force;
          y += (dy / dist) * force;
        }
      }
      
      positionAttr.setXYZ(i, x, y, z);
    }

    // 3. Update trail positions in buffer
    const currentTrailLength = Math.min(config.trailLength, MAX_TRAIL);
    for (let t = 0; t < MAX_TRAIL; t++) {
      const offset = (t + 1) * PARTICLE_COUNT;
      const hPos = historyRef.current[t];
      
      // If trail is shorter than MAX_TRAIL, we hide the rest by moving them far away or setting to current
      const isVisible = t < currentTrailLength;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = i * 3;
        if (isVisible) {
          positionAttr.setXYZ(offset + i, hPos[idx], hPos[idx + 1], hPos[idx + 2]);
        } else {
          // Hide by placing at current position (effectively zero length trail)
          positionAttr.setXYZ(offset + i, positionAttr.array[idx], positionAttr.array[idx+1], positionAttr.array[idx+2]);
        }
      }
    }

    positionAttr.needsUpdate = true;
    
    pointsRef.current.rotation.y += 0.002 * config.speed;
    pointsRef.current.rotation.z += 0.001 * config.speed;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT * (MAX_TRAIL + 1)}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT * (MAX_TRAIL + 1)}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={config.size}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

export default ParticleSystem;
