import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { OrbitCourier } from "@/components/games/orbit-courier/orbit-courier";
import styles from "@/components/games/orbit-courier/orbit-courier.module.css";

export const metadata: Metadata = {
  title: "Orbit Courier",
  description: "Run a three-lane orbital delivery circuit. Catch cargo, dodge debris and try to beat your best run.",
};

export default function OrbitCourierPage() {
  return (
    <div className="container inner-page">
      <Breadcrumbs links={[{ href: "/", title: "Home" }, { href: "/play/", title: "Play" }]} current="Orbit Courier" />
      <header className={styles.heading}>
        <h1>Orbit Courier</h1>
        <p>Pick up cargo and dodge debris as your orbital route gets faster.</p>
      </header>
      <OrbitCourier />
    </div>
  );
}
