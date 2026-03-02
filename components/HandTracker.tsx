
import React, { useEffect, useRef, useState } from 'react';
import { HandData } from '../types';

interface Props {
  onHandUpdate: (data: HandData) => void;
  showPreview: boolean;
}

const HandTracker: React.FC<Props> = ({ onHandUpdate, showPreview }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let hands: any = null;
    let camera: any = null;

    const initTracking = async () => {
      // Load MediaPipe Hands and Camera Utils from CDN
      const loadScript = (src: string) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      try {
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        ]);

        // @ts-ignore
        const HandsClass = window.Hands;
        // @ts-ignore
        const CameraClass = window.Camera;

        if (!HandsClass || !CameraClass) {
          throw new Error("MediaPipe libraries not found on window object.");
        }

        hands = new HandsClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (!results) return;
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            if (!landmarks || landmarks.length < 21) return;

            // Palm center (roughly landmark 9)
            const palm = landmarks[9];
            
            // Pinch detection: Distance between thumb tip (4) and index tip (8)
            const thumb = landmarks[4];
            const index = landmarks[8];
            const dist = Math.sqrt(
              Math.pow(thumb.x - index.x, 2) + 
              Math.pow(thumb.y - index.y, 2) + 
              Math.pow(thumb.z - index.z, 2)
            );
            
            // Hand open detection: Check if fingers are extended relative to palm
            const isHandOpen = landmarks[12].y < landmarks[9].y;

            onHandUpdate({
              x: palm.x,
              y: palm.y,
              z: palm.z,
              pinch: Math.min(dist * 5, 1),
              palmOpen: isHandOpen,
              active: true
            });

            // Draw on preview canvas if needed
            if (showPreview && canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                ctx.save();
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
                // Simple landmark drawing
                ctx.fillStyle = "#00ffcc";
                landmarks.forEach((pt: any) => {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvasRef.current!.width, pt.y * canvasRef.current!.height, 3, 0, 2 * Math.PI);
                  ctx.fill();
                });
                ctx.restore();
              }
            }
          } else {
            onHandUpdate({ x: 0.5, y: 0.5, z: 0, pinch: 0, palmOpen: false, active: false });
          }
        });

        if (videoRef.current) {
          camera = new CameraClass(videoRef.current, {
            onFrame: async () => {
              if (hands && videoRef.current) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240
          });
          camera.start();
        }
      } catch (err) {
        console.error("Hand tracking init error:", err);
        setError("Failed to initialize camera or tracking.");
      }
    };

    initTracking().catch(err => {
      console.error(err);
      setError("Failed to initialize camera or tracking.");
    });

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [onHandUpdate, showPreview]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-opacity duration-500 ${showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500 shadow-lg shadow-cyan-500/20 bg-black">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} width={240} height={180} className="w-48 h-36 scale-x-[-1]" />
        <div className="absolute top-1 left-2 text-[10px] text-cyan-400 font-mono uppercase tracking-widest bg-black/50 px-1 rounded">
          Hand Radar
        </div>
      </div>
      {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
    </div>
  );
};

export default HandTracker;
