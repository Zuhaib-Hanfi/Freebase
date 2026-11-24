import type { Metadata } from 'next';
import Link from 'next/link';
import { CircuitBoard, Orbit } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ResourceCard } from '@/components/resource-card';
import { reviewedResources } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Play',
  description: 'Play original games on Freebase and discover free games that run in your browser.',
};

const originals = [
  {
    href: '/play/orbit-courier/',
    title: 'Orbit Courier',
    type: '3D arcade',
    description: 'Switch between orbital lanes, collect cargo, and dodge debris as each wave gets faster.',
    icon: Orbit,
  },
  {
    href: '/play/signal-fold/',
    title: 'Signal Fold',
    type: 'Logic puzzle',
    description: 'Rotate rows and columns to connect two ports. A live trace shows where the signal stops.',
    icon: CircuitBoard,
  },
];

const picks = [
  { title: 'Puzzles & strategy', names: ['Simon Tatham’s Portable Puzzle Collection', '0h h1', 'Waffle', 'Lichess'] },
  { title: 'Maps & exploration', names: ['Travle', 'Globle', 'City Guesser', 'NASA Explore Mars'] },
  { title: 'Arcade & creative', names: ['Celeste Classic', 'Tetris', 'A Dark Room', 'Infinite Craft'] },
  { title: 'Play with friends', names: ['Codenames Online', 'Gartic Phone', 'skribbl.io', 'Board Game Arena'] },
];

const browserGames = reviewedResources.filter((resource) => resource.tags.includes('browser game'));
const byName = new Map(browserGames.map((resource) => [resource.name, resource]));

export default function PlayPage() {
  return (
    <div className="container inner-page">
      <Breadcrumbs links={[{ href: '/', title: 'Home' }]} current="Play" />
      <header className="page-heading"><h1>Play</h1><p>Play two original games here, or find one to open in your browser.</p></header>
      <section aria-labelledby="original-games">
        <div className="section-heading"><h2 id="original-games">Play on Freebase</h2></div>
        <div className="play-grid">
          {originals.map((game) => (
            <article className="play-card" key={game.href}>
              <span className="task-icon" aria-hidden="true"><game.icon size={21} /></span>
              <span className="badge">{game.type}</span>
              <h3>{game.title}</h3><p>{game.description}</p>
              <Link className="button button-primary" href={game.href}>Play {game.title}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="browser-games">
        <div className="section-heading">
          <div><h2 id="browser-games">Browser games</h2><p>Pick a game below or explore all {browserGames.length} source-reviewed web games.</p></div>
          <Link className="button" href="/?category=games&amp;q=browser+game&amp;reviewed=1">See all browser games</Link>
        </div>
        {picks.map((group) => (
          <section className="game-pick-section" key={group.title}>
            <h3>{group.title}</h3>
            <div className="resource-grid play-resource-grid">
              {group.names.flatMap((name) => {
                const resource = byName.get(name);
                return resource ? [<ResourceCard key={resource.slug} resource={resource} />] : [];
              })}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
