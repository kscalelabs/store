import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useWindowSize } from "@/hooks/useWindowSize";
import mainLogo from "@/images/KScaleASCII.png";

const HeroASCIIArt = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const activeCellsRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [logoExpanded, setLogoExpanded] = useState(false);
  const [gridInitialized, setGridInitialized] = useState(false);

  const rule = (neighbors: number, cell: boolean) =>
    cell ? neighbors >= 1 && neighbors <= 5 : neighbors === 3;

  const updateGrid = useCallback((currentGrid: boolean[][]) => {
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
        // Add neighbors to be checked in the next iteration
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const newY = (y + dy + rows) % rows;
            const newX = (x + dx + cols) % cols;
            newActiveCells.add(`${newY},${newX}`);
          }
        }
      }
    };

    // Check all currently active cells and their neighbors
    activeCellsRef.current.forEach((cellKey) => {
      const [y, x] = cellKey.split(",").map(Number);
      checkAndUpdateCell(y, x);
    });

    if (mousePosRef.current) {
      const radius = 15;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const y = (mousePosRef.current.y + dy + rows) % rows;
            const x = (mousePosRef.current.x + dx + cols) % cols;
            newGrid[y][x] = false;
            newActiveCells.add(`${y},${x}`);
          }
        }
      }
    }

    activeCellsRef.current = newActiveCells;
    return newGrid;
  }, []);

  const initializeGrid = useCallback(
    (rows: number, cols: number) => {
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

      // Step the simulation once
      const updatedGrid = updateGrid(grid);

      return updatedGrid;
    },
    [updateGrid],
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas height to 70% of screen height
    canvas.height = Math.floor(windowHeight * 0.7);

    const desiredCellCount = 200;
    let charWidth: number, charHeight: number;
    if (windowWidth > windowHeight) {
      charWidth = Math.floor(windowWidth / desiredCellCount);
      charHeight = charWidth; // Make cells square
    } else {
      charHeight = Math.floor(windowHeight / desiredCellCount);
      charWidth = charHeight; // Make cells square
    }

    // Minimum char width and height
    const minCharWidth = 5;
    const minCharHeight = 8;
    if (charWidth < minCharWidth) charWidth = minCharWidth;
    if (charHeight < minCharHeight) charHeight = minCharHeight;

    const cols = Math.floor(windowWidth / charWidth);
    const rows = Math.floor(windowHeight / charHeight);

    canvas.width = windowWidth;
    canvas.height = Math.floor(windowHeight * 0.7);

    if (!gridInitialized) {
      gridRef.current = initializeGrid(rows, cols);
      setGridInitialized(true);
    }

    const drawGrid = (currentGrid: boolean[][]) => {
      const backgroundColor = "#111111";
      const textColor = "#ff4f00";
      // const textColor = "white";

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = `${charHeight}px monospace`;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const char = getCharForPosition(currentGrid, x, y);
          ctx.fillText(char, x * charWidth, (y + 1) * charHeight);
        }
      }
    };

    const updateAndDraw = () => {
      gridRef.current = updateGrid(gridRef.current);
      drawGrid(gridRef.current);
    };

    drawGrid(gridRef.current);
    intervalRef.current = window.setInterval(updateAndDraw, 33);

    const observer = new MutationObserver(() => {
      drawGrid(gridRef.current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / charWidth);
      const y = Math.floor((event.clientY - rect.top) / charHeight);
      mousePosRef.current = { x, y };
    };

    const handleMouseLeave = () => {
      mousePosRef.current = null;
    };

    // Change these to use document instead of canvas
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      observer.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [windowWidth, windowHeight, initializeGrid, updateGrid, gridInitialized]);

  // Separate useEffect for logo expansion
  useEffect(() => {
    const timer = setTimeout(() => setLogoExpanded(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const logoContainerStyle: React.CSSProperties = {
    opacity: logoExpanded ? 1 : 0,
    transition: "opacity 1s ease-in-out",
  };

  return (
    <div className="relative rounded-lg w-full h-[70vh] overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-[2px]"></div>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center m-4">
        <div
          style={logoContainerStyle}
          className="rounded-xl cursor-pointer transition-shadow duration-300 shadow-[0_0_12px_rgba(255,79,0,0.7)] hover:shadow-[0_0_24px_rgba(255,79,0,0.7)]"
        >
          <img
            src={mainLogo}
            alt="Main Logo"
            className="w-[720px] h-[100px] rounded-lg"
            onClick={() => {
              setGridInitialized(false);
            }}
          />
        </div>
        <h1 className="hidden text-2xl sm:text-4xl md:text-6xl text-center">
          K-Scale Labs
        </h1>
        <h2 className="text-gray-1 text-lg sm:text-xl md:text-2xl text-center md:max-w-2xl mt-4 sm:mt-8">
          Program robots with K-Lang, our language purpose-built for humanoid
          robots.
        </h2>
        <Button className="mt-4 bg-[#ff4f00] hover:bg-[#ff6a00]">
          Watch Demo
          <span className="ml-2 text-sm">1 minute</span>
        </Button>
      </div>
    </div>
  );
};

const getCharForPosition = (
  grid: boolean[][],
  x: number,
  y: number,
): string => {
  if (!grid || !grid[y] || !grid[y][x]) return " ";

  const top = y > 0 && grid[y - 1][x];
  const bottom = y < grid.length - 1 && grid[y + 1][x];
  const left = x > 0 && grid[y][x - 1];
  const right = x < grid[0].length - 1 && grid[y][x + 1];

  if (top && bottom && left && right) return "╋";
  if (top && bottom && left) return "┫";
  if (top && bottom && right) return "┣";
  if (top && left && right) return "┻";
  if (bottom && left && right) return "┳";
  if (top && bottom) return "┃";
  if (left && right) return "━";
  if (top && right) return "┗";
  if (top && left) return "┛";
  if (bottom && right) return "┏";
  if (bottom && left) return "┓";
  if (top) return "┃";
  if (bottom) return "┃";
  if (left) return "━";
  if (right) return "━";

  return " ";
};

export default HeroASCIIArt;
