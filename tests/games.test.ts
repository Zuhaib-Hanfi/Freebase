import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, createRun, steer } from '../components/games/orbit-courier/simulation.ts';
import { createPuzzle, lines, traceSignal, turnLine } from '../components/games/signal-fold/engine.ts';

test('Orbit Courier caps steering and rewards a clean run through the first wave', () => {
  const random = () => 0.2;
  const run = createRun(random);
  steer(run, -1);
  steer(run, -1);
  assert.equal(run.lane, 0);
  for (let frame = 0; frame < 3_000 && run.resolved < 8; frame++) advance(run, 0.04, random);
  assert.equal(run.hull, 3);
  assert.equal(run.wave, 2);
  assert.equal(run.deliveries, 7);
  assert(run.score > 700);
});

test('Orbit Courier ends the run after three debris hits', () => {
  const random = () => 0.2;
  const run = createRun(random);
  assert.equal(run.lane, 1);
  for (let frame = 0; frame < 3_000 && run.hull > 0; frame++) advance(run, 0.04, random);
  assert.equal(run.hull, 0);
  const formations = run.formations.length;
  advance(run, 1, random);
  assert.equal(run.resolved, 3);
  assert.equal(run.formations.length, formations);
  assert.match(run.lastEvent, /Run complete/);
});

test('Signal Fold has deterministic, unsolved openings and reversible turns', () => {
  for (let level = 1; level <= 100; level++) {
    const puzzle = createPuzzle(level);
    assert.deepEqual(puzzle, createPuzzle(level));
    assert.equal(puzzle.board.length, 25);
    assert.equal(traceSignal(puzzle.board, puzzle.sourceRow, puzzle.targetRow).connected, false);
    for (const line of lines) {
      assert.deepEqual(turnLine(turnLine(puzzle.board, line, 1), line, -1), puzzle.board);
    }
  }
});
