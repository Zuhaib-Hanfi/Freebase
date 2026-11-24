import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SignalFold } from "@/components/games/signal-fold/game";
import styles from "@/components/games/signal-fold/game.module.css";

export const metadata: Metadata = {
  title: "Signal Fold",
  description: "A free browser puzzle. Rotate whole rows and columns to carry a signal across the circuit.",
};

export default function SignalFoldPage() {
  return (
    <div className="container inner-page">
      <Breadcrumbs links={[{ href: "/", title: "Home" }, { href: "/play/", title: "Play" }]} current="Signal Fold" />
      <header className={styles.heading}>
        <h1>Signal Fold</h1>
        <p>Rotate rows and columns to carry a signal from the left port to the receiver.</p>
      </header>
      <SignalFold />
    </div>
  );
}
