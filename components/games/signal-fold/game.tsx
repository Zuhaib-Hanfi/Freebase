"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, CircleDot, CircuitBoard, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import { createPuzzle, east, north, readTile, size, south, traceSignal, turnLine, west } from "./engine";
import type { Line, Puzzle, QuarterTurn } from "./engine";
import styles from "./game.module.css";

const coordinates = Array.from({ length: size }, (_, index) => index);
const columns = ["A", "B", "C", "D", "E"];
const wirePorts = [
  { direction: north, point: "24 0" },
  { direction: east, point: "48 24" },
  { direction: south, point: "24 48" },
  { direction: west, point: "0 24" },
];

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

function makeLevel(number: number) {
  return { ...createPuzzle(number), number };
}

function Wire({ mask }: { mask: number }) {
  const ends = wirePorts.filter(({ direction }) => mask & direction);
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path d={`M ${ends[0].point} Q 24 24 ${ends[1].point}`} />
    </svg>
  );
}

function BoardTranscript({
  board,
  reached,
  sourceRow,
  targetRow,
}: {
  board: Puzzle["board"];
  reached: Set<number>;
  sourceRow: number;
  targetRow: number;
}) {
  return (
    <details className={styles.transcript}>
      <summary>Read the board</summary>
      <p>The entry port is on row {sourceRow + 1}. The receiver is on row {targetRow + 1}.</p>
      <ul>
        {coordinates.map((row) => (
          <li key={row}>
            <strong>Row {row + 1}.</strong>{" "}
            {coordinates.map((column) => {
              const index = row * size + column;
              const power = reached.has(index) ? ", powered" : "";
              return `${columns[column]} ${readTile(board[index])}${power}`;
            }).join(". ")}.
          </li>
        ))}
      </ul>
    </details>
  );
}

export function SignalFold() {
  const [level, setLevel] = useState(() => makeLevel(1));
  const [history, setHistory] = useState<Puzzle["board"][]>([]);
  const [selected, setSelected] = useState<Line>(() => ({ axis: "row", index: level.sourceRow }));
  const board = history.at(-1) ?? level.board;
  const signal = traceSignal(board, level.sourceRow, level.targetRow);
  const selectedName = selected.axis === "row" ? `row ${selected.index + 1}` : `column ${columns[selected.index]}`;

  function turn(direction: QuarterTurn) {
    setHistory((moves) => {
      const current = moves.at(-1) ?? level.board;
      if (traceSignal(current, level.sourceRow, level.targetRow).connected) return moves;
      return [...moves, turnLine(current, selected, direction)];
    });
  }

  function undo() {
    setHistory((moves) => moves.slice(0, -1));
  }

  function restart() {
    setHistory([]);
    setSelected({ axis: "row", index: level.sourceRow });
  }

  function advance() {
    const next = makeLevel(level.number + 1);
    setLevel(next);
    setHistory([]);
    setSelected({ axis: "row", index: next.sourceRow });
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (!(event.target instanceof HTMLElement) || !event.target.closest("button")) return;
    const key = event.key.toLowerCase();

    if (key === "q" || key === "e") {
      event.preventDefault();
      if (!event.repeat) turn(key === "q" ? -1 : 1);
    } else if (key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown") {
      event.preventDefault();
      const axis = key === "arrowleft" || key === "arrowright" ? "column" : "row";
      const step = key === "arrowleft" || key === "arrowup" ? -1 : 1;
      setSelected((previous) => ({ axis, index: (previous.index + step + size) % size }));
    } else if (key === "z") {
      event.preventDefault();
      if (!event.repeat) undo();
    }
  }

  return (
    <section aria-label="Signal Fold puzzle" className={styles.layout} onKeyDown={handleKeys}>
      <div className={styles.station}>
        <div className={styles.stationBar}>
          <span><CircuitBoard size={18} aria-hidden="true" /> Puzzle {formatNumber(level.number)}</span>
          <span><strong>{history.length}</strong> {history.length === 1 ? "move" : "moves"}</span>
        </div>

        <div className={styles.cabinet}>
          <div className={styles.boardFrame}>
            <div className={styles.columnAxis} role="group" aria-label="Select a column">
              {columns.map((column, index) => (
                <button
                  type="button"
                  key={column}
                  className={styles.axisKey}
                  aria-label={`Select column ${column}`}
                  aria-pressed={selected.axis === "column" && selected.index === index}
                  onClick={() => setSelected({ axis: "column", index })}
                >
                  {column}
                </button>
              ))}
            </div>
            <div className={styles.rowAxis} role="group" aria-label="Select a row">
              {coordinates.map((row) => (
                <button
                  type="button"
                  key={row}
                  className={styles.axisKey}
                  aria-label={`Select row ${row + 1}`}
                  aria-pressed={selected.axis === "row" && selected.index === row}
                  onClick={() => setSelected({ axis: "row", index: row })}
                >
                  {row + 1}
                  {row === level.sourceRow && <span className={styles.sourcePort} aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className={styles.circuit} aria-hidden="true">
              {board.map((mask, index) => {
                const coordinate = selected.axis === "row" ? Math.floor(index / size) : index % size;
                return (
                  <div key={index} className={styles.tile} data-live={signal.reached.has(index)} data-selected={coordinate === selected.index}>
                    <Wire mask={mask} />
                  </div>
                );
              })}
            </div>
            <div className={styles.receiverAxis} aria-hidden="true">
              {coordinates.map((row) => (
                <div key={row}>
                  {row === level.targetRow && <span className={styles.receiverPort} data-live={signal.connected} />}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.boardLegend} aria-hidden="true">
            <span><i className={styles.legendSource} /> Entry port</span>
            <span><i className={styles.legendReceiver} /> Receiver</span>
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <div className={styles.actionArea}>
          <div className={styles.status} role="status">
            {signal.connected ? <Check size={18} aria-hidden="true" /> : <CircleDot size={18} aria-hidden="true" />}
            <span>
              {signal.connected
                ? `Circuit complete in ${history.length} ${history.length === 1 ? "move" : "moves"}.`
                : `${selectedName[0].toUpperCase() + selectedName.slice(1)} selected. ${signal.reached.size} ${signal.reached.size === 1 ? "tile" : "tiles"} powered.`}
            </span>
          </div>
          <div className={styles.turnControls} role="group" aria-label={`Rotate ${selectedName}`}>
            <button type="button" className="button" aria-disabled={signal.connected} onClick={() => turn(-1)}>
              <RotateCcw size={17} aria-hidden="true" /> Turn left
            </button>
            <button type="button" className="button" aria-disabled={signal.connected} onClick={() => turn(1)}>
              <RotateCw size={17} aria-hidden="true" /> Turn right
            </button>
          </div>
          <div className={styles.utilityControls}>
            <button type="button" className="button button-small" disabled={!history.length} onClick={undo}>
              <Undo2 size={16} aria-hidden="true" /> Undo
            </button>
            <button type="button" className="button button-small" disabled={!history.length} onClick={restart}>Restart</button>
            <button type="button" className={signal.connected ? "button button-small button-primary" : "button button-small"} onClick={advance}>
              Next puzzle
            </button>
          </div>
        </div>

        <aside className={styles.instructions} aria-labelledby="signal-fold-instructions">
          <h2 id="signal-fold-instructions">How to play</h2>
          <ol>
            <li>Select a numbered row or lettered column.</li>
            <li>Turn it left or right. Every tile in that line rotates together.</li>
            <li>Connect the lit entry to the receiver. Powered tiles show how far the signal travels.</li>
          </ol>
          <div className={styles.keyboardGuide}>
            <h3>Keyboard</h3>
            <dl>
              <div><dt>Choose a line</dt><dd>Arrow keys</dd></div>
              <div><dt>Turn left or right</dt><dd><kbd>Q</kbd> <kbd>E</kbd></dd></div>
              <div><dt>Undo</dt><dd><kbd>Z</kbd></dd></div>
            </dl>
          </div>
          <BoardTranscript board={board} reached={signal.reached} sourceRow={level.sourceRow} targetRow={level.targetRow} />
        </aside>
      </div>
    </section>
  );
}
