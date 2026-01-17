import React, { useRef, useEffect, useState } from 'react';

const GameOfLife = () => {
  const canvasRef = useRef(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const cellSize = 20;
    let cols, rows;
    let grid, nextGrid;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / cellSize);
      rows = Math.floor(canvas.height / cellSize);

      grid = createEmptyGrid();
      nextGrid = createEmptyGrid();
      randomizeGrid();
    };

    const createEmptyGrid = () => {
      return Array(cols).fill(null).map(() => Array(rows).fill(0));
    };

    const randomizeGrid = () => {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          grid[i][j] = Math.random() > 0.85 ? 1 : 0;
        }
      }
    };

    const countNeighbors = (x, y) => {
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const col = (x + i + cols) % cols;
          const row = (y + j + rows) % rows;
          count += grid[col][row];
        }
      }
      return count;
    };

    const updateGrid = () => {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const neighbors = countNeighbors(i, j);
          if (grid[i][j] === 1) {
            nextGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
          } else {
            nextGrid[i][j] = neighbors === 3 ? 1 : 0;
          }
        }
      }
      [grid, nextGrid] = [nextGrid, grid];
    };

    const draw = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines with fade effect
      for (let i = 0; i <= cols; i++) {
        const x = i * cellSize;
        const fadeRatio = 1 - (canvas.height - 0) / canvas.height;
        const gradient = ctx.createLinearGradient(x, canvas.height, x, 0);
        gradient.addColorStop(0, 'rgba(64, 64, 64, 0.3)');
        gradient.addColorStop(0.7, 'rgba(64, 64, 64, 0.15)');
        gradient.addColorStop(1, 'rgba(64, 64, 64, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, 0);
        ctx.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = j * cellSize;
        const fadeRatio = 1 - y / canvas.height;
        ctx.strokeStyle = `rgba(64, 64, 64, ${0.3 * fadeRatio})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw cells
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (grid[i][j] === 1) {
            const fadeRatio = 1 - (j * cellSize) / canvas.height;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fadeRatio})`;
            ctx.fillRect(i * cellSize + 1, j * cellSize + 1, cellSize - 2, cellSize - 2);
          }
        }
      }
    };

    const animate = () => {
      updateGrid();
      draw();
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 150);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [key]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40"
      />
      <button
        onClick={() => setKey(k => k + 1)}
        className="absolute top-6 left-6 z-10 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 text-white/60 hover:text-white hover:bg-zinc-900 transition-colors text-xs font-light tracking-wide backdrop-blur-sm"
      >
        Regenerate
      </button>
    </>
  );
};

export default GameOfLife;