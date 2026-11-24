export const size = 5;
export const north = 1;
export const east = 2;
export const south = 4;
export const west = 8;

type Board = readonly number[];
export type Line = { axis: "row" | "column"; index: number };
export type QuarterTurn = -1 | 1;
export type Puzzle = { board: Board; sourceRow: number; targetRow: number };

const directions = [
  { bit: north, opposite: south, row: -1, column: 0, label: "up" },
  { bit: east, opposite: west, row: 0, column: 1, label: "right" },
  { bit: south, opposite: north, row: 1, column: 0, label: "down" },
  { bit: west, opposite: east, row: 0, column: -1, label: "left" },
] as const;

const tileShapes = [north | south, east | west, north | east, east | south, south | west, west | north];
export const lines: readonly Line[] = [
  ...Array.from({ length: size }, (_, index) => ({ axis: "row" as const, index })),
  ...Array.from({ length: size }, (_, index) => ({ axis: "column" as const, index })),
];

export function turnLine(board: Board, line: Line, direction: QuarterTurn): Board {
  return board.map((mask, index) => {
    const coordinate = line.axis === "row" ? Math.floor(index / size) : index % size;
    if (coordinate !== line.index) return mask;
    return direction === 1 ? ((mask << 1) | (mask >>> 3)) & 15 : (mask >>> 1) | ((mask & 1) << 3);
  });
}

export function readTile(mask: number): string {
  return directions.filter(({ bit }) => mask & bit).map(({ label }) => label).join(" and ");
}

export function traceSignal(board: Board, sourceRow: number, targetRow: number) {
  const source = sourceRow * size;
  const target = targetRow * size + size - 1;
  const reached = new Set<number>();

  if (board[source] & west) {
    reached.add(source);
    for (const index of reached) {
      const row = Math.floor(index / size);
      const column = index % size;
      for (const direction of directions) {
        const nextRow = row + direction.row;
        const nextColumn = column + direction.column;
        if (!(board[index] & direction.bit) || nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size) {
          continue;
        }
        const next = nextRow * size + nextColumn;
        if (board[next] & direction.opposite) reached.add(next);
      }
    }
  }

  return { reached, connected: reached.has(target) && Boolean(board[target] & east) };
}

function seededRandom(seed: number) {
  let state = Math.imul(seed, 2_654_435_761) >>> 0;
  return (limit: number) => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return Math.floor((state / 2 ** 32) * limit);
  };
}

export function createPuzzle(number: number): Puzzle {
  const random = seededRandom(number);
  const sourceRow = random(size);
  let row = sourceRow;
  const path = [sourceRow * size];

  // Each column adds one vertical run before the path advances to the right.
  for (let column = 0; column < size; column++) {
    const end = random(size);
    while (row !== end) {
      row += Math.sign(end - row);
      path.push(row * size + column);
    }
    if (column < size - 1) path.push(row * size + column + 1);
  }

  const targetRow = row;
  const solved = Array.from({ length: size * size }, () => tileShapes[random(tileShapes.length)]);
  function port(from: number, to: number) {
    const delta = to - from;
    return delta === 1 ? east : delta === -1 ? west : delta === size ? south : north;
  }
  path.forEach((index, position) => {
    const entry = position === 0 ? west : port(index, path[position - 1]);
    const exit = position === path.length - 1 ? east : port(index, path[position + 1]);
    solved[index] = entry | exit;
  });

  const turns = Math.min(3 + Math.floor((number - 1) / 3), 6);
  for (let attempt = 0; attempt < 16; attempt++) {
    const available = [...lines];
    let board: Board = solved;
    for (let step = 0; step < turns; step++) {
      const [line] = available.splice(random(available.length), 1);
      board = turnLine(board, line, random(2) === 0 ? -1 : 1);
    }
    if (!traceSignal(board, sourceRow, targetRow).connected) {
      return { board, sourceRow, targetRow };
    }
  }

  // Turning the source row away from its incoming port guarantees an unsolved fallback.
  const sourceLine: Line = { axis: "row", index: sourceRow };
  const clockwise = turnLine(solved, sourceLine, 1);
  const board = clockwise[sourceRow * size] & west ? turnLine(solved, sourceLine, -1) : clockwise;
  return { board, sourceRow, targetRow };
}
