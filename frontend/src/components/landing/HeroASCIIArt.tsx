import { useCallback, useEffect, useRef, useState } from "react";
import { isDesktop } from "react-device-detect";
import { FaChevronDown } from "react-icons/fa";

import { useWindowSize } from "@/hooks/useWindowSize";
import mainLogo from "assets/mainLogo.png";

const HeroASCIIArt = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const activeCellsRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [logoExpanded, setLogoExpanded] = useState(false);
  const [currentRule, setCurrentRule] = useState(0);
  const [gridInitialized, setGridInitialized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [noUpdateCount, setNoUpdateCount] = useState(0);

  const initializeGrid = useCallback((rows: number, cols: number) => {
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));
    const activeSet = new Set<string>();

    // Add a hard-coded starting square in the center
    const centerY = Math.floor(rows / 2);
    const centerX = Math.floor(cols / 2);
    const squareSize = 5;

    for (let y = centerY - squareSize; y < centerY + squareSize; y++) {
      for (let x = centerX - squareSize; x < centerX + squareSize; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
          grid[y][x] = true;
          activeSet.add(`${y},${x}`);
        }
      }
    }

    // Add a few random cells to introduce some variability
    const factor = isDesktop ? 0.025 : 0.05;
    for (let i = 0; i < Math.floor(rows * cols * factor); i++) {
      const y = Math.floor(Math.random() * rows);
      const x = Math.floor(Math.random() * cols);
      grid[y][x] = true;
      activeSet.add(`${y},${x}`);
    }

    activeCellsRef.current = activeSet;
    return grid;
  }, []);

  const rules = [
    // Mazectric rules
    (neighbors: number, cell: boolean) =>
      cell ? neighbors >= 1 && neighbors <= 5 : neighbors === 3,
    // Conway's Game of Life rules
    // (neighbors: number, cell: boolean) =>
    //   cell ? neighbors === 2 || neighbors === 3 : neighbors === 3,
    // HighLife rules
    // (neighbors: number, cell: boolean) =>
    //   cell
    //     ? neighbors === 2 || neighbors === 3
    //     : neighbors === 3 || neighbors === 6,
    // Seeds rules
    // (neighbors: number, cell: boolean) =>
    //   cell ? neighbors === 2 || neighbors === 3 : neighbors === 2,
    // Brians Brain rules
    // (neighbors: number, cell: boolean) =>
    //   cell
    //     ? neighbors === 2 || neighbors === 3
    //     : neighbors === 3 || neighbors === 6,
    // 34 Life rules
    // (neighbors: number, cell: boolean) =>
    //   cell ? neighbors === 3 || neighbors === 4 : neighbors === 3,
    // 2x2 rules
    // (neighbors: number, cell: boolean) =>
    //   cell ? neighbors === 2 || neighbors === 3 : neighbors === 2,
  ];

  const updateGrid = useCallback(
    (currentGrid: boolean[][]) => {
      const rows = currentGrid.length;
      const cols = currentGrid[0].length;
      const rule = rules[currentRule];
      const newGrid = currentGrid.map((row) => [...row]);
      const newActiveCells = new Set<string>();
      let cellsUpdated = false;

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

        const newState = rule(neighbors, currentGrid[y][x]);
        newGrid[y][x] = newState;

        if (newState) {
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

        if (newState !== currentGrid[y][x]) {
          cellsUpdated = true;
        }
      };

      // Check all currently active cells and their neighbors
      activeCellsRef.current.forEach((cellKey) => {
        const [y, x] = cellKey.split(",").map(Number);
        checkAndUpdateCell(y, x);
      });

      // Unset cells in a circular radius around the mouse position
      if (mousePosRef.current) {
        const radius = isDesktop ? 20 : 10;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const y = (mousePosRef.current.y + dy + rows) % rows;
              const x = (mousePosRef.current.x + dx + cols) % cols;
              newGrid[y][x] = false;
              newActiveCells.delete(`${y},${x}`);
            }
          }
        }
      }

      if (!cellsUpdated) {
        setNoUpdateCount((prev) => prev + 1);
      } else {
        setNoUpdateCount(0);
      }

      activeCellsRef.current = newActiveCells;
      return newGrid;
    },
    [currentRule, rules],
  );

  const drawHardCodedStartingBlock = useCallback((grid: boolean[][]) => {
    const rows = grid.length;
    const cols = grid[0].length;

    // Generate random position for the top-left corner of the pattern
    const startY = Math.floor(Math.random() * (rows - 1));
    const startX = Math.floor(Math.random() * (cols - 1));
    grid[startY][startX] = true;

    // Add some random noise around the pattern
    const noiseRadius = 3;
    for (let dy = -noiseRadius; dy <= noiseRadius; dy++) {
      for (let dx = -noiseRadius; dx <= noiseRadius; dx++) {
        const gridY = (startY + dy + rows) % rows;
        const gridX = (startX + dx + cols) % cols;
        if (Math.random() < 0.3) {
          // 30% chance of adding a live cell
          grid[gridY][gridX] = true;
          activeCellsRef.current.add(`${gridY},${gridX}`);
        }
      }
    }

    return grid;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const charWidth = 5;
    const charHeight = 8;
    const padding = 5;

    const cols = Math.floor((windowWidth - padding * 2) / charWidth);
    const rows = Math.floor((windowHeight - padding * 2) / charHeight);

    canvas.width = windowWidth;
    canvas.height = windowHeight;

    if (!gridInitialized) {
      gridRef.current = initializeGrid(rows, cols);
      setGridInitialized(true);
    }

    const drawGrid = (currentGrid: boolean[][]) => {
      const backgroundColor = "#000000";
      const textColor = "#cccccc";

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = `${charHeight}px monospace`;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const char = getCharForPosition(currentGrid, x, y);
          ctx.fillText(char, x * charWidth + padding, y * charHeight + padding);
        }
      }
    };

    const updateAndDraw = () => {
      gridRef.current = updateGrid(gridRef.current);

      if (noUpdateCount >= 2) {
        gridRef.current = drawHardCodedStartingBlock(gridRef.current);
        setNoUpdateCount(0);
      }

      drawGrid(gridRef.current);
    };

    drawGrid(gridRef.current);
    intervalRef.current = window.setInterval(updateAndDraw, 50);

    // Add rule changing interval
    const ruleChangeInterval = window.setInterval(() => {
      setCurrentRule((prevRule) => (prevRule + 1) % rules.length);
    }, 2500);

    const observer = new MutationObserver(() => {
      drawGrid(gridRef.current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left - padding) / charWidth);
      const y = Math.floor((event.clientY - rect.top - padding) / charHeight);
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
      clearInterval(ruleChangeInterval);
      observer.disconnect();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    windowWidth,
    windowHeight,
    initializeGrid,
    updateGrid,
    gridInitialized,
    noUpdateCount,
    drawHardCodedStartingBlock,
  ]);

  // Separate useEffect for logo expansion
  useEffect(() => {
    const timer = setTimeout(() => setLogoExpanded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const logoContainerStyle: React.CSSProperties = {
    opacity: logoExpanded ? 1 : 0,
    transition: "opacity 5s ease-in-out",
    boxShadow: "0 0 50px 10px rgba(255, 255, 255, 0.3)", // Add this line
  };

  // Separate useEffect for expansion
  useEffect(() => {
    const timer = setTimeout(() => setExpanded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const fadeInStyle: React.CSSProperties = {
    opacity: expanded ? 1 : 0,
    transition: "opacity 5s ease-in-out",
  };

  const handleScrollClick = () => {
    const nextSection = document.getElementById("first-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative rounded-lg w-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center m-4">
        <div
          style={logoContainerStyle}
          className="border-2 border-white max-w-96"
        >
          <img
            src={mainLogo}
            alt="Main Logo"
            className="w-full h-auto"
            onClick={() => {
              setGridInitialized(false);
            }}
          />
        </div>
      </div>
      {/* Updated scroll hint icon positioning */}
      <div
        style={fadeInStyle}
        className="absolute bottom-8 left-0 right-0 flex justify-center items-center text-white animate-bounce cursor-pointer"
        onClick={handleScrollClick}
      >
        <FaChevronDown size={24} />
      </div>
    </div>
  );
};

const getCharForPosition = (
  grid: boolean[][],
  x: number,
  y: number,
): string => {
  if (!grid[y][x]) return " ";

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
  if (top) return "╹";
  if (bottom) return "╻";
  if (left) return "╸";
  if (right) return "╺";

  return "·";
};

export default HeroASCIIArt;
