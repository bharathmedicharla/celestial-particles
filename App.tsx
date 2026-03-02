
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import ParticleSystem from './components/ParticleSystem';
import HandTracker from './components/HandTracker';
import { ParticleConfig, HandData, ShapeType } from './types';
import { generateAlchemyConfig } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    count: 8000,
    color: '#00d4ff',
    size: 0.05,
    speed: 0.5,
    shape: 'Galaxy',
    expansion: 1,
    glow: 1,
    trailLength: 10,
    trailFade: 0.8
  });

  const [handData, setHandData] = useState<HandData>({
    x: 0.5, y: 0.5, z: 0, pinch: 0, palmOpen: false, active: false
  });

  const [showPreview, setShowPreview] = useState(true);
  const [alchemyPrompt, setAlchemyPrompt] = useState('');
  const [isAlchemyLoading, setIsAlchemyLoading] = useState(false);
  const [alchemyDesc, setAlchemyDesc] = useState('Celestial Particle System Active.');

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  const runAlchemy = async () => {
    if (!alchemyPrompt.trim()) return;
    setIsAlchemyLoading(true);
    try {
      const result = await generateAlchemyConfig(alchemyPrompt);
      setConfig(prev => ({
        ...prev,
        color: result.color,
        speed: result.speed,
        expansion: result.density
      }));
      setAlchemyDesc(result.description);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAlchemyLoading(false);
    }
  };

  const shapes: ShapeType[] = ['Galaxy', 'Heart', 'Flower', 'Saturn', 'Fireworks', 'Sphere', 'Custom'];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.5} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <ParticleSystem config={config} hand={handData} />
          
          <OrbitControls enablePan={false} enableZoom={true} minDistance={5} maxDistance={20} />
          
          <React.Suspense fallback={null}>
            <EffectComposer>
              <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={config.glow} />
            </EffectComposer>
          </React.Suspense>
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex flex-col md:flex-row justify-between items-start">
        {/* Header & Controls */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full max-w-sm pointer-events-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Celestial AI
            </h1>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-mono">Particle Alchemy Engine v2.0</p>
          </div>

          <div className="space-y-4">
            <section>
              <label className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest mb-2 block">Core Geometry</label>
              <div className="grid grid-cols-3 gap-2">
                {shapes.map(s => (
                  <button
                    key={s}
                    onClick={() => setConfig(prev => ({ ...prev, shape: s }))}
                    className={`py-1.5 px-2 text-xs rounded border transition-all ${
                      config.shape === s 
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest">Expansion & Speed</label>
              </div>
              <input 
                type="range" min="0.5" max="3" step="0.1"
                value={config.expansion}
                onChange={(e) => setConfig(prev => ({ ...prev, expansion: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-2"
              />
              <input 
                type="range" min="0.1" max="2" step="0.1"
                value={config.speed}
                onChange={(e) => setConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </section>

            <section>
              <label className="text-[10px] text-amber-400 uppercase font-mono tracking-widest mb-2 block">Glow Intensity</label>
              <input 
                type="range" min="0" max="5" step="0.1"
                value={config.glow}
                onChange={(e) => setConfig(prev => ({ ...prev, glow: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </section>

            <section>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest">Trail Memory</label>
                <span className="text-[10px] text-white/50 font-mono">{config.trailLength} steps</span>
              </div>
              <input 
                type="range" min="0" max="30" step="1"
                value={config.trailLength}
                onChange={(e) => setConfig(prev => ({ ...prev, trailLength: parseInt(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2"
              />
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest">Trail Fade</label>
                <span className="text-[10px] text-white/50 font-mono">{(config.trailFade * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="0.99" step="0.01"
                value={config.trailFade}
                onChange={(e) => setConfig(prev => ({ ...prev, trailFade: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </section>

            <section>
              <label className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest mb-2 block">AI Alchemy (Gemini)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Describe a mood..."
                  value={alchemyPrompt}
                  onChange={(e) => setAlchemyPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAlchemy()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button 
                  onClick={runAlchemy}
                  disabled={isAlchemyLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {isAlchemyLoading ? '...' : 'Fuse'}
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Status Display */}
        <div className="mt-4 md:mt-0 text-right pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl inline-block text-left mb-2">
            <p className="text-[10px] text-purple-400 font-mono uppercase tracking-widest mb-1">Alchemy Status</p>
            <p className="text-white text-sm max-w-[250px] italic">"{alchemyDesc}"</p>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl inline-block text-left">
            <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-1">Tracking HUD</p>
            <div className="flex gap-4 text-xs font-mono">
              <span className={handData.active ? 'text-green-400' : 'text-red-500'}>
                • {handData.active ? 'HAND DETECTED' : 'SEARCHING...'}
              </span>
              <span className="text-white">PINCH: {(handData.pinch * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Legend */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none text-left">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl space-y-2 max-w-xs">
          <h4 className="text-[10px] text-cyan-400 uppercase font-mono tracking-widest">Gesture Guide</h4>
          <ul className="text-[11px] text-gray-300 space-y-1 font-mono">
            <li><span className="text-cyan-400">• MOVE PALM:</span> Orbit particles</li>
            <li><span className="text-cyan-400">• PINCH:</span> Expand core system</li>
            <li><span className="text-cyan-400">• OPEN/CLOSE:</span> Repel/Attract mass</li>
          </ul>
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="mt-2 text-[10px] text-gray-500 hover:text-white transition-colors pointer-events-auto"
          >
            [TOGGLE CAMERA PREVIEW]
          </button>
        </div>
      </div>

      <HandTracker onHandUpdate={handleHandUpdate} showPreview={showPreview} />
    </div>
  );
};

export default App;
