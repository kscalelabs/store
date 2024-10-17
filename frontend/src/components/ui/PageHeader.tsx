import React, { useCallback, useEffect, useRef, useState } from "react";

import { useWindowSize } from "@/hooks/useWindowSize";

interface PageHeaderProps {
  title: string;
  subheading: string;
}

const PageHeader: React.FC<PageHeaderProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<number[][]>([]);
  const intervalRef = useRef<number>();
  const { width: windowWidth } = useWindowSize();
  const activeCellsRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [gridInitialized, setGridInitialized] = useState(false);

  // Define canvas dimensions
  const canvasWidth = windowWidth;
  const canvasHeight = 800;

  const kernelRadius = 8; // R = 13
  const mu = 0.15; // μ = 0.15
  const sigma = 0.014; // σ = 0.014
  const alpha = 5; // α = 4
  const deltaT = 0.16; // Δt = 0.16
  const cellSize = 5;

  // const kernelRadius = 5; // R = 13
  // const mu = 0.15; // μ = 0.15
  // const sigma = 0.015; // σ = 0.014
  // const alpha = 1; // α = 4
  // const deltaT = 0.16; // Δt = 0.16
  // const cellSize = 5;

  const centerX = Math.floor(canvasWidth / 12);
  const centerY = Math.floor(canvasHeight / 12);
  const width = 200;
  const height = 200;

  const createKernel = (radius: number) => {
    const size = radius * 2 + 1;
    const kernel = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const r = Math.sqrt(x * x + y * y) / radius;
        if (r <= 1) {
          const k = Math.exp(alpha * (1 - 1 / (4 * r * (1 - r))));
          kernel[y + radius][x + radius] = k;
        }
      }
    }

    return kernel;
  };

  const kernel = createKernel(kernelRadius);

  const applyKernel = (y: number, x: number, currentGrid: number[][]) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    let sum = 0;
    let normalization = 0;

    for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
      for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
        const newY = (y + dy + rows) % rows;
        const newX = (x + dx + cols) % cols;
        const kValue = kernel[dy + kernelRadius][dx + kernelRadius];
        sum += currentGrid[newY][newX] * kValue;
        normalization += kValue;
      }
    }

    return sum / normalization; // Normalize the sum
  };

  const growthFunction = (neighborSum: number) => {
    const l = Math.abs(neighborSum - mu);
    const k = 2 * sigma * sigma;
    return 2 * Math.exp(-l * l / k) - 1;
  };

  const updateGrid = (currentGrid: number[][]) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    const newGrid = currentGrid.map((row) => [...row]);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const neighborSum = applyKernel(y, x, currentGrid);
        const delta = growthFunction(neighborSum) * deltaT;
        newGrid[y][x] = Math.max(0, Math.min(1, currentGrid[y][x] + delta));
      }
    }

    return newGrid;
  };

  const initializeGrid = useCallback(
    (rows: number, cols: number, seedCount: number, centerX: number, centerY: number, width: number, height: number) => {
      const grid = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(0));

      const startX = Math.max(0, centerX - Math.floor(width / 2));
      const endX = Math.min(cols, centerX + Math.floor(width / 2));
      const startY = Math.max(0, centerY - Math.floor(height / 2));
      const endY = Math.min(rows, centerY + Math.floor(height / 2));

      for (let i = 0; i < seedCount; i++) {
        const x = Math.floor(Math.random() * (endX - startX)) + startX;
        const y = Math.floor(Math.random() * (endY - startY)) + startY;
        grid[y][x] = Math.random();
      }

      return updateGrid(grid);
    },
    [updateGrid],
  );

  const eraserRadius = 10;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cols = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const seedCount = 100000; // Adjust this number to change the number of starting seeds

    if (!gridInitialized) {
      gridRef.current = initializeGrid(rows, cols, seedCount, centerX, centerY, width, height);
      setGridInitialized(true);
    }

    const drawGrid = (currentGrid: number[][]) => {
      ctx.fillStyle = "#1e1f24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const intensity = currentGrid[y][x];
          ctx.fillStyle = `rgba(255, 140, 0, ${intensity})`;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    };

    const eraseCells = () => {
      if (mousePosRef.current) {
        const { x, y } = mousePosRef.current;
        const currentGrid = gridRef.current;
        const rows = currentGrid.length;
        const cols = currentGrid[0].length;

        for (let dy = -eraserRadius; dy <= eraserRadius; dy++) {
          for (let dx = -eraserRadius; dx <= eraserRadius; dx++) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= eraserRadius) {
              const newY = (y + dy + rows) % rows;
              const newX = (x + dx + cols) % cols;
              if (currentGrid[newY] && currentGrid[newY][newX] !== undefined) {
                currentGrid[newY][newX] = 0; // Erase the cell by setting its value to 0
              }
            }
          }
        }
      }

      // Define the rectangle where the logo is
      const logoStartX = 90; // Example starting x-coordinate
      const logoStartY = 52; // Example starting y-coordinate
      const logoWidth = 150;  // Example width of the logo
      const logoHeight = 25; // Example height of the logo

      // Force grid values to zero in the logo rectangle
      const currentGrid = gridRef.current;
      for (let y = logoStartY; y < logoStartY + logoHeight; y++) {
        for (let x = logoStartX; x < logoStartX + logoWidth; x++) {
          if (currentGrid[y] && currentGrid[y][x] !== undefined) {
            currentGrid[y][x] = 0;
          }
        }
      }
    };

    const updateAndDraw = () => {
      eraseCells(); // Erase cells before updating
      gridRef.current = updateGrid(gridRef.current);
      drawGrid(gridRef.current);
    };

    drawGrid(gridRef.current);
    intervalRef.current = window.setInterval(updateAndDraw, 50);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        mousePosRef.current = {
          x: Math.floor(x / cellSize),
          y: Math.floor(y / cellSize),
        };
      } else {
        mousePosRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasWidth, canvasHeight, initializeGrid, updateGrid, gridInitialized, cellSize]);

  return (
    <div className="relative w-full h-[800px] overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="absolute inset-0"
      />
    </div>
  );
};

export default PageHeader;
