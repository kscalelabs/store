import { useCallback, useEffect, useRef, useState } from "react";

interface PageHeaderProps {
  fillGrid?: boolean[][];
}

const PageHeader: React.FC<PageHeaderProps> = ({ fillGrid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const activeCellsRef = useRef<Set<string>>(new Set());
  const prevMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [gridInitialized, setGridInitialized] = useState(false);

  const fillGridRef = useRef<boolean[][] | undefined>(fillGrid);

  const rule = useCallback(
    (neighbors: number, cell: boolean, x: number, y: number) => {
      if (
        fillGridRef.current &&
        gridRef.current &&
        gridRef.current.length > 0 &&
        gridRef.current[0].length > 0
      ) {
        const centerX =
          Math.floor(gridRef.current[0].length / 2) -
          Math.floor(fillGridRef.current[0].length / 2);
        const centerY =
          Math.floor(gridRef.current.length / 2) -
          Math.floor(fillGridRef.current.length / 2);

        if (
          x >= centerX &&
          x < centerX + fillGridRef.current[0].length &&
          y >= centerY &&
          y < centerY + fillGridRef.current.length
        ) {
          const fillX = x - centerX;
          const fillY = y - centerY;
          return fillGridRef.current[fillY][fillX];
        }
      }
      return cell ? neighbors >= 1 && neighbors <= 5 : neighbors === 3;
    },
    [],
  );

  const updateGrid = useCallback(
    (currentGrid: boolean[][]) => {
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
        // Allow overflow by 2 cells
        const wrappedY = (y + rows) % rows;
        const wrappedX = (x + cols) % cols;

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
          const newY = (wrappedY + dy + rows) % rows;
          const newX = (wrappedX + dx + cols) % cols;
          return count + (currentGrid[newY][newX] ? 1 : 0);
        }, 0);

        const prevState = currentGrid[wrappedY][wrappedX];
        const newState = rule(neighbors, prevState, wrappedX, wrappedY);
        newGrid[wrappedY][wrappedX] = newState;

        if (newState !== prevState) {
          newActiveCells.add(`${wrappedY},${wrappedX}`);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const newY = (wrappedY + dy + rows) % rows;
              const newX = (wrappedX + dx + cols) % cols;
              newActiveCells.add(`${newY},${newX}`);
            }
          }
        }
      };

      // Check cells including 2 rows/columns outside the visible area
      for (let y = -2; y < rows + 2; y++) {
        for (let x = -2; x < cols + 2; x++) {
          checkAndUpdateCell(y, x);
        }
      }

      activeCellsRef.current = newActiveCells;
      return { newGrid, changedCells: Array.from(newActiveCells) };
    },
    [rule],
  );

  const initializeGrid = useCallback(
    (rows: number, cols: number) => {
      if (rows <= 0 || cols <= 0) {
        return { newGrid: [], changedCells: [] };
      }

      const grid = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(false));
      const activeSet = new Set<string>();

      if (fillGridRef.current) {
        const centerX =
          Math.floor(cols / 2) - Math.floor(fillGridRef.current[0].length / 2);
        const centerY =
          Math.floor(rows / 2) - Math.floor(fillGridRef.current.length / 2);

        for (let y = 0; y < fillGridRef.current.length; y++) {
          for (let x = 0; x < fillGridRef.current[0].length; x++) {
            const gridY = centerY + y;
            const gridX = centerX + x;
            if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
              grid[gridY][gridX] = fillGridRef.current[y][x];
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

    // Calculate cell size based on screen dimensions
    const minCellSize = 4; // Minimum cell size for mobile
    const maxCellSize = 8; // Maximum cell size for desktop
    const cellSize = Math.max(
      minCellSize,
      Math.min(
        maxCellSize,
        Math.floor(Math.min(canvas.width, canvas.height) / 50), // Adjust divisor to control cell density
      ),
    );

    const cols = Math.ceil(canvas.width / cellSize);
    const rows = Math.ceil(canvas.height / cellSize);

    if (!gridInitialized) {
      const { newGrid } = initializeGrid(rows, cols);
      gridRef.current = newGrid;
      setGridInitialized(true);
    }

    const drawCell = (x: number, y: number, isAlive: boolean) => {
      if (!ctx) return;

      // Allow drawing 2 cells outside the visible area
      const drawX = Math.floor(((x + cols) % cols) * cellSize);
      const drawY = Math.floor(((y + rows) % rows) * cellSize);

      // Draw background (gap) first
      ctx.fillStyle = "#1e1f24";
      ctx.fillRect(drawX, drawY, cellSize, cellSize);

      // Then draw the cell slightly smaller if it's alive
      if (isAlive) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
      }
    };

    const drawFullGrid = (currentGrid: boolean[][]) => {
      if (!ctx) return;
      ctx.fillStyle = "#1e1f24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw cells including 2 rows/columns outside the visible area
      for (let y = -2; y < rows + 2; y++) {
        for (let x = -2; x < cols + 2; x++) {
          const wrappedY = (y + rows) % rows;
          const wrappedX = (x + cols) % cols;
          if (currentGrid[wrappedY][wrappedX]) {
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

      // Apply fillGrid pattern after each update
      if (fillGridRef.current) {
        const centerX =
          Math.floor(cols / 2) - Math.floor(fillGridRef.current[0].length / 2);
        const centerY =
          Math.floor(rows / 2) - Math.floor(fillGridRef.current.length / 2);

        for (let y = 0; y < fillGridRef.current.length; y++) {
          for (let x = 0; x < fillGridRef.current[0].length; x++) {
            const gridY = centerY + y;
            const gridX = centerX + x;
            if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
              if (gridRef.current[gridY][gridX] !== fillGridRef.current[y][x]) {
                gridRef.current[gridY][gridX] = fillGridRef.current[y][x];
                changedCells.push(`${gridY},${gridX}`);
              }
            }
          }
        }
      }

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

      // Calculate fillGrid boundaries
      const fillGridBounds = fillGridRef.current
        ? {
            startX:
              Math.floor(cols / 2) -
              Math.floor(fillGridRef.current[0].length / 2),
            startY:
              Math.floor(rows / 2) - Math.floor(fillGridRef.current.length / 2),
            endX:
              Math.floor(cols / 2) +
              Math.floor((fillGridRef.current[0].length - 1) / 2),
            endY:
              Math.floor(rows / 2) +
              Math.floor((fillGridRef.current.length - 1) / 2),
          }
        : null;

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
              const newY = (y + dy + rows) % rows;
              const newX = (x + dx + cols) % cols;

              // Check if the cell is within the fillGrid boundaries
              const isInFillGrid =
                fillGridBounds &&
                newX >= fillGridBounds.startX &&
                newX <= fillGridBounds.endX &&
                newY >= fillGridBounds.startY &&
                newY <= fillGridBounds.endY;

              if (!isInFillGrid) {
                const cellKey = `${newY},${newX}`;
                if (!clearedCells.has(cellKey)) {
                  gridRef.current[newY][newX] = false;
                  clearedCells.add(cellKey);
                  activeCellsRef.current.add(cellKey);
                }
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

    const handlePointerMove = (event: PointerEvent) => {
      // Prevent scrolling/zooming while interacting with canvas
      event.preventDefault();

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

    const handlePointerUp = () => {
      prevMousePosRef.current = null;
    };

    // Use pointer events instead of mouse events
    canvas.addEventListener("pointerdown", (event) => {
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    // Prevent default touch behavior
    canvas.style.touchAction = "none";

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
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
