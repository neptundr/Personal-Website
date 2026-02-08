import React, {useRef, useEffect, useState} from 'react';

type Grid = number[][];

const GameOfLife: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const [key, setKey] = useState<number>(0);

    const canvasWidth = 2500;
    const canvasHeight = 1000;

    // Determine if mobile based on window width once on mount
    const [isMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768;
        }
        return false;
    });

    // Set cell size based on device type
    const cellSize = isMobile ? 12 : 10;

    const cols = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);
    let grid: Grid;
    let nextGrid: Grid;
    let displayGrid: Grid;

    // Reduce updates per second on mobile for performance
    const updatesPerSecond = isMobile ? 0.5 : 1;
    const updateInterval = 1000 / updatesPerSecond;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const fillRoundedRect = (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            width: number,
            height: number,
            radius: number
        ) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        };

        const createEmptyGrid = (): Grid =>
            Array.from({length: cols}, () => Array(rows).fill(0));

        const randomizeGrid = () => {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // @ts-ignore
                    grid[i][j] = Math.random() > 0.85 ? 1 : 0;
                }
            }
        };

        // Initialize canvas size and grids once
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        grid = createEmptyGrid();
        nextGrid = createEmptyGrid();
        displayGrid = createEmptyGrid();

        randomizeGrid();

        const countNeighbors = (x: number, y: number): number => {
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const col = (x + i + cols) % cols;
                    const row = (y + j + rows) % rows;
                    // @ts-ignore
                    count += grid[col][row];
                }
            }
            return count;
        };

        const updateGrid = () => {
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const neighbors = countNeighbors(i, j);
                    // @ts-ignore
                    if (grid[i][j] === 1) {
                        // @ts-ignore
                        nextGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
                    } else {
                        // @ts-ignore
                        nextGrid[i][j] = neighbors === 3 ? 1 : 0;
                    }
                }
            }
            [grid, nextGrid] = [nextGrid, grid];
        };

        const draw = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (!isMobile) {
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
            }

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    // @ts-ignore
                    const alpha: number = grid[i][j];
                    if (alpha === 1) {
                        const v = 255;
                        ctx.fillStyle = `rgba(${v},${v},${v},1)`;

                        if (isMobile) {
                            ctx.fillRect(
                                i * cellSize,
                                j * cellSize,
                                cellSize,
                                cellSize
                            );
                        } else {
                            // draw with rounded corners
                            const radius = 6; // adjust corner radius
                            fillRoundedRect(
                                ctx,
                                i * cellSize + 1,
                                j * cellSize + 1,
                                cellSize - 2,
                                cellSize - 2,
                                radius
                            );
                        }
                    }
                }
            }

            // Add black fade at the bottom
            const fadeHeight = 128;
            const gradient = ctx.createLinearGradient(0, canvas.height - fadeHeight, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, canvas.height - fadeHeight, canvas.width, fadeHeight);
        };

        let lastUpdateTime = 0;

        const animate = (time: number) => {
            if (!lastUpdateTime) lastUpdateTime = time;

            if (time - lastUpdateTime >= updateInterval) {
                updateGrid();
                lastUpdateTime = time;
            }

            draw();

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [key, cellSize, cols, rows, updateInterval, isMobile]);

    useEffect(() => {
        const interval = setInterval(() => {
            setKey(k => k + 1);
        }, 60_000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="absolute inset-0 pointer-events-none opacity-40"
            />
            <span className="absolute inset-0 pointer-events-none">
                <div className="absolute z-20 top-6 left-6 flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setKey(k => k + 1)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-white/10
                                   text-white/60 hover:text-white hover:bg-zinc-900/80
                                   transition-colors text-xs font-light tracking-wide backdrop-blur-sm"
                    >
                        Regenerate
                    </button>

                    <a
                        href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-white/10
                                   text-white/60 hover:text-white hover:bg-zinc-900/80
                                   transition-colors text-xs font-light tracking-wide backdrop-blur-sm
                                   flex items-center justify-center"
                    >
                        ?
                    </a>
                </div>
            </span>
        </>
    );
};

export default GameOfLife;