import { useCallback, useEffect, useRef, useState } from "react";

const PageHeader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const activeCellsRef = useRef<Set<string>>(new Set());
  const prevMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [gridInitialized, setGridInitialized] = useState(false);

  const rule = (neighbors: number, cell: boolean) =>
    cell ? neighbors >= 1 && neighbors <= 5 : neighbors === 3;

  const updateGrid = useCallback((currentGrid: boolean[][]) => {
    if (
      !currentGrid ||
      currentGrid.length === 0 ||
      currentGrid[0].length === 0
    ) {
      return { newGrid: [], changedCells: [] };
    }

    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    const newGrid = currentGrid.map((row) => [...row]);
    const newActiveCells = new Set<string>();

    const checkAndUpdateCell = (y: number, x: number) => {
      const neighbors = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ].reduce((count, [dy, dx]) => {
        const newY = (y + dy + rows) % rows;
        const newX = (x + dx + cols) % cols;
        return count + (currentGrid[newY][newX] ? 1 : 0);
      }, 0);

      const prevState = currentGrid[y][x];
      const newState = rule(neighbors, currentGrid[y][x]);
      newGrid[y][x] = newState;

      if (newState !== prevState) {
        newActiveCells.add(`${y},${x}`);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const newY = (y + dy + rows) % rows;
            const newX = (x + dx + cols) % cols;
            newActiveCells.add(`${newY},${newX}`);
          }
        }
      }
    };

    activeCellsRef.current.forEach((cellKey) => {
      const [y, x] = cellKey.split(",").map(Number);
      checkAndUpdateCell(y, x);
    });

    activeCellsRef.current = newActiveCells;
    return { newGrid, changedCells: Array.from(newActiveCells) };
  }, []);

  const initializeGrid = useCallback(
    (rows: number, cols: number) => {
      if (rows <= 0 || cols <= 0) {
        return { newGrid: [], changedCells: [] };
      }

      const grid = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(false));
      const activeSet = new Set<string>();

      const spawnPattern = (centerX: number, centerY: number) => {
        const radius = 4;
        for (let y = 0; y < radius; y++) {
          for (let x = 0; x < radius; x++) {
            const gridY = centerY - Math.floor(radius / 2) + y;
            const gridX = centerX - Math.floor(radius / 2) + x;
            if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
              grid[gridY][gridX] = Math.random() < 0.5;
              if (grid[gridY][gridX]) {
                activeSet.add(`${gridY},${gridX}`);
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    const newY = (gridY + dy + rows) % rows;
                    const newX = (gridX + dx + cols) % cols;
                    activeSet.add(`${newY},${newX}`);
                  }
                }
              }
            }
          }
        }
      };

      spawnPattern(Math.floor(cols / 2), Math.floor(rows / 2));
      for (let i = 0; i < 10; i++) {
        spawnPattern(
          Math.floor(Math.random() * cols),
          Math.floor(Math.random() * rows),
        );
      }

      activeCellsRef.current = activeSet;
      return updateGrid(grid);
    },
    [updateGrid],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match its display size
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setGridInitialized(false);
    };

    if (!gridInitialized) {
      resizeCanvas();
    }
    window.addEventListener("resize", resizeCanvas);

    // Adjust cell size to ensure all cells fit within the canvas
    const cellSize = 5;
    const cols = Math.floor(canvas.width / cellSize);
    const rows = Math.floor(canvas.height / cellSize);

    if (!gridInitialized) {
      const { newGrid } = initializeGrid(rows, cols);
      gridRef.current = newGrid;
      setGridInitialized(true);
    }

    const drawCell = (x: number, y: number, isAlive: boolean) => {
      if (!ctx) return;
      if (isAlive) {
        const centerX = cols / 2;
        const centerY = rows / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2),
        );
        const maxDistance = Math.sqrt(
          Math.pow(cols / 2, 2) + Math.pow(rows / 2, 2),
        );
        // Adjust the gradient factor to make the purple area larger
        const gradientFactor = Math.max(
          0,
          (distanceFromCenter - maxDistance / 4) / (maxDistance * 0.75),
        );

        // Interpolate between purple (hsl(280, 100%, 50%)) and dark blue (hsl(240, 100%, 20%))
        const hue = 280 - gradientFactor * 40;
        const saturation = 100;
        const lightness = 50 - gradientFactor * 30;

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      } else {
        ctx.fillStyle = "#1e1f24";
      }
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    };

    const drawFullGrid = (currentGrid: boolean[][]) => {
      if (!ctx) return;
      ctx.fillStyle = "#1e1f24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (currentGrid[y][x]) {
            drawCell(x, y, true);
          }
        }
      }
    };

    const updateChangedCells = (
      currentGrid: boolean[][],
      changedCells: string[],
    ) => {
      changedCells.forEach((cellKey) => {
        const [y, x] = cellKey.split(",").map(Number);
        drawCell(x, y, currentGrid[y][x]);
      });
    };

    const updateAndDraw = () => {
      const { newGrid, changedCells } = updateGrid(gridRef.current);
      gridRef.current = newGrid;
      updateChangedCells(gridRef.current, changedCells);
    };

    // Initial full draw
    drawFullGrid(gridRef.current);

    intervalRef.current = window.setInterval(updateAndDraw, 33);

    const clearLineBetweenPoints = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
    ) => {
      const radius = 20;
      const clearRadius = radius + 1;
      const clearedCells = new Set<string>();

      // Pre-calculate squared radius for faster distance checks
      const radiusSquared = radius * radius;

      // Bresenham's line algorithm (optimized)
      let x = x1;
      let y = y1;
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        // Clear circle at current point and mark surrounding cells
        for (let dy = -clearRadius; dy <= clearRadius; dy++) {
          for (let dx = -clearRadius; dx <= clearRadius; dx++) {
            // Use squared distance for faster comparison
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared <= radiusSquared) {
              const newY = Math.max(0, Math.min(rows - 1, y + dy));
              const newX = Math.max(0, Math.min(cols - 1, x + dx));
              const cellKey = `${newY},${newX}`;

              if (!clearedCells.has(cellKey)) {
                gridRef.current[newY][newX] = false;
                clearedCells.add(cellKey);
                activeCellsRef.current.add(cellKey);
              }
            }
          }
        }

        if (x === x2 && y === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }

      return Array.from(clearedCells);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((event.clientX - rect.left) * scaleX) / cellSize);
      const y = Math.floor(((event.clientY - rect.top) * scaleY) / cellSize);

      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        if (prevMousePosRef.current) {
          const changedCells = clearLineBetweenPoints(
            prevMousePosRef.current.x,
            prevMousePosRef.current.y,
            x,
            y,
          );
          updateChangedCells(gridRef.current, changedCells);
        }
        prevMousePosRef.current = { x, y };
      } else {
        prevMousePosRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      prevMousePosRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [initializeGrid, updateGrid, gridInitialized]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default PageHeader;
