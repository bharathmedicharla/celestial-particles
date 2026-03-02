
export type ShapeType = 'Heart' | 'Flower' | 'Saturn' | 'Fireworks' | 'Galaxy' | 'Sphere' | 'Custom';

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  speed: number;
  shape: ShapeType;
  expansion: number;
  glow: number;
  trailLength: number;
  trailFade: number;
}

export interface HandData {
  x: number;
  y: number;
  z: number;
  pinch: number; // 0 to 1
  palmOpen: boolean;
  active: boolean;
}

export interface AlchemyConfig {
  color: string;
  speed: number;
  density: number;
  description: string;
}
