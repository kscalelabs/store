import { useCallback, useEffect, useRef } from "react";

interface Props {
  children?: React.ReactNode;
}

const PageHeader = ({ children }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const currentPosRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const targetPosRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const fakeMouseAngleRef = useRef(0);
  const isRealMouseActiveRef = useRef(false);

  const isMobile = window.innerWidth < 600;
  const cellSize = isMobile ? 3 : 5;

  // Initialize grid with R-pentomino pattern and random points
  const initializeGrid = useCallback((rows: number, cols: number) => {
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));

    // Add R-pentomino pattern in center
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const pattern = [
      [0, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ];

    pattern.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell) {
          grid[centerY + dy - 1][centerX + dx - 1] = true;
        }
      });
    });

    // Add more random points (10% of cells)
    const numberOfRandomPoints = Math.floor(cols * rows * 0.1);
    for (let i = 0; i < numberOfRandomPoints; i++) {
      const randomX = Math.floor(Math.random() * cols);
      const randomY = Math.floor(Math.random() * rows);
      grid[randomY][randomX] = true;
    }

    // Add additional clusters of points
    const numberOfClusters = Math.floor((cols * rows) / 2000);
    for (let i = 0; i < numberOfClusters; i++) {
      const clusterX = Math.floor(Math.random() * cols);
      const clusterY = Math.floor(Math.random() * rows);
      const clusterSize = Math.floor(Math.random() * 5) + 3;

      for (let dy = -clusterSize; dy <= clusterSize; dy++) {
        for (let dx = -clusterSize; dx <= clusterSize; dx++) {
          if (Math.random() < 0.4) {
            const x = (clusterX + dx + cols) % cols;
            const y = (clusterY + dy + rows) % rows;
            grid[y][x] = true;
          }
        }
      }
    }

    return grid;
  }, []);

  // Modified rule function for B3/S12345
  const rule = useCallback((neighbors: number, cell: boolean) => {
    return neighbors === 3 || (cell && neighbors >= 1 && neighbors <= 5);
  }, []);

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
        const newState = rule(neighbors, prevState);
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

      return { newGrid, changedCells: Array.from(newActiveCells) };
    },
    [rule],
  );

  // Add new helper function
  const clearCellsAroundPoint = useCallback(
    (x: number, y: number, cellSize: number, radius?: number) => {
      if (!gridRef.current) return;

      const defaultRadius = window.innerWidth < 600 ? 5 : 10;
      radius = radius || defaultRadius;

      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      const rows = gridRef.current.length;
      const cols = gridRef.current[0].length;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const nx = (gridX + dx + cols) % cols;
            const ny = (gridY + dy + rows) % rows;
            gridRef.current[ny][nx] = false;
          }
        }
      }
    },
    [],
  );

  // Add line clearing function
  const clearLineBetweenPoints = useCallback(
    (x1: number, y1: number, x2: number, y2: number, cellSize: number) => {
      if (x1 === null || y1 === null) return;

      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        clearCellsAroundPoint(x, y, cellSize);
      }
    },
    [clearCellsAroundPoint],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Move canvas setup into a separate function
    const setupCanvas = () => {
      const containerWidth =
        canvas.parentElement?.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      const cols = Math.floor(containerWidth / cellSize);
      const rows = Math.floor((viewportHeight * 0.4) / cellSize);

      canvas.width = cols * cellSize;
      canvas.height = rows * cellSize;

      // Reinitialize grid when canvas is resized
      gridRef.current = initializeGrid(rows, cols);
    };

    // Initial setup
    setupCanvas();

    // Add resize handler
    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      // Draw current state
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      gridRef.current.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            ctx.fillRect(
              x * cellSize,
              y * cellSize,
              cellSize - 1,
              cellSize - 1,
            );
          }
        });
      });

      // Update mouse position using lemniscate if no real mouse
      if (!isRealMouseActiveRef.current) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radiusX = Math.min(canvas.width * 0.45, 400);
        const radiusY = Math.min(canvas.height * 0.3, 100);

        targetPosRef.current = {
          x:
            centerX +
            (radiusX * Math.cos(fakeMouseAngleRef.current)) /
              (1 + Math.sin(fakeMouseAngleRef.current) ** 2),
          y:
            centerY +
            (radiusY *
              Math.sin(fakeMouseAngleRef.current) *
              Math.cos(fakeMouseAngleRef.current)) /
              (1 + Math.sin(fakeMouseAngleRef.current) ** 2),
        };

        fakeMouseAngleRef.current += isMobile ? 0.015 : 0.01;
      }

      // Update current position
      const targetX = targetPosRef.current.x;
      const targetY = targetPosRef.current.y;
      const currentX = currentPosRef.current.x;
      const currentY = currentPosRef.current.y;
      if (targetX !== null && targetY !== null) {
        if (currentX === null || currentY === null) {
          currentPosRef.current = { ...targetPosRef.current };
        } else {
          const dx = targetX - currentX;
          const dy = targetY - currentY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const maxSpeed = 5;
          const speed = Math.min(distance * 0.2, maxSpeed);

          if (distance > 0.1) {
            const oldX = currentX;
            const oldY = currentY;
            const newX = currentX + (dx / distance) * speed;
            const newY = currentY + (dy / distance) * speed;
            currentPosRef.current = { x: newX, y: newY };
            clearLineBetweenPoints(newX, newY, oldX, oldY, cellSize);
          }
        }
      }

      // Update grid state
      const { newGrid } = updateGrid(gridRef.current);
      gridRef.current = newGrid;

      intervalRef.current = window.setTimeout(
        () => requestAnimationFrame(animate),
        10,
      );
    };

    animate();

    // Event handlers
    const handlePointerMove = (event: PointerEvent) => {
      isRealMouseActiveRef.current = true;
      const rect = canvas.getBoundingClientRect();
      targetPosRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerLeave = () => {
      isRealMouseActiveRef.current = false;
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.style.touchAction = "none";

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize); // Clean up resize listener
    };
  }, [initializeGrid, updateGrid, clearLineBetweenPoints]);

  return (
    <div className="relative overflow-hidden h-full w-full">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {children}
    </div>
  );
};

export default PageHeader;
