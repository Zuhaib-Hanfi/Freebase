"use client";

import { ChevronLeft, ChevronRight, Diamond, Keyboard, Octagon, Pause, Play, RotateCcw, Shield } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { createScene } from "./scene";
import { advance, createRun, laneNames, steer, type Run } from "./simulation";
import styles from "./orbit-courier.module.css";

type Mode = "loading" | "ready" | "playing" | "paused" | "ended" | "unavailable";
const scoreKey = "freebase-orbit-courier-best";
const formatter = new Intl.NumberFormat("en");

function readHud(run: Run) {
  return {
    lane: run.lane, score: run.score, hull: run.hull, wave: run.wave,
    streak: run.streak, deliveries: run.deliveries, next: run.formations[0]?.cells,
  };
}

const preview = () => createRun(() => 0.42);

export function OrbitCourier() {
  const [mode, setMode] = useState<Mode>("loading");
  const [hud, setHud] = useState(() => readHud(preview()));
  const [best, setBest] = useState(0);
  const [display, setDisplay] = useState<"3D" | "2D">("3D");
  const [notice, setNotice] = useState("");
  const modeRef = useRef<Mode>("loading");
  const runRef = useRef<Run>(preview());
  const bestRef = useRef(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);

  function transition(next: Mode) {
    modeRef.current = next;
    setMode(next);
  }

  useEffect(() => {
    let frame = 0;
    let previous = 0;
    let playTime = 0;
    let disposed = false;
    const host = hostRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function tick(now: number) {
      if (disposed || modeRef.current !== "playing") return;
      const elapsed = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
      previous = now;
      playTime += elapsed;
      const run = runRef.current;
      if (advance(run, elapsed)) {
        setHud(readHud(run));
        setNotice(run.lastEvent);
        if (run.score > bestRef.current) {
          bestRef.current = run.score;
          setBest(run.score);
          try { window.localStorage.setItem(scoreKey, String(run.score)); } catch { /* Storage can be disabled. */ }
        }
      }
      sceneRef.current?.render(run, playTime, motion.matches);
      if (!run.hull) transition("ended");
      else frame = window.requestAnimationFrame(tick);
    }

    function pauseOnHide() {
      if (document.hidden && modeRef.current === "playing") {
        transition("paused");
        setNotice("Paused while this tab was hidden.");
      }
    }

    if (host) {
      void import("./scene").then(({ createScene: mount }) => {
        if (disposed) return;
        const scene = mount(host);
        sceneRef.current = scene;
        setDisplay(scene.display);
        scene.render(runRef.current);
        startLoopRef.current = () => {
          window.cancelAnimationFrame(frame);
          previous = 0;
          frame = window.requestAnimationFrame(tick);
        };
        try {
          const stored = Number(window.localStorage.getItem(scoreKey));
          if (Number.isSafeInteger(stored) && stored > 0) bestRef.current = stored;
        } catch { /* Storage can be disabled. */ }
        setBest(bestRef.current);
        transition("ready");
      }).catch(() => {
        if (!disposed) transition("unavailable");
      });
    }

    document.addEventListener("visibilitychange", pauseOnHide);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", pauseOnHide);
      window.cancelAnimationFrame(frame);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      startLoopRef.current = null;
    };
  }, []);

  function begin(restart: boolean) {
    if (!startLoopRef.current) return;
    if (restart) {
      runRef.current = createRun();
      sceneRef.current?.reset();
      sceneRef.current?.render(runRef.current);
      setHud(readHud(runRef.current));
    }
    setNotice(restart ? "Run started. You are in the middle lane." : "Run resumed.");
    transition("playing");
    startLoopRef.current();
    frameRef.current?.focus({ preventScroll: true });
  }

  function pause() {
    if (modeRef.current !== "playing") return;
    transition("paused");
    setNotice("Run paused.");
    frameRef.current?.focus({ preventScroll: true });
  }

  function changeLane(direction: -1 | 1) {
    if (modeRef.current !== "playing") return;
    steer(runRef.current, direction);
    setHud(readHud(runRef.current));
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    const current = modeRef.current;
    if (current === "playing" && ["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d"].includes(key)) {
      event.preventDefault();
      if (!event.repeat) changeLane(["arrowleft", "arrowup", "a"].includes(key) ? -1 : 1);
    } else if ((key === "p" || key === "escape" || key === " ") && current === "playing") {
      event.preventDefault();
      if (!event.repeat) pause();
    } else if ((key === "p" || key === " ") && current === "paused") {
      event.preventDefault();
      if (!event.repeat) begin(false);
    } else if ((key === " " || key === "enter") && (current === "ready" || current === "ended")) {
      event.preventDefault();
      if (!event.repeat) begin(true);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || modeRef.current !== "playing" || !event.isPrimary) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    pointerRef.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) >= 28 && Math.abs(dx) > Math.abs(event.clientY - start.y)) changeLane(dx < 0 ? -1 : 1);
  }

  const live = mode === "playing" || mode === "paused";
  const cargoLane = hud.next?.indexOf("cargo") ?? -1;
  const incoming = live && hud.next
    ? cargoLane >= 0 ? `Cargo in the ${laneNames[cargoLane].toLowerCase()} lane.` : "Debris only this time."
    : "Start a run to see incoming cargo.";

  return (
    <div className={styles.layout}>
      <section className={styles.console} aria-label="Orbital delivery game">
        <dl className={styles.hud}>
          <div><dt>Score</dt><dd>{formatter.format(hud.score)}</dd></div>
          <div><dt>Best</dt><dd>{formatter.format(best)}</dd></div>
          <div><dt>Wave</dt><dd>{hud.wave}</dd></div>
          <div><dt>Hull</dt><dd><span className="sr-only">{hud.hull} of 3</span><span aria-hidden="true" className={styles.integrity}>{[1, 2, 3].map((value) => <i key={value} className={value <= hud.hull ? styles.intact : undefined} />)}</span></dd></div>
        </dl>

        <div className={styles.stage} ref={frameRef} tabIndex={0} onKeyDown={handleKey} role="region" aria-label="Flight controls" aria-describedby="orbit-instructions">
          <div className={styles.renderHost} ref={hostRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerRef.current = null; }} />
          {display === "2D" && <span className={styles.renderMode}>2D display</span>}
          <span className={styles.stageLane}><Shield size={14} aria-hidden /> {laneNames[hud.lane]} lane</span>
          {mode === "playing" && <span className={styles.incomingCue}>{cargoLane >= 0 ? <Diamond size={15} aria-hidden /> : <Octagon size={15} aria-hidden />}{incoming}</span>}

          {mode !== "playing" && (
            <div className={styles.overlay}>
              {mode === "loading" && <p>Loading orbit…</p>}
              {mode === "ready" && <button className={styles.start} onClick={() => begin(true)}><Play size={17} aria-hidden /> Start run</button>}
              {mode === "paused" && <><h2>Paused</h2><button className={styles.start} onClick={() => begin(false)}><Play size={17} aria-hidden /> Resume</button></>}
              {mode === "ended" && <><h2>Run complete</h2><p>{hud.deliveries} {hud.deliveries === 1 ? "delivery" : "deliveries"} · {formatter.format(hud.score)} points</p><button className={styles.start} onClick={() => begin(true)}><RotateCcw size={16} aria-hidden /> Play again</button></>}
              {mode === "unavailable" && <><h2>Game display unavailable</h2><p>Try opening the game in a browser with canvas support.</p></>}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.steering} aria-label="Steering controls" role="group">
            <button type="button" className="button" disabled={mode !== "playing" || hud.lane === 0} onClick={() => changeLane(-1)}><ChevronLeft size={17} aria-hidden /> Inward</button>
            <button type="button" className="button" disabled={mode !== "playing" || hud.lane === 2} onClick={() => changeLane(1)}>Outward <ChevronRight size={17} aria-hidden /></button>
          </div>
          <div className={styles.commands} aria-label="Run controls" role="group">
            <button className={`button ${styles.iconButton}`} type="button" onClick={() => mode === "paused" ? begin(false) : pause()} disabled={!live} aria-label={mode === "paused" ? "Resume run" : "Pause run"} title={mode === "paused" ? "Resume run" : "Pause run"}>{mode === "paused" ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}</button>
            <button className={`button ${styles.iconButton}`} type="button" onClick={() => begin(true)} disabled={!live} aria-label="Restart run" title="Restart run"><RotateCcw size={18} aria-hidden /></button>
          </div>
        </div>
        <p className="sr-only" role="status">{notice}{notice && live ? ` ${incoming}` : ""}</p>
      </section>

      <aside className={styles.guide} aria-labelledby="orbit-guide">
        <div className={styles.next}>
          <h2>Next at the gate</h2>
          <p>{incoming}</p>
          {live && hud.next && <ol className={styles.lanes} aria-label="Incoming formation from the inner lane to the outer lane">{hud.next.map((cell, i) => <li key={laneNames[i]} data-cell={cell}><span>{laneNames[i]}</span><strong>{cell === "cargo" ? "Cargo" : cell === "debris" ? "Debris" : "Clear"}</strong></li>)}</ol>}
        </div>
        <h2 id="orbit-guide">How to play</h2>
        <p id="orbit-instructions">Use <kbd>←</kbd> <kbd>→</kbd> or the steering buttons to change lanes. On touchscreens, you can also swipe on the orbit. Press <kbd>P</kbd> to pause.</p>
        <ul className={styles.rules}>
          <li><Diamond size={19} aria-hidden /><span><strong>Catch the cargo.</strong> Meet each diamond where it crosses the gate. Consecutive pickups earn more points.</span></li>
          <li><Octagon size={19} aria-hidden /><span><strong>Avoid the debris.</strong> Three hits end your run. Every six formations, the orbit speeds up.</span></li>
        </ul>
        <span className={styles.controlHint}><Keyboard size={16} aria-hidden /> Space starts, pauses or resumes</span>
      </aside>
    </div>
  );
}
