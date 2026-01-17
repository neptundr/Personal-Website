import React, {useRef, useEffect, useState} from 'react';

const GameOfLife = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [key, setKey] = useState(0);

    const cellSize = 20;
    let cols, rows;
    let grid, nextGrid, displayGrid;

    // Desired updates per second for the Game of Life logic
    const updatesPerSecond = 2;
    const updateInterval = 1000 / updatesPerSecond; // milliseconds

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            cols = Math.floor(canvas.width / cellSize);
            rows = Math.floor(canvas.height / cellSize);

            grid = createEmptyGrid();
            nextGrid = createEmptyGrid();
            displayGrid = createEmptyGridFloat();
            randomizeGrid();
        };

        const createEmptyGrid = () => Array(cols).fill(null).map(() => Array(rows).fill(0));
        const createEmptyGridFloat = () => Array(cols).fill(null).map(() => Array(rows).fill(0));

        const randomizeGrid = () => {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    grid[i][j] = Math.random() > 0.85 ? 1 : 0;
                    displayGrid[i][j] = grid[i][j]; // initialize fade
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

        const updateDisplayGrid = () => {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const target = grid[i][j]; // 0 or 1
                    if (target === 1) {
                        displayGrid[i][j] += (target - displayGrid[i][j]) * 0.95;
                    } else {
                        displayGrid[i][j] += (target - displayGrid[i][j]) * 0.125; // fade speed
                    }
                }
            }
        };

        const draw = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Optional grid lines
            for (let i = 0; i <= cols; i++) {
                const x = i * cellSize;
                ctx.strokeStyle = 'rgba(64,64,64,0.15)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let j = 0; j <= rows; j++) {
                const y = j * cellSize;
                ctx.strokeStyle = 'rgba(64,64,64,0.15)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // Draw cells with fade
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    if (displayGrid[i][j] > 0.01) {
                        ctx.fillStyle = `rgba(255,255,255,${displayGrid[i][j]*displayGrid[i][j]})`;
                        ctx.fillRect(i * cellSize + 1, j * cellSize + 1, cellSize - 2, cellSize - 2);
                    }
                }
            }
        };

        let lastUpdateTime = 0;

        const animate = (time) => {
            if (!lastUpdateTime) lastUpdateTime = time;

            // Only update logic if enough real time has passed
            const delta = time - lastUpdateTime;
            if (delta >= updateInterval) {
                updateGrid();
                lastUpdateTime = time;
            }

            updateDisplayGrid(); // fade animation every frame
            draw();

            animationRef.current = requestAnimationFrame(animate);
        };

        resize();
        window.addEventListener('resize', resize);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
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