import { useCallback, useEffect, useRef } from "react";
import { isDesktop } from "react-device-detect";

import { useWindowSize } from "@/hooks/useWindowSize";

const HeroASCIIArt = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<boolean[][]>([]);
  const intervalRef = useRef<number>();
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  const initializeGrid = useCallback((rows: number, cols: number) => {
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));

    // Create multiple patterns across the grid
    const patterns = [
      // Gosper glider gun
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
        [10, 0],
        [10, 1],
        [10, 2],
        [11, -1],
        [11, 3],
        [12, -2],
        [12, 4],
        [13, -2],
        [13, 4],
        [14, 1],
        [15, -1],
        [15, 3],
        [16, 0],
        [16, 1],
        [16, 2],
        [17, 1],
        [20, -2],
        [20, -1],
        [20, 0],
        [21, -2],
        [21, -1],
        [21, 0],
        [22, -3],
        [22, 1],
        [24, -4],
        [24, -3],
        [24, 1],
        [24, 2],
        [34, -2],
        [34, -1],
        [35, -2],
        [35, -1],
      ],
      // Pulsar
      [
        [2, 4],
        [2, 5],
        [2, 6],
        [2, 10],
        [2, 11],
        [2, 12],
        [4, 2],
        [4, 7],
        [4, 9],
        [4, 14],
        [5, 2],
        [5, 7],
        [5, 9],
        [5, 14],
        [6, 2],
        [6, 7],
        [6, 9],
        [6, 14],
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 10],
        [7, 11],
        [7, 12],
        [9, 4],
        [9, 5],
        [9, 6],
        [9, 10],
        [9, 11],
        [9, 12],
        [10, 2],
        [10, 7],
        [10, 9],
        [10, 14],
        [11, 2],
        [11, 7],
        [11, 9],
        [11, 14],
        [12, 2],
        [12, 7],
        [12, 9],
        [12, 14],
        [14, 4],
        [14, 5],
        [14, 6],
        [14, 10],
        [14, 11],
        [14, 12],
      ],
    ];

    // Place patterns at different locations
    const placePattern = (
      pattern: number[][],
      baseY: number,
      baseX: number,
    ) => {
      pattern.forEach(([y, x]) => {
        const newY = (baseY + y + rows) % rows;
        const newX = (baseX + x + cols) % cols;
        grid[newY][newX] = true;
      });
    };

    // Place multiple instances of patterns
    placePattern(patterns[0], 10, 10);
    placePattern(patterns[0], rows - 50, cols - 50);
    placePattern(patterns[1], Math.floor(rows / 2), Math.floor(cols / 2));
    placePattern(patterns[1], 20, cols - 30);

    // Add some random cells
    for (let i = 0; i < (rows * cols) / 20; i++) {
      const y = Math.floor(Math.random() * rows);
      const x = Math.floor(Math.random() * cols);
      grid[y][x] = true;
    }

    return grid;
  }, []);

  const updateGrid = useCallback((currentGrid: boolean[][]) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    return currentGrid.map((row, y) =>
      row.map((cell, x) => {
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
          const newY = y + dy;
          const newX = x + dx;
          if (
            newY >= 0 &&
            newY < rows &&
            newX >= 0 &&
            newX < cols &&
            currentGrid[newY][newX]
          ) {
            return count + 1;
          }
          return count;
        }, 0);

        if (cell) {
          return neighbors === 2 || neighbors === 3;
        } else {
          return neighbors === 3;
        }
      }),
    );
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust these values based on device type
    const charWidth = isDesktop ? 10 : 5;
    const charHeight = isDesktop ? 15 : 10;
    const padding = isDesktop ? 10 : 5;

    const cols = Math.floor((windowWidth - padding * 2) / charWidth);
    const rows = Math.floor((windowHeight - padding * 2) / charHeight);

    canvas.width = windowWidth;
    canvas.height = windowHeight;

    // Initialize grid with the Gosper glider gun pattern
    gridRef.current = initializeGrid(rows, cols);

    // Pre-render 5 steps
    for (let i = 0; i < 5; i++) {
      gridRef.current = updateGrid(gridRef.current);
    }

    const kScaleLabsLogo = [
      "                                                         ",
      "  ██╗  ██╗      ███████╗ ██████╗ █████╗ ██╗     ███████╗ ",
      "  ██║ ██╔╝      ██╔════╝██╔════╝██╔══██╗██║     ██╔════╝ ",
      "  █████╔╝ █████╗███████╗██║     ███████║██║     █████╗   ",
      "  ██╔═██╗ ╚════╝╚════██║██║     ██╔══██║██║     ██╔══╝   ",
      "  ██║  ██╗      ███████║╚██████╗██║  ██║███████╗███████╗ ",
      "  ╚═╝  ╚═╝      ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝ ",
      "                                                         ",
      "             ██╗      █████╗ ██████╗ ███████╗            ",
      "             ██║     ██╔══██╗██╔══██╗██╔════╝            ",
      "             ██║     ███████║██████╔╝███████╗            ",
      "             ██║     ██╔══██║██╔══██╗╚════██║            ",
      "             ███████╗██║  ██║██████╔╝███████║            ",
      "             ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝            ",
      "                                                         ",
      "          MOVING HUMANITY UP THE KARDASHEV SCALE         ",
      "                                                         ",
    ];

    const logoHeight = kScaleLabsLogo.length;
    const logoWidth = kScaleLabsLogo[0].length;

    // Logo position
    const logoY = Math.max(0, Math.floor((rows - logoHeight) / 2) - 2);
    const logoX = Math.max(0, Math.floor((cols - logoWidth) / 2));

    const drawGrid = (currentGrid: boolean[][]) => {
      // Use Tailwind's color classes
      const backgroundColor =
        getComputedStyle(document.documentElement).getPropertyValue(
          "--tw-bg-opacity",
        ) === "1"
          ? "#ffffff"
          : "#000000";
      const textColor =
        getComputedStyle(document.documentElement).getPropertyValue(
          "--tw-bg-opacity",
        ) === "1"
          ? "#000000"
          : "#ffffff";

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.font = `${charHeight}px monospace`;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (
            y >= logoY &&
            y < logoY + logoHeight &&
            x >= logoX &&
            x < logoX + logoWidth
          ) {
            const logoChar = kScaleLabsLogo[y - logoY][x - logoX];
            ctx.fillText(
              logoChar,
              x * charWidth + padding,
              y * charHeight + padding,
            );
          } else {
            const char = currentGrid[y][x] ? "█" : " ";
            ctx.fillText(
              char,
              x * charWidth + padding,
              y * charHeight + padding,
            );
          }
        }
      }
    };

    const updateAndDraw = () => {
      gridRef.current = updateGrid(gridRef.current);
      drawGrid(gridRef.current);
    };

    // Initial draw
    drawGrid(gridRef.current);

    // Set up interval for updates
    intervalRef.current = window.setInterval(updateAndDraw, 100);

    // Set up a MutationObserver to watch for changes in the color scheme
    const observer = new MutationObserver(() => {
      drawGrid(gridRef.current);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      observer.disconnect();
    };
  }, [windowWidth, windowHeight, initializeGrid, updateGrid]);

  return (
    <div className="relative rounded-lg w-full overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default HeroASCIIArt;
