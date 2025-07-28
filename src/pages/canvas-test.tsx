import React, { useEffect, useRef } from 'react';

const CanvasTestPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw test shapes
    ctx.fillStyle = 'green';
    ctx.fillRect(50, 50, 100, 100);

    ctx.fillStyle = 'red';
    ctx.fillRect(200, 50, 100, 100);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Canvas is working!', 50, 200);
  }, []);

  return (
    <div className="h-screen bg-gray-900">
      <div className="p-4 text-white">
        <h1 className="text-2xl">Canvas Test</h1>
        <p>You should see two colored squares below:</p>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-600"
      />
    </div>
  );
};

export default CanvasTestPage;