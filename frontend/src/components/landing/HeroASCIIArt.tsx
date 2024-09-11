import { useCallback, useEffect, useRef } from "react";

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

    // Add a hard-coded starting square in the center
    const centerY = Math.floor(rows / 2);
    const centerX = Math.floor(cols / 2);
    const squareSize = 5;

    for (let y = centerY - squareSize; y < centerY + squareSize; y++) {
      for (let x = centerX - squareSize; x < centerX + squareSize; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) {
          grid[y][x] = true;
        }
      }
    }

    // Add a few random cells to introduce some variability
    for (let i = 0; i < Math.floor(rows * cols * 0.02); i++) {
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
          const newY = (y + dy + rows) % rows;
          const newX = (x + dx + cols) % cols;
          return count + (currentGrid[newY][newX] ? 1 : 0);
        }, 0);

        if (cell) {
          // Mazectric rules for live cells
          return neighbors >= 1 && neighbors <= 5;
        } else {
          // Mazectric rules for dead cells
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

    const charWidth = 5;
    const charHeight = 8;
    const padding = 5;

    const cols = Math.floor((windowWidth - padding * 2) / charWidth);
    const rows = Math.floor((windowHeight - padding * 2) / charHeight);

    canvas.width = windowWidth;
    canvas.height = windowHeight;

    gridRef.current = initializeGrid(rows, cols);

    const drawGrid = (currentGrid: boolean[][]) => {
      const backgroundColor = "#000000";
      const textColor = "#ffffff";

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
      drawGrid(gridRef.current);
    };

    drawGrid(gridRef.current);
    intervalRef.current = window.setInterval(updateAndDraw, 100);

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
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-2/3 border border-white p-4 bg-black text-xs md:text-base">
          <pre className="text-white leading-none whitespace-pre font-mono">
            {kScaleLabsLogo.join("\n")}
          </pre>
        </div>
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

  if (top && bottom && left && right) return "╬";
  if (top && bottom && left) return "╣";
  if (top && bottom && right) return "╠";
  if (top && left && right) return "╩";
  if (bottom && left && right) return "╦";
  if (top && bottom) return "║";
  if (left && right) return "═";
  if (top && right) return "╚";
  if (top && left) return "╝";
  if (bottom && right) return "╔";
  if (bottom && left) return "╗";
  if (top) return "╨";
  if (bottom) return "╥";
  if (left) return "╡";
  if (right) return "╞";

  return "█";
};

const kScaleLabsLogo = [
  "                                            ",
  " ██╗ ██╗    █████╗█████╗ ████╗ ██╗   ████╗ ",
  " ██║██╔╝    ██╔══╝██╔══╝██╔═██╗██║   ██╔═╝ ",
  " █████╔╝███╗█████╗██║   ██████║██║   ███╗  ",
  " ██╔═██╗╚══╝╚══██║██║   ██╔═██║██║   ██╔╝  ",
  " ██║ ██╗    █████║█████╗██║ ██║█████╗████╗ ",
  " ╚═╝ ╚═╝    ╚════╝╚════╝╚═╝ ╚═╝╚════╝╚═══╝ ",
  "                                           ",
  "          ██╗    ████╗ █████╗ █████╗       ",
  "          ██║   ██╔═██╗██╔═██╗██╔══╝       ",
  "          ██║   ██████║█████╔╝█████╗       ",
  "          ██║   ██╔═██║██╔═██╗╚══██║       ",
  "          █████╗██║ ██║█████╔╝█████║       ",
  "          ╚════╝╚═╝ ╚═╝╚════╝ ╚════╝       ",
  "                                           ",
  "   MOVING HUMANITY UP THE KARDASHEV SCALE  ",
  "                                           ",
];

export default HeroASCIIArt;
