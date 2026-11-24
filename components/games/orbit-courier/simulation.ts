export const laneNames = ["Inner", "Middle", "Outer"] as const;
export type Lane = 0 | 1 | 2;
export type Cell = "cargo" | "debris" | "clear";
export type Formation = { id: number; angle: number; cells: [Cell, Cell, Cell] };

export type Run = {
  lane: Lane;
  score: number;
  hull: number;
  wave: number;
  streak: number;
  deliveries: number;
  resolved: number;
  formations: Formation[];
  spawnIn: number;
  lastEvent: string;
};

const formationStart = -4.5;

function formation(id: number, angle: number, wave: number, random: () => number): Formation {
  const cargoLane = Math.floor(random() * 3) as Lane;
  const rest = laneNames.map((_, i) => i).filter((i) => i !== cargoLane);
  const cells: Formation["cells"] = ["clear", "clear", "clear"];
  cells[cargoLane] = id % 5 === 0 ? "clear" : "cargo";
  cells[rest[random() < 0.5 ? 0 : 1]] = "debris";
  if (wave >= 2 && id % 2 === 0) cells[rest[0]] = cells[rest[1]] = "debris";
  return { id, angle, cells };
}

export function createRun(random: () => number = Math.random): Run {
  return {
    lane: 1, score: 0, hull: 3, wave: 1, streak: 0, deliveries: 0, resolved: 0,
    formations: [formation(1, -1.55, 1, random), formation(2, -3.03, 1, random), formation(3, formationStart, 1, random)],
    spawnIn: 1.42, lastEvent: "",
  };
}

export function steer(run: Run, direction: -1 | 1) {
  run.lane = Math.max(0, Math.min(2, run.lane + direction)) as Lane;
}

export function advance(run: Run, elapsed: number, random: () => number = Math.random) {
  const speed = Math.min(2.17, 1.04 + (run.wave - 1) * 0.16);
  for (const item of run.formations) item.angle += elapsed * speed;
  let crossedGate = false;
  while (run.formations[0]?.angle >= 0 && run.hull > 0) {
    const item = run.formations.shift()!;
    crossedGate = true;
    run.resolved++;
    const cell = item.cells[run.lane];
    if (cell === "cargo") {
      run.streak++;
      run.deliveries++;
      const points = 100 + Math.min(run.streak - 1, 5) * 20;
      run.score += points;
      run.lastEvent = `Cargo secured. +${points} points.`;
    } else if (cell === "debris") {
      run.hull--;
      run.streak = 0;
      run.lastEvent = run.hull ? `Debris impact. Hull ${run.hull} of 3.` : "Hull breached. Run complete.";
    } else if (item.cells.includes("cargo")) {
      run.streak = 0;
      run.lastEvent = "Cargo missed.";
    } else {
      run.lastEvent = "Debris cleared.";
    }
    run.wave = Math.floor(run.resolved / 6) + 1;
  }
  run.spawnIn -= elapsed;
  if (run.hull && run.spawnIn <= 0) {
    const id = (run.formations.at(-1)?.id ?? run.resolved) + 1;
    run.formations.push(formation(id, formationStart, run.wave, random));
    run.spawnIn = Math.max(0.76, 1.43 - (run.wave - 1) * 0.115);
  }
  return crossedGate;
}
