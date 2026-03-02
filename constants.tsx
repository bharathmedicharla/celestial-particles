
import { ShapeType } from './types';

export const PARTICLE_COUNT = 8000;

export const SHAPE_FORMULAS: Record<ShapeType, (i: number, count: number) => [number, number, number]> = {
  Heart: (i, count) => {
    const t = (i / count) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [x * 0.1, y * 0.1, (Math.random() - 0.5) * 0.5];
  },
  Flower: (i, count) => {
    const t = (i / count) * Math.PI * 2;
    const k = 5;
    const r = Math.cos(k * t) * 2;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    return [x, y, (Math.random() - 0.5) * 0.2];
  },
  Saturn: (i, count) => {
    if (i < count * 0.4) {
      // Sphere core
      const phi = Math.acos(-1 + (2 * i) / (count * 0.4));
      const theta = Math.sqrt(count * 0.4 * Math.PI) * phi;
      return [
        Math.cos(theta) * Math.sin(phi) * 1,
        Math.sin(theta) * Math.sin(phi) * 1,
        Math.cos(phi) * 1
      ];
    } else {
      // Ring
      const angle = Math.random() * Math.PI * 2;
      const r = 1.8 + Math.random() * 0.8;
      const x = Math.cos(angle) * r;
      const y = (Math.random() - 0.5) * 0.1;
      const z = Math.sin(angle) * r;
      // Tilt the ring
      return [x, y * 2 + x * 0.2, z];
    }
  },
  Fireworks: (i, count) => {
    const radius = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    return [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    ];
  },
  Galaxy: (i, count) => {
    const angle = 0.1 * i;
    const r = 0.02 * i;
    return [
      r * Math.cos(angle),
      (Math.random() - 0.5) * 0.5,
      r * Math.sin(angle)
    ];
  },
  Sphere: (i, count) => {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    return [
      Math.cos(theta) * Math.sin(phi) * 2,
      Math.sin(theta) * Math.sin(phi) * 2,
      Math.cos(phi) * 2
    ];
  },
  Custom: (i, count) => [
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4
  ]
};
